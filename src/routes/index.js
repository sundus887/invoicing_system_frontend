// src/routes/index.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute, { AdminRoute, SellerRoute } from '../components/ProtectedRoute';

// Lazy-load page components for route-level code splitting
const Layout = lazy(() => import(/* webpackChunkName: "layout" */ '../components/Layout'));
const Login = lazy(() => import(/* webpackChunkName: "page-login" */ '../pages/Login'));
const Dashboard = lazy(() => import(/* webpackChunkName: "page-dashboard" */ '../pages/Dashboard'));
const Services = lazy(() => import(/* webpackChunkName: "page-services" */ '../pages/Services'));
const Invoices = lazy(() => import(/* webpackChunkName: "page-invoices" */ '../pages/Invoices'));
<<<<<<< HEAD
=======
const Clients = lazy(() => import(/* webpackChunkName: "page-clients" */ '../pages/Clients'));
>>>>>>> temp-local-changes
const TasksPage = lazy(() => import(/* webpackChunkName: "page-tasks" */ '../pages/TasksPage'));
const ExportPage = lazy(() => import(/* webpackChunkName: "page-export" */ '../pages/ExportPage'));
const FbrEInvoicing = lazy(() => import(/* webpackChunkName: "page-fbr-e-invoicing" */ '../pages/FbrEInvoicing'));
const Settings = lazy(() => import(/* webpackChunkName: "page-settings" */ '../pages/Settings'));
<<<<<<< HEAD
// Removed SellerConfigurationPage route per request
const UploadInvoices = lazy(() => import(/* webpackChunkName: "page-upload" */ '../pages/UploadInvoices'));
const InvoiceHistory = lazy(() => import(/* webpackChunkName: "page-history" */ '../pages/InvoiceHistory'));
const SellerForm = lazy(() => import(/* webpackChunkName: "page-seller-form" */ '../pages/SellerForm'));
const InvoiceUploadDirect = lazy(() => import(/* webpackChunkName: "page-upload-direct" */ '../pages/InvoiceUploadDirect'));
=======
const UserRoles = lazy(() => import(/* webpackChunkName: "page-user-roles" */ '../pages/UserRoles'));
const SellerConfigurationPage = lazy(() => import(/* webpackChunkName: "page-seller-config" */ '../pages/SellerConfigurationPage'));
>>>>>>> temp-local-changes

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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
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
<<<<<<< HEAD
          <Route path="tasks" element={<SellerRoute><TasksPage /></SellerRoute>} />
          <Route path="export" element={<SellerRoute><ExportPage /></SellerRoute>} />
          <Route path="upload" element={<SellerRoute><UploadInvoices /></SellerRoute>} />
          <Route path="upload-direct" element={<SellerRoute><InvoiceUploadDirect /></SellerRoute>} />
          <Route path="history" element={<SellerRoute><InvoiceHistory /></SellerRoute>} />
          <Route path="fbr-e-invoicing" element={<SellerRoute><FbrEInvoicing /></SellerRoute>} />
          <Route path="settings" element={<Settings />} />
          {/* sellers route removed per request */}
          <Route path="seller-register" element={<AdminRoute><SellerForm /></AdminRoute>} />
=======
          <Route path="clients" element={<SellerRoute><Clients /></SellerRoute>} />
          <Route path="tasks" element={<SellerRoute><TasksPage /></SellerRoute>} />
          <Route path="export" element={<SellerRoute><ExportPage /></SellerRoute>} />
          <Route path="fbr-e-invoicing" element={<SellerRoute><FbrEInvoicing /></SellerRoute>} />
          <Route path="settings" element={<Settings />} />
          <Route path="user-roles" element={<AdminRoute><UserRoles /></AdminRoute>} />
          <Route path="sellers" element={<AdminRoute><SellerConfigurationPage /></AdminRoute>} />
>>>>>>> temp-local-changes
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;