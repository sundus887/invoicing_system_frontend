// src/services/auth.js
import { setAuthToken } from './api';

// Login function (replace with real API call)
export const login = (username, password) => {
  // Demo: sirf admin/admin ko allow karta hai
  if (username === "admin" && password === "admin") {
    localStorage.setItem("user", JSON.stringify({ username }));
    // Set a dummy token for demo and sync axios header
    localStorage.setItem('token', 'dummy-token');
    setAuthToken('dummy-token');
    return true;
  }
  return false;
};

// Enhanced login function for email/password
export const loginWithEmail = (email, password) => {
  // Tax consultancy credentials
  if (email === 'hsoftworks36@gmail.com' && password === 'softwarecompany') {
    const userData = {
      name: 'HS Softworks Admin',
      email: email,
      role: 'admin',
      sellerId: 'admin-seller-123' // Add sellerId for admin to access seller routes
    };
    
    try {
      // Persist user and token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'dummy-token');
      setAuthToken('dummy-token');
      // Also persist sellerId for pages that read it directly
      if (userData.sellerId) {
        localStorage.setItem('sellerId', userData.sellerId);
      }
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
  
  // Tax Nexus credentials
  if (email === 'taxnexus710@gmail.com' && password === 'Taxnexus123') {
    const userData = {
      name: 'Tax Nexus Admin',
      email: email,
      role: 'admin',
      sellerId: 'taxnexus-seller-001' // Add sellerId for admin to access seller routes
    };
    
    try {
      // Persist user and token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'dummy-token');
      setAuthToken('dummy-token');
      // Also persist sellerId for pages that read it directly
      if (userData.sellerId) {
        localStorage.setItem('sellerId', userData.sellerId);
      }
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
  
  return false;
};

// Logout function
export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem('sellerId');
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};