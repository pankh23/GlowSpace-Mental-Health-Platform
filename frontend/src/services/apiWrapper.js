import requestManager from '../utils/requestManager';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

class ApiWrapper {
  constructor() {
    this.baseURL = API_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  getAuthHeaders() {
    const TOKEN_KEY = btoa('glow_access_token');
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      return {
        ...this.defaultHeaders,
        Authorization: `Bearer ${atob(token)}`
      };
    }

    return this.defaultHeaders;
  }

  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getAuthHeaders();

    const config = {
      method: method.toLowerCase(),
      url,
      headers,
      ...options
    };

    if (data && method === 'GET') {
      config.params = data;
    } else if (data) {
      config.data = data;
    }

    try {
      const response = await requestManager.executeRequest(config);
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        this.handleUnauthorized();
      }
      throw error;
    }
  }

  handleUnauthorized() {
    const TOKEN_KEY = btoa('glow_access_token');
    const REFRESH_KEY = btoa('glow_refresh_token');

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  get(endpoint, params = {}, options = {}) {
    return this.request('GET', endpoint, params, options);
  }

  post(endpoint, data = {}, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  put(endpoint, data = {}, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  cancelAllRequests() {
    requestManager.cancelAllRequests();
  }

  clearCache() {
    requestManager.clearCache();
  }

  getStats() {
    return requestManager.getStats();
  }
}

const apiWrapper = new ApiWrapper();


// Dashboard API
export const dashboardAPI = {
  getDashboardData: () => apiWrapper.get('/dashboard/data'),
  getUserProgress: () => apiWrapper.get('/dashboard/progress'),
  getEmotionTrends: () => apiWrapper.get('/dashboard/emotions/trends'),
  getActivitySummary: () => apiWrapper.get('/dashboard/activity/summary'),
  getGoalProgress: () => apiWrapper.get('/dashboard/goals/progress'),
  getRecentActivities: () => apiWrapper.get('/dashboard/activities/recent')
};


// Mood API
export const moodAPI = {
  createEntry: (data) => apiWrapper.post('/mood/entries', data),
  getEntries: (params = {}) => apiWrapper.get('/mood/entries', params),
  updateEntry: (id, data) => apiWrapper.put(`/mood/entries/${id}`, data),
  deleteEntry: (id) => apiWrapper.delete(`/mood/entries/${id}`),
  getDashboardData: () => apiWrapper.get('/mood/dashboard'),
  getAnalytics: (params = {}) => apiWrapper.get('/mood/analytics', params),
  getPatterns: (params = {}) => apiWrapper.get('/mood/patterns', params),
  getStreaks: () => apiWrapper.get('/mood/streaks'),
  getInsights: (params = {}) => apiWrapper.get('/mood/insights', params),
  getRecentMood: () => apiWrapper.get('/mood/recent'),

  uploadVoice: (formData) =>
    apiWrapper.post('/mood/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  uploadPhoto: (formData) =>
    apiWrapper.post('/mood/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  acknowledgeAlert: (id) =>
    apiWrapper.post(`/mood/alerts/${id}/acknowledge`)
};


// Emotion API
export const emotionAPI = {
  analyzeEmotion: (data) => apiWrapper.post('/emotions/analyze', data),
  getEmotionHistory: () => apiWrapper.get('/emotions/history'),
  getEmotionTrends: () => apiWrapper.get('/emotions/trends'),
  getEmotionInsights: () => apiWrapper.get('/emotions/insights'),
  getEmotionDistribution: () => apiWrapper.get('/emotions/distribution'),
  getEmotionSession: (sessionId) => apiWrapper.get(`/emotions/session/${sessionId}`),
  updateEmotionContext: (id, data) => apiWrapper.put(`/emotions/${id}/context`, data),
  deleteEmotionData: (id) => apiWrapper.delete(`/emotions/${id}`)
};


// Appointment API
export const appointmentAPI = {
  getUpcoming: () => apiWrapper.get('/appointments/upcoming'),
  history: () => apiWrapper.get('/appointments/history'),
  details: (id) => apiWrapper.get(`/appointments/${id}`),
  schedule: (data) => apiWrapper.post('/appointments/schedule', data),
  reschedule: (id, data) => apiWrapper.put(`/appointments/${id}/reschedule`, data),
  cancel: (id) => apiWrapper.delete(`/appointments/${id}`),
  updateNotes: (id, data) => apiWrapper.put(`/appointments/${id}/notes`, data),
  getAvailableSlots: (date) => apiWrapper.get(`/appointments/slots`, { date })
};


// Auth API
export const authAPI = {
  login: (credentials) => apiWrapper.post('/auth/login', credentials),
  register: (userData) => apiWrapper.post('/auth/register', userData),
  logout: () => apiWrapper.post('/auth/logout'),
  getProfile: () => apiWrapper.get('/auth/me'),
  updateProfile: (data) => apiWrapper.put('/auth/profile', data),
  refreshToken: (refreshToken) => apiWrapper.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => apiWrapper.put('/auth/change-password', data)
};


export { apiWrapper };
export default apiWrapper;
