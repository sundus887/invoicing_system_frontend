import axios from 'axios';

// Use deployed backend for production, local for development
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://hsoftworks.vercel.app'
  : 'http://localhost:5000';

console.log('🚀 Using API URL:', API_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: `${API_URL}/api`, // Add /api to base URL
  timeout: 15000,
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
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🌐 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    console.log(`   Auth token present: ${!!token}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and multi-tenancy
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Response error from ${error.config?.url}:`, error.response?.status, error.response?.data);
    
    // Handle specific multi-tenancy errors
    if (error.response?.status === 403) {
      const errorMessage = error.response.data?.message;
      
      // Handle seller context errors
      if (errorMessage?.includes('Seller context required') || 
          errorMessage?.includes('Seller settings not found') ||
          errorMessage?.includes('Buyer account not properly linked')) {
        console.error('🔒 Multi-tenancy error:', errorMessage);
        
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
      console.error('🔐 Authentication error - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
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
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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

export default api;