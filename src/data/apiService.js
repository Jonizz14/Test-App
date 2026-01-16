const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
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

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: this.getAuthHeaders(isFormData ? 'multipart/form-data' : 'application/json'),
      ...options,
    };

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

  async get(endpoint) {
    const response = await this.request(endpoint);
    return response.json();
  }

  async post(endpoint, data) {
    const isFormData = data instanceof FormData;
    const response = await this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
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
    const isFormData = data instanceof FormData;
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
    });
    return response.json();
  }

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    return response.ok;
  }

  // Authentication methods
  async login(email, password) {
    // Backend expects 'username' field, so we'll send email as username
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
    return data.user;
  }

  async register(userData) {
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
    return data.user;
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }

  // User methods
  async getUsers() {
    return this.get('/users/');
  }

  async getUser(id) {
    return this.get(`/users/${id}/`);
  }

  async updateUser(id, data) {
    return this.put(`/users/${id}/`, data);
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}/`);
  }

  // Test methods
  async getTests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/tests/${queryString ? `?${queryString}` : ''}`);
  }

  // Public test methods (no authentication required)
  async getPublicTests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    // Use fetch directly without authentication headers
    const url = `${this.baseURL}/tests/public_list/${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async getPublicStats() {
    const url = `${this.baseURL}/tests/public_stats/`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async getTest(id) {
    return this.get(`/tests/${id}/`);
  }

  async createTest(data) {
    return this.post('/tests/', data);
  }

  async updateTest(id, data) {
    return this.patch(`/tests/${id}/`, data);
  }

  async deleteTest(id) {
    return this.delete(`/tests/${id}/`);
  }

  // Question methods
  async getQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/questions/${queryString ? `?${queryString}` : ''}`);
  }

  // Public question methods (no authentication required)
  async getPublicQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    // Use fetch directly without authentication headers
    const url = `${this.baseURL}/questions/public_list/${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async createQuestion(data) {
    return this.post('/questions/', data);
  }

  async updateQuestion(id, data) {
    return this.put(`/questions/${id}/`, data);
  }

  async deleteQuestion(id) {
    return this.delete(`/questions/${id}/`);
  }

  // Test attempt methods
  async getAttempts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/attempts/${queryString ? `?${queryString}` : ''}`);
  }

  async getAttempt(id) {
    return this.get(`/attempts/${id}/`);
  }

  async createAttempt(data) {
    return this.post('/attempts/', data);
  }

  async updateAttempt(id, data) {
    return this.put(`/attempts/${id}/`, data);
  }

  // Feedback methods
  async getFeedback(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/feedback/${queryString ? `?${queryString}` : ''}`);
  }

  async createFeedback(data) {
    return this.post('/feedback/', data);
  }

  async updateFeedback(id, data) {
    return this.put(`/feedback/${id}/`, data);
  }

  // Test session methods
  async getSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/sessions/${queryString ? `?${queryString}` : ''}`);
  }

  async startSession(testId) {
    return this.post('/sessions/start_session/', { test_id: testId });
  }

  async getSession(sessionId) {
    return this.get(`/sessions/get_session/?session_id=${sessionId}`);
  }

  async updateSessionAnswers(sessionId, answers) {
    return this.put('/sessions/update_answers/', {
      session_id: sessionId,
      answers: answers
    });
  }

  async completeSession(sessionId) {
    return this.post('/sessions/complete_session/', { session_id: sessionId });
  }

  async autoExpireSessions() {
    return this.post('/sessions/auto_expire_sessions/', {});
  }

  // Warning methods
  async logWarning(data) {
    return this.post('/warnings/log_warning/', data);
  }



  // Ban management methods
  async banUser(userId, reason) {
    return this.post(`/users/${userId}/ban_user/`, { reason });
  }

  async unbanUser(userId) {
    return this.post(`/users/${userId}/unban_user/`);
  }

  async unbanWithCode(code) {
    return this.post('/users/unban_with_code/', { code });
  }

  async banCurrentUser(reason) {
    return this.post('/users/ban_current_user/', { reason });
  }

  async giveStars(userId, data) {
    return this.post(`/users/${userId}/give_stars/`, data);
  }

  // Premium management methods
  async grantPremium(userId, pricingId) {
    return this.patch(`/users/${userId}/grant_premium/`, { pricing_id: pricingId });
  }

  async revokePremium(userId) {
    return this.patch(`/users/${userId}/revoke_premium/`);
  }

  // Pricing methods
  async getPricing() {
    return this.get('/pricing/');
  }

  async createPricing(data) {
    return this.post('/pricing/', data);
  }

  async updatePricing(id, data) {
    return this.patch(`/pricing/${id}/`, data);
  }

  async deletePricing(id) {
    return this.delete(`/pricing/${id}/`);
  }

  // Star package methods
  async getStarPackages() {
    return this.get('/star-packages/');
  }

  async createStarPackage(data) {
    return this.post('/star-packages/', data);
  }

  async updateStarPackage(id, data) {
    return this.patch(`/star-packages/${id}/`, data);
  }

  async deleteStarPackage(id) {
    return this.delete(`/star-packages/${id}/`);
  }

  // Gift methods
  async getGifts() {
    return this.get('/gifts/');
  }

  async createGift(data) {
    return this.post('/gifts/', data);
  }

  async updateGift(id, data) {
    return this.patch(`/gifts/${id}/`, data);
  }

  async deleteGift(id) {
    return this.delete(`/gifts/${id}/`);
  }

  // Student gift methods
  async getStudentGifts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/student-gifts/${queryString ? `?${queryString}` : ''}`);
  }

  async getMyGifts() {
    return this.get('/student-gifts/my_gifts/');
  }

  async getPlacedGifts() {
    return this.get('/student-gifts/placed_gifts/');
  }

  async purchaseGift(giftId) {
    return this.post('/student-gifts/purchase_gift/', { gift_id: giftId });
  }

  async placeGift(studentGiftId, position) {
    return this.post(`/student-gifts/${studentGiftId}/place_gift/`, { position });
  }

  // Plan selection methods
  async selectPlan(planType) {
    return this.post('/users/select_plan/', { plan_type: planType });
  }

  async approvePlan(userId) {
    return this.post(`/users/${userId}/approve_plan/`);
  }

  // Contact message methods
  async getContactMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/contact-messages/admin_list/${queryString ? `?${queryString}` : ''}`);
  }

  async submitContactMessage(data) {
    return this.post('/contact-messages/', data);
  }

  async updateContactMessageStatus(messageId, data) {
    return this.patch(`/contact-messages/${messageId}/update_status/`, data);
  }

  async replyToContactMessage(messageId, data) {
    return this.post(`/contact-messages/${messageId}/reply/`, data);
  }

  // User's own contact message methods
  async getMyContactMessages() {
    return this.get('/contact-messages/my_messages/');
  }

  async editContactMessage(messageId, data) {
    return this.put(`/contact-messages/${messageId}/edit_message/`, data);
  }

  async deleteContactMessage(messageId) {
    return this.delete(`/contact-messages/${messageId}/delete_message/`);
  }

  // Delete profile picture and status for specific student
  async deleteStudentProfileData(studentId) {
    return this.patch(`/users/${studentId}/delete_profile_data/`, {
      delete_profile_photo: true,
      delete_profile_status: true
    });
  }

}

const apiService = new ApiService();
export default apiService;