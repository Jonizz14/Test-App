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
              // Retry the original request
              config.headers['Authorization'] = `Bearer ${data.access}`;
              return fetch(url, config);
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }
        // If refresh fails, logout
        this.logout();
        throw new Error('Authentication failed');
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
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
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
}

const apiService = new ApiService();
export default apiService;