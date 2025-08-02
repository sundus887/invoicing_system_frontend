import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAuthenticated } from '../services/auth';

const ProtectedRoute = ({ children, allowedRoles = [], requireSellerContext = false }) => {
  const { user, sellerId, isSeller, isAdmin, isBuyer, loading } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated() || !user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles are specified
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => {
      switch (role) {
        case 'admin':
          return isAdmin();
        case 'seller':
          return isSeller();
        case 'buyer':
          return isBuyer();
        default:
          return false;
      }
    });

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-sm">
                You don't have permission to access this page. 
                Required roles: {allowedRoles.join(', ')}
              </p>
              <p className="text-sm mt-2">
                Your current role: <strong>{user.role}</strong>
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check if seller context is required
  if (requireSellerContext && !sellerId && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">Seller Context Required</h2>
            <p className="text-sm">
              This page requires seller context. Please contact your administrator 
              to set up your seller profile.
            </p>
            <p className="text-sm mt-2">
              Current user: <strong>{user.name}</strong> ({user.role})
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // All checks passed, render the protected content
  return children;
};

// Convenience components for specific roles
export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

export const SellerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['seller', 'admin']} requireSellerContext={true}>
    {children}
  </ProtectedRoute>
);

export const BuyerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['buyer', 'seller', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const SellerOnlyRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['seller']} requireSellerContext={true}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;