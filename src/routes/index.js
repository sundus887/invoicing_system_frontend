// src/routes/index.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute, { AdminRoute, SellerRoute } from '../components/ProtectedRoute';
import Layout from '../components/Layout';

// Import your page components with correct paths
import Login from '../pages/Login'; // Fixed: Login.jsx exists
import Dashboard from '../pages/Dashboard'; // Fixed: Dashboard.jsx exists
import Services from '../pages/Services'; // Fixed: Services.jsx exists
import Invoices from '../pages/Invoices'; // Fixed: Invoices.jsx exists
import Clients from '../pages/Clients'; // Fixed: Clients.jsx exists
import TasksPage from '../pages/TasksPage'; // Fixed: TasksPage.jsx exists
import ExportPage from '../pages/ExportPage'; // Fixed: ExportPage.jsx exists
import FbrEInvoicing from '../pages/FbrEInvoicing'; // Fixed: FbrEInvoicing.jsx exists
import Settings from '../pages/Settings'; // Fixed: Settings.jsx exists
import UserRoles from '../pages/UserRoles'; // Fixed: UserRoles.jsx exists
import SellerConfigurationPage from '../pages/SellerConfigurationPage'; // Fixed: SellerConfigurationPage.jsx exists

const AppRoutes = () => {
  const { loading } = useAuth();

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
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes with Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="services" element={<SellerRoute><Services /></SellerRoute>} />
        <Route path="invoices" element={<SellerRoute><Invoices /></SellerRoute>} />
        <Route path="clients" element={<SellerRoute><Clients /></SellerRoute>} />
        <Route path="tasks" element={<SellerRoute><TasksPage /></SellerRoute>} />
        <Route path="export" element={<SellerRoute><ExportPage /></SellerRoute>} />
        <Route path="fbr-e-invoicing" element={<SellerRoute><FbrEInvoicing /></SellerRoute>} />
        <Route path="settings" element={<Settings />} />
        <Route path="user-roles" element={<AdminRoute><UserRoles /></AdminRoute>} />
        <Route path="sellers" element={<AdminRoute><SellerConfigurationPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;