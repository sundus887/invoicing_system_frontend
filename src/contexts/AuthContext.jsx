// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getCurrentUser, logout as authLogout, loginWithEmail } from '../services/auth';

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
          
          // Set seller ID if user is a seller or admin
          if (currentUser && currentUser.sellerId) {
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
      console.log('🔐 AuthContext: Attempting login for:', credentials.email);
      
      // Use the actual auth service
      const success = loginWithEmail(credentials.email, credentials.password);
      console.log('🔐 AuthContext: Login success:', success);
      
      if (success) {
        const user = getCurrentUser();
        console.log('🔐 AuthContext: Retrieved user:', user);
        setUser(user);
        
        // Set seller ID if user is a seller or admin
        if (user && user.sellerId) {
          console.log('🔐 AuthContext: Setting sellerId:', user.sellerId);
          setSellerId(user.sellerId);
        }
        
        return { success: true, user };
      } else {
        console.log('🔐 AuthContext: Login failed - invalid credentials');
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
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