import axios from 'axios';

// Get base URL from environment variables, defaulting to backend API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Main Axios instance — matching Nokk-FE Api.jsx architecture
const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token from localStorage
API.interceptors.request.use(
  (config) => {
    if (config.url?.includes('/auth/login')) {
      return config;
    }
    const token = localStorage.getItem('k8s_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 Unauthorized responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    const hasToken = !!localStorage.getItem('k8s_token');

    if (error.response && error.response.status === 401 && !isLoginEndpoint && hasToken) {
      console.warn('Session expired. Redirecting to login.');
      localStorage.removeItem('k8s_authenticated');
      localStorage.removeItem('k8s_token');
      localStorage.removeItem('k8s_user');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
