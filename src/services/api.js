import axios from 'axios';

// Prefer environment variable, fall back to existing defaults
// Set REACT_APP_API_URL in your environment (Vercel project settings) to override
const envApiUrl = process.env.REACT_APP_API_URL;
const API_URL = envApiUrl && envApiUrl.trim().length > 0
  ? envApiUrl.trim().replace(/\/$/, '') // remove trailing slash if any
  : (process.env.NODE_ENV === 'production'
      ? 'https://hsoftworks.vercel.app' // Deployed backend URL
      : 'http://localhost:5000');

if (process.env.NODE_ENV !== 'production') {
  console.log('🚀 Using API URL:', API_URL);
  console.log('🌍 Environment:', process.env.NODE_ENV);
}

const api = axios.create({
  baseURL: API_URL, // Endpoints below include '/api/...'
  timeout: 15000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication and debugging
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Fixed: Use template literal syntax
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🌐 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
      console.log(`   Auth token present: ${!!token}`);
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
      console.log(`✅ Response received from: ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`❌ Response error from ${error.config?.url}:`, error.response?.status, error.response?.data);
    }
    
    // Handle timeout errors with retry logic
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('⏰ Request timed out, retrying...');
      }
      // Retry the request once
      const originalRequest = error.config;
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        return api.request(originalRequest);
      }
    }
    
    // Handle specific multi-tenancy errors
    if (error.response?.status === 403) {
      const errorMessage = error.response.data?.message;
      // Handle seller context errors
      if (errorMessage?.includes('Seller context required') || 
          errorMessage?.includes('Seller settings not found') ||
          errorMessage?.includes('Buyer account not properly linked')) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('🔒 Multi-tenancy error:', errorMessage);
        }
        // Optionally redirect to login or show specific error
        if (errorMessage?.includes('Seller settings not found')) {
          // Redirect to seller setup page
          window.location.href = '/seller-setup';
        } else if (errorMessage?.includes('Buyer account not properly linked')) {
          // Redirect to login
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
        console.error(`🔐 401 from ${url}. isAuthEndpoint=${isAuthEndpoint}`);
      }
      // Only clear token and redirect for actual auth endpoints to avoid loops
      if (isAuthEndpoint) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // For non-auth endpoints, keep token and let the caller handle gracefully
    }
    
    // Handle 500 server errors (timeout issues)
    if (error.response?.status === 500) {
      const errorMessage = error.response.data?.message;
      if (errorMessage?.includes('timed out') || errorMessage?.includes('buffering')) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('⏰ Server timeout error - this should be resolved with the backend fixes');
        }
        // You can show a user-friendly message here
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
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Fixed: Use template literal syntax
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
      console.log(`🔄 Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default api;