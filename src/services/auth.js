// src/services/auth.js

// Login function (replace with real API call)
export const login = (username, password) => {
  // Demo: sirf admin/admin ko allow karta hai
  if (username === "admin" && password === "admin") {
    localStorage.setItem("user", JSON.stringify({ username }));
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
      localStorage.setItem('token', 'dummy-token');
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
  
  // Add your credentials
  if (email === 'hamda09@gmail.com' && password === 'your_password_here') {
    const userData = {
      name: 'Hamda Admin',
      email: email,
      role: 'admin',
      sellerId: 'admin-seller-456' // Add sellerId for admin to access seller routes
    };
    
    try {
      localStorage.setItem('token', 'dummy-token');
      localStorage.setItem('user', JSON.stringify(userData));
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