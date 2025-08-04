import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWithEmail, getCurrentUser, isAuthenticated } from '../services/auth';

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
  const [loading, setLoading] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      setLoading(true);
      try {
        if (isAuthenticated()) {
          const userData = getCurrentUser();
          if (userData) {
            setUser(userData);
            setSellerId(userData.sellerId);
            setUserRole(userData.role);
          } else {
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setSellerId(null);
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setSellerId(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    // Run auth check immediately
    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const { email, password } = credentials;
      const success = loginWithEmail(email, password);
      
      if (success) {
        const userData = getCurrentUser();
        if (userData) {
          setUser(userData);
          setSellerId(userData.sellerId);
          setUserRole(userData.role);
          return { success: true, user: userData };
        } else {
          return { success: false, error: 'Failed to retrieve user data' };
        }
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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