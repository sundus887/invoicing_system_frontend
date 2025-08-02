// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getCurrentUser, logout as authLogout } from '../services/auth';

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
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          setUser(currentUser);
          
          // Set seller ID if user is a seller
          if (currentUser && currentUser.role === 'seller' && currentUser.sellerId) {
            setSellerId(currentUser.sellerId);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      // This would typically call your auth service
      // For now, we'll simulate a login
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: credentials.email,
        role: 'seller',
        sellerId: 'seller-123'
      };
      
      setUser(mockUser);
      setSellerId(mockUser.sellerId);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    try {
      authLogout();
      setUser(null);
      setSellerId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isSeller = () => {
    return user && (user.role === 'seller' || user.role === 'admin');
  };

  const isBuyer = () => {
    return user && (user.role === 'buyer' || user.role === 'seller' || user.role === 'admin');
  };

  const value = {
    user,
    loading,
    sellerId,
    login,
    logout,
    isAdmin,
    isSeller,
    isBuyer
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};