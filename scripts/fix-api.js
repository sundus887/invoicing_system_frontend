const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'services', 'api.js');
const content = `import axios from 'axios';
import { API_BASE } from './apiBase';

// Prefer environment variable, otherwise use centralized API_BASE
// Set REACT_APP_API_URL in your environment (Vercel project settings) to override
const envApiUrl = process.env.REACT_APP_API_URL;

// Decide proxy usage:
// 1) If REACT_APP_USE_PROXY is explicitly set, respect it.
// 2) Otherwise: use proxy by default in production; skip proxy on localhost (CRA dev).
let inferredUseProxy = false;
try {
  const explicit = process.env.REACT_APP_USE_PROXY;
  if (explicit !== undefined) {
    inferredUseProxy = String(explicit).toLowerCase() === 'true';
  } else if (typeof window !== 'undefined') {
    // In browser: proxy unless on localhost (CRA dev)
    inferredUseProxy = window.location.hostname !== 'localhost';
  } else {
    // On server/build time: proxy in production
    inferredUseProxy = process.env.NODE_ENV === 'production';
  }
} catch (_) {}
const useProxy = inferredUseProxy;

// If proxying, we use same-origin serverless route. Otherwise, prefer env/url from API_BASE
const API_URL = useProxy
  ? '/api/proxy'
  : (envApiUrl && envApiUrl.trim().length > 0 ? envApiUrl.trim() : API_BASE).replace(/\/$/, '');

if (process.env.NODE_ENV !== 'production') {
  console.log('🚀 Using API URL:', API_URL, 'useProxy=', useProxy);
  console.log('🌍 Environment:', process.env.NODE_ENV);
}

const api = axios.create({
  baseURL: API_URL, // Endpoints below include '/api/...'
  timeout: 15000, // Increased timeout for production
  withCredentials: true, // Always include cookies for session-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Quick verify: warn if misconfigured in production
if (process.env.NODE_ENV === 'production' && /localhost|127\\.0\\.0\\.1/.test(API_URL)) {
  console.error('❌ Axios baseURL is pointing to localhost in production. Fix to use deployed backend:', API_URL);
}

export const logApiBase = () => {
  const msg = \`Axios baseURL => ${API_URL}\`;
  if (typeof window !== 'undefined') {
    // Attach for quick console access: window.logApiBase()
    window.logApiBase = () => console.log(msg);
  }
  console.log(msg);
  return API_URL;
};

// Add request interceptor for authentication and debugging
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = \`Bearer ${token}\`;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(\`🌐 Making ${config.method?.toUpperCase()} request to: ${config.url}\`);
      console.log(\`   Auth token present: ${!!token}\`);
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and multi-tenancy
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(\`✅ Response received from: ${response.config.url}\`);
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(\`❌ Response error from ${error.config?.url}:\`, error.response?.status, error.response?.data);
    }

    // Handle timeout errors with retry logic
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('⏰ Request timed out, retrying...');
      }
      const originalRequest = error.config;
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        return api.request(originalRequest);
      }
    }

    // Handle specific multi-tenancy errors
    if (error.response?.status === 403) {
      const errorMessage = error.response.data?.message;
      if (
        errorMessage?.includes('Seller context required') ||
        errorMessage?.includes('Seller settings not found') ||
        errorMessage?.includes('Buyer account not properly linked')
      ) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('🔒 Multi-tenancy error:', errorMessage);
        }
        if (errorMessage?.includes('Seller settings not found')) {
          window.location.href = '/seller-setup';
        } else if (errorMessage?.includes('Buyer account not properly linked')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/api/auth');
      if (process.env.NODE_ENV !== 'production') {
        console.error(\`🔐 401 from ${url}. isAuthEndpoint=${isAuthEndpoint}\`);
      }
      // Only clear token and redirect for actual auth endpoints to avoid loops
      if (isAuthEndpoint) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    // Handle 500 server errors (timeout issues)
    if (error.response?.status === 500) {
      const errorMessage = error.response.data?.message;
      if (errorMessage?.includes('timed out') || errorMessage?.includes('buffering')) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('⏰ Server timeout error - this should be resolved with the backend fixes');
        }
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Helper function to get current user token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = \`Bearer ${token}\`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Helper function to clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

// Helper function for retry logic
export const retryRequest = async (requestFn, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(\`🔄 Retry attempt ${attempt}/${maxRetries} in ${delay}ms...\`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default api;
`;

fs.writeFileSync(filePath, content);
console.log('api.js has been repaired.');
