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

    if (data && method === 'GET') config.params = data;
    else if (data) config.data = data;

    const response = await requestManager.executeRequest(config);
    return response;
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
}

const apiWrapper = new ApiWrapper();

export default apiWrapper;
