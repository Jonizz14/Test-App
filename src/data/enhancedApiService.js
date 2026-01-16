import cacheManager from '../utils/cacheManager';
import { useLoading } from '../context/LoadingContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class EnhancedApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.requestCache = new Map(); // Prevent duplicate requests
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAuthHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Generate unique request key for caching and deduplication
  generateRequestKey(endpoint, options = {}) {
    return `${options.method || 'GET'}-${endpoint}-${JSON.stringify(options.body || {})}`;
  }

  // Check if request is already in progress
  isRequestInProgress(key) {
    return this.requestCache.has(key);
  }

  // Mark request as in progress
  setRequestInProgress(key, promise) {
    this.requestCache.set(key, promise);
    
    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      this.requestCache.delete(key);
    }, 30000);
  }

  // Remove request from cache when done
  removeRequestFromCache(key) {
    this.requestCache.delete(key);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const requestKey = this.generateRequestKey(endpoint, options);
    const config = {
      headers: this.getAuthHeaders(isFormData ? 'multipart/form-data' : 'application/json'),
      ...options,
    };

    // Prevent duplicate requests for same endpoint
    if (this.isRequestInProgress(requestKey) && options.method !== 'POST') {
      console.log(`[API] Request already in progress for: ${endpoint}`);
      return this.requestCache.get(requestKey);
    }

    // Wrap request in promise for caching
    const requestPromise = this.performRequest(url, config, endpoint, options);
    
    // Cache the request promise if it's a GET request
    if ((!options.method || options.method === 'GET') && !options.skipCache) {
      this.setRequestInProgress(requestKey, requestPromise);
    }

    try {
      const response = await requestPromise;
      return response;
    } finally {
      this.removeRequestFromCache(requestKey);
    }
  }

  async performRequest(url, config, endpoint, options) {
    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${this.baseURL}/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              this.setToken(data.access);
              // Update config headers for retry
              config.headers['Authorization'] = `Bearer ${data.access}`;
              // Retry the original request
              const retryResponse = await fetch(url, config);
              if (retryResponse.ok) {
                return retryResponse;
              }
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }
        // If refresh fails, logout
        this.logout();
        throw new Error('Authentication failed - please login again');
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Enhanced GET method with caching and loading states
  async get(endpoint, options = {}) {
    const { 
      useCache = true, 
      cacheDuration,
      forceRefresh = false,
      loadingCallback,
      skipCache = false 
    } = options;

    // Set loading state
    if (loadingCallback) loadingCallback(true);

    try {
      // Try to get from cache first
      if (useCache && !forceRefresh && !skipCache) {
        const cached = cacheManager.getCachedApiResponse(endpoint);
        if (cached) {
          console.log(`[API] Serving ${endpoint} from cache`);
          if (loadingCallback) loadingCallback(false);
          return {
            ...cached.data,
            _meta: {
              fromCache: true,
              source: cached.source,
              age: cached.age
            }
          };
        }
      }

      // Make API request
      const response = await this.request(endpoint);
      const data = await response.json();

      // Cache the response
      if (useCache && !skipCache) {
        cacheManager.cacheApiResponse(endpoint, data);
      }

      if (loadingCallback) loadingCallback(false);
      return {
        ...data,
        _meta: {
          fromCache: false,
          source: 'network',
          age: 0
        }
      };
    } catch (error) {
      if (loadingCallback) loadingCallback(false);
      throw error;
    }
  }

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return response.json();
  }

  async put(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async patch(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return response.json();
  }

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    return response.ok;
  }

  // Enhanced authentication methods with loading states
  async login(email, password, loadingCallback) {
    if (loadingCallback) loadingCallback(true);

    try {
      const response = await fetch(`${this.baseURL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.setToken(data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      // Clear user cache on login
      cacheManager.invalidateRelated('user');
      
      if (loadingCallback) loadingCallback(false);
      return data.user;
    } catch (error) {
      if (loadingCallback) loadingCallback(false);
      throw error;
    }
  }

  async register(userData, loadingCallback) {
    if (loadingCallback) loadingCallback(true);

    try {
      const response = await fetch(`${this.baseURL}/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      this.setToken(data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      if (loadingCallback) loadingCallback(false);
      return data.user;
    } catch (error) {
      if (loadingCallback) loadingCallback(false);
      throw error;
    }
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    
    // Clear all caches on logout
    cacheManager.clear();
  }

  // Enhanced user methods with caching
  async getUsers(loadingCallback) {
    return this.get('/users/', { 
      loadingCallback,
      cacheKey: 'users_list'
    });
  }

  async getUser(id, loadingCallback) {
    return this.get(`/users/${id}/`, { 
      loadingCallback,
      cacheKey: `user_${id}`
    });
  }

  async updateUser(id, data, loadingCallback) {
    const result = await this.put(`/users/${id}/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`user_${id}`);
    cacheManager.invalidateRelated('users_list');
    
    return result;
  }

  async deleteUser(id, loadingCallback) {
    const result = await this.delete(`/users/${id}/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`user_${id}`);
    cacheManager.invalidateRelated('users_list');
    
    return result;
  }

  // Enhanced test methods with caching
  async getTests(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/tests/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `tests_${JSON.stringify(params)}`
    });
  }

  async getPublicTests(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/tests/public_list/${queryString ? `?${queryString}` : ''}`;
    
    if (loadingCallback) loadingCallback(true);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (loadingCallback) loadingCallback(false);
      return data;
    } catch (error) {
      if (loadingCallback) loadingCallback(false);
      throw error;
    }
  }

  async getPublicStats(loadingCallback) {
    const url = `${this.baseURL}/tests/public_stats/`;
    if (loadingCallback) loadingCallback(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (loadingCallback) loadingCallback(false);
      return data;
    } catch (error) {
      if (loadingCallback) loadingCallback(false);
      throw error;
    }
  }

  async getTest(id, loadingCallback) {
    return this.get(`/tests/${id}/`, { 
      loadingCallback,
      cacheKey: `test_${id}`
    });
  }

  async createTest(data, loadingCallback) {
    const result = await this.post('/tests/', data);
    
    // Invalidate tests cache
    cacheManager.invalidateRelated('tests_');
    
    return result;
  }

  async updateTest(id, data, loadingCallback) {
    const result = await this.patch(`/tests/${id}/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`test_${id}`);
    cacheManager.invalidateRelated('tests_');
    
    return result;
  }

  async deleteTest(id, loadingCallback) {
    const result = await this.delete(`/tests/${id}/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`test_${id}`);
    cacheManager.invalidateRelated('tests_');
    
    return result;
  }

  // Enhanced question methods with caching
  async getQuestions(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/questions/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `questions_${JSON.stringify(params)}`
    });
  }

  async getPublicQuestions(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/questions/public_list/${queryString ? `?${queryString}` : ''}`;
    
    if (loadingCallback) loadingCallback(true);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (loadingCallback) loadingCallback(false);
      return data;
    } catch (error) {
      if (loadingCallback) loadingCallback(false);
      throw error;
    }
  }

  async createQuestion(data, loadingCallback) {
    const result = await this.post('/questions/', data);
    
    // Invalidate questions cache
    cacheManager.invalidateRelated('questions_');
    
    return result;
  }

  async updateQuestion(id, data, loadingCallback) {
    const result = await this.put(`/questions/${id}/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`question_${id}`);
    cacheManager.invalidateRelated('questions_');
    
    return result;
  }

  async deleteQuestion(id, loadingCallback) {
    const result = await this.delete(`/questions/${id}/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`question_${id}`);
    cacheManager.invalidateRelated('questions_');
    
    return result;
  }

  // Enhanced attempt methods with caching
  async getAttempts(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/attempts/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `attempts_${JSON.stringify(params)}`
    });
  }

  async getAttempt(id, loadingCallback) {
    return this.get(`/attempts/${id}/`, { 
      loadingCallback,
      cacheKey: `attempt_${id}`
    });
  }

  async createAttempt(data, loadingCallback) {
    return this.post('/attempts/', data);
  }

  async updateAttempt(id, data, loadingCallback) {
    const result = await this.put(`/attempts/${id}/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`attempt_${id}`);
    cacheManager.invalidateRelated('attempts_');
    
    return result;
  }

  // Enhanced session methods with shorter cache duration
  async getSessions(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/sessions/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `sessions_${JSON.stringify(params)}`,
      cacheDuration: 2 * 60 * 1000 // 2 minutes
    });
  }

  async startSession(testId, loadingCallback) {
    return this.post('/sessions/start_session/', { test_id: testId });
  }

  async getSession(sessionId, loadingCallback) {
    return this.get(`/sessions/get_session/?session_id=${sessionId}`, { 
      loadingCallback,
      cacheKey: `session_${sessionId}`,
      cacheDuration: 30 * 1000 // 30 seconds
    });
  }

  async updateSessionAnswers(sessionId, answers, loadingCallback) {
    return this.put('/sessions/update_answers/', {
      session_id: sessionId,
      answers: answers
    });
  }

  async completeSession(sessionId, loadingCallback) {
    const result = await this.post('/sessions/complete_session/', { session_id: sessionId });
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`session_${sessionId}`);
    cacheManager.invalidateRelated('sessions_');
    
    return result;
  }

  async autoExpireSessions(loadingCallback) {
    return this.post('/sessions/auto_expire_sessions/', {});
  }

  // Enhanced statistics methods with short cache
  async getStatistics(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/statistics/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `statistics_${JSON.stringify(params)}`,
      cacheDuration: 1 * 60 * 1000 // 1 minute
    });
  }

  // Enhanced pricing methods with longer cache
  async getPricing(loadingCallback) {
    return this.get('/pricing/', { 
      loadingCallback,
      cacheKey: 'pricing',
      cacheDuration: 30 * 60 * 1000 // 30 minutes
    });
  }

  async createPricing(data, loadingCallback) {
    const result = await this.post('/pricing/', data);
    
    // Invalidate pricing cache
    cacheManager.invalidateRelated('pricing');
    
    return result;
  }

  async updatePricing(id, data, loadingCallback) {
    const result = await this.patch(`/pricing/${id}/`, data);
    
    // Invalidate pricing cache
    cacheManager.invalidateRelated('pricing');
    
    return result;
  }

  async deletePricing(id, loadingCallback) {
    const result = await this.delete(`/pricing/${id}/`);
    
    // Invalidate pricing cache
    cacheManager.invalidateRelated('pricing');
    
    return result;
  }

  // Enhanced star package methods with caching
  async getStarPackages(loadingCallback) {
    return this.get('/star-packages/', { 
      loadingCallback,
      cacheKey: 'star_packages',
      cacheDuration: 30 * 60 * 1000 // 30 minutes
    });
  }

  async createStarPackage(data, loadingCallback) {
    const result = await this.post('/star-packages/', data);
    
    // Invalidate star packages cache
    cacheManager.invalidateRelated('star_packages');
    
    return result;
  }

  async updateStarPackage(id, data, loadingCallback) {
    const result = await this.patch(`/star-packages/${id}/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`star_package_${id}`);
    cacheManager.invalidateRelated('star_packages');
    
    return result;
  }

  async deleteStarPackage(id, loadingCallback) {
    const result = await this.delete(`/star-packages/${id}/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`star_package_${id}`);
    cacheManager.invalidateRelated('star_packages');
    
    return result;
  }

  // Enhanced gift methods with caching
  async getGifts(loadingCallback) {
    return this.get('/gifts/', { 
      loadingCallback,
      cacheKey: 'gifts',
      cacheDuration: 30 * 60 * 1000 // 30 minutes
    });
  }

  async createGift(data, loadingCallback) {
    const result = await this.post('/gifts/', data);
    
    // Invalidate gifts cache
    cacheManager.invalidateRelated('gifts');
    
    return result;
  }

  async updateGift(id, data, loadingCallback) {
    const result = await this.patch(`/gifts/${id}/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`gift_${id}`);
    cacheManager.invalidateRelated('gifts');
    
    return result;
  }

  async deleteGift(id, loadingCallback) {
    const result = await this.delete(`/gifts/${id}/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`gift_${id}`);
    cacheManager.invalidateRelated('gifts');
    
    return result;
  }

  // Student gift methods
  async getStudentGifts(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/student-gifts/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `student_gifts_${JSON.stringify(params)}`
    });
  }

  async getMyGifts(loadingCallback) {
    return this.get('/student-gifts/my_gifts/', { 
      loadingCallback,
      cacheKey: 'my_gifts'
    });
  }

  async getPlacedGifts(loadingCallback) {
    return this.get('/student-gifts/placed_gifts/', { 
      loadingCallback,
      cacheKey: 'placed_gifts'
    });
  }

  async purchaseGift(giftId, loadingCallback) {
    const result = await this.post('/student-gifts/purchase_gift/', { gift_id: giftId });
    
    // Invalidate related caches
    cacheManager.invalidateRelated('my_gifts');
    cacheManager.invalidateRelated('student_gifts');
    
    return result;
  }

  async placeGift(studentGiftId, position, loadingCallback) {
    const result = await this.post(`/student-gifts/${studentGiftId}/place_gift/`, { position });
    
    // Invalidate related caches
    cacheManager.invalidateRelated('placed_gifts');
    cacheManager.invalidateRelated('my_gifts');
    
    return result;
  }

  // Plan selection methods
  async selectPlan(planType, loadingCallback) {
    const result = await this.post('/users/select_plan/', { plan_type: planType });
    
    // Invalidate user cache
    cacheManager.invalidateRelated('user');
    
    return result;
  }

  async approvePlan(userId, loadingCallback) {
    const result = await this.post(`/users/${userId}/approve_plan/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`user_${userId}`);
    cacheManager.invalidateRelated('users_list');
    
    return result;
  }

  // Contact message methods
  async getContactMessages(params = {}, loadingCallback) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/contact-messages/admin_list/${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint, { 
      loadingCallback,
      cacheKey: `contact_messages_${JSON.stringify(params)}`
    });
  }

  async submitContactMessage(data, loadingCallback) {
    return this.post('/contact-messages/', data);
  }

  async updateContactMessageStatus(messageId, data, loadingCallback) {
    const result = await this.patch(`/contact-messages/${messageId}/update_status/`, data);
    
    // Invalidate related caches
    cacheManager.invalidateRelated('contact_messages');
    
    return result;
  }

  async replyToContactMessage(messageId, data, loadingCallback) {
    return this.post(`/contact-messages/${messageId}/reply/`, data);
  }

  // User's own contact message methods
  async getMyContactMessages(loadingCallback) {
    return this.get('/contact-messages/my_messages/', { 
      loadingCallback,
      cacheKey: 'my_contact_messages'
    });
  }

  async editContactMessage(messageId, data, loadingCallback) {
    return this.put(`/contact-messages/${messageId}/edit_message/`, data);
  }

  async deleteContactMessage(messageId, loadingCallback) {
    const result = await this.delete(`/contact-messages/${messageId}/delete_message/`);
    
    // Invalidate related caches
    cacheManager.invalidateRelated('my_contact_messages');
    
    return result;
  }

  // Delete profile picture and status for specific student
  async deleteStudentProfileData(studentId, loadingCallback) {
    const result = await this.patch(`/users/${studentId}/delete_profile_data/`, {
      delete_profile_photo: true,
      delete_profile_status: true
    });
    
    // Invalidate related caches
    cacheManager.invalidateRelated(`user_${studentId}`);
    cacheManager.invalidateRelated('users_list');
    
    return result;
  }

  // Cache management methods
  clearCache() {
    cacheManager.clear();
  }

  getCacheStats() {
    return cacheManager.getStats();
  }

  // Preload common data
  async preloadData(loadingCallback) {
    if (loadingCallback) loadingCallback(true);
    
    try {
      await cacheManager.preloadCommonData(this);
    } finally {
      if (loadingCallback) loadingCallback(false);
    }
  }
}

const enhancedApiService = new EnhancedApiService();
export default enhancedApiService;

// React hook for enhanced API calls with loading states
export const useEnhancedApi = () => {
  const { setLoading, isLoading } = useLoading();
  
  const apiCall = async (apiMethod, loadingKey, ...args) => {
    const loadingCallback = (loading) => setLoading(loadingKey, loading);
    
    try {
      return await apiMethod(...args, loadingCallback);
    } catch (error) {
      loadingCallback(false);
      throw error;
    }
  };
  
  return {
    apiCall,
    isLoading: (key) => isLoading(key),
    setLoading
  };
};