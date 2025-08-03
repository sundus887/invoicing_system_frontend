import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const userData = response.data.user;
            setUser(userData);
            setSellerId(userData.sellerId);
            setUserRole(userData.role);
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            setUser(null);
            setSellerId(null);
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        setUser(null);
        setSellerId(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Update state
        setUser(userData);
        setSellerId(userData.sellerId);
        setUserRole(userData.role);
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSellerId(null);
    setUserRole(null);
  };

  // Helper functions for role checking
  const isSeller = () => userRole === 'seller';
  const isAdmin = () => userRole === 'admin';
  const isBuyer = () => userRole === 'buyer';

  const value = {
    user,
    sellerId,
    userRole,
    loading,
    login,
    logout,
    isSeller,
    isAdmin,
    isBuyer
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};