// src/routes/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute, { AdminRoute, SellerRoute, BuyerRoute } from '../components/ProtectedRoute';

// Import your page components
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ServicesPage from '../pages/ServicesPage';
import InvoicesPage from '../pages/InvoicesPage';
import ClientsPage from '../pages/ClientsPage';
import TasksPage from '../pages/TasksPage';
import ExportPage from '../pages/ExportPage';
import FbrEInvoicingPage from '../pages/FbrEInvoicingPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPanel from '../pages/AdminPanel';
import Navbar from '../components/Navbar';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show Navbar only if user is authenticated */}
      {user && <Navbar />}
      
      <main className="container mx-auto px-4 py-6">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          {/* Seller Routes */}
          <Route path="/services" element={
            <SellerRoute>
              <ServicesPage />
            </SellerRoute>
          } />
          
          <Route path="/invoices" element={
            <SellerRoute>
              <InvoicesPage />
            </SellerRoute>
          } />
          
          <Route path="/clients" element={
            <SellerRoute>
              <ClientsPage />
            </SellerRoute>
          } />
          
          <Route path="/tasks" element={
            <SellerRoute>
              <TasksPage />
            </SellerRoute>
          } />
          
          <Route path="/export" element={
            <SellerRoute>
              <ExportPage />
            </SellerRoute>
          } />
          
          <Route path="/fbr-einvoicing" element={
            <SellerRoute>
              <FbrEInvoicingPage />
            </SellerRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
          
          {/* Buyer Routes */}
          <Route path="/profile" element={
            <BuyerRoute>
              <ProfilePage />
            </BuyerRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default AppRoutes;