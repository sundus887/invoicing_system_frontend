import axios from 'axios';

// Use local backend for testing
const API_URL = 'http://localhost:5000';

console.log('🚀 Using API URL:', API_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Response error from ${error.config?.url}:`, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;