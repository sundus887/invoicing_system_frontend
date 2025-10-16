import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute, { AdminRoute, SellerRoute } from '../components/ProtectedRoute';

// Debug toggle: set true to eagerly import routes and surface module errors directly
const EAGER_ROUTES = true;

// Helper: wrap dynamic imports to log and normalize default export
const lazyLog = (loader, name) => lazy(() => loader()
  .then((m) => ({ default: m?.default ?? m }))
  .catch((e) => { console.error(`Failed to load chunk for ${name}:`, e); throw e; })
);

// Choose between eager imports (for debugging) and lazy imports (for code-splitting)
let Layout, Login, Dashboard, Services, Invoices, Clients, TasksPage, ExportPage, FbrEInvoicing, Settings, UploadInvoices, InvoiceHistory, SellerForm, InvoiceUploadDirect, UserRoles, SellerConfigurationPage;

if (EAGER_ROUTES) {
  try { Layout = require('../components/Layout').default || require('../components/Layout'); } catch (e) { console.error('Eager load failed: Layout', e); }
  try { Login = require('../pages/Login').default || require('../pages/Login'); } catch (e) { console.error('Eager load failed: Login', e); }
  try { Dashboard = require('../pages/Dashboard').default || require('../pages/Dashboard'); } catch (e) { console.error('Eager load failed: Dashboard', e); }
  try { Services = require('../pages/Services').default || require('../pages/Services'); } catch (e) { console.error('Eager load failed: Services', e); }
  try { Invoices = require('../pages/Invoices').default || require('../pages/Invoices'); } catch (e) { console.error('Eager load failed: Invoices', e); }
  try { Clients = require('../pages/Clients').default || require('../pages/Clients'); } catch (e) { console.error('Eager load failed: Clients', e); }
  try { TasksPage = require('../pages/TasksPage').default || require('../pages/TasksPage'); } catch (e) { console.error('Eager load failed: TasksPage', e); }
  try { ExportPage = require('../pages/ExportPage').default || require('../pages/ExportPage'); } catch (e) { console.error('Eager load failed: ExportPage', e); }
  try { FbrEInvoicing = require('../pages/FbrEInvoicing').default || require('../pages/FbrEInvoicing'); } catch (e) { console.error('Eager load failed: FbrEInvoicing', e); }
  try { Settings = require('../pages/Settings').default || require('../pages/Settings'); } catch (e) { console.error('Eager load failed: Settings', e); }
  try { UploadInvoices = require('../pages/UploadInvoices').default || require('../pages/UploadInvoices'); } catch (e) { console.error('Eager load failed: UploadInvoices', e); }
  try { InvoiceHistory = require('../pages/InvoiceHistory').default || require('../pages/InvoiceHistory'); } catch (e) { console.error('Eager load failed: InvoiceHistory', e); }
  try { SellerForm = require('../pages/SellerForm').default || require('../pages/SellerForm'); } catch (e) { console.error('Eager load failed: SellerForm', e); }
  try { InvoiceUploadDirect = require('../pages/InvoiceUploadDirect').default || require('../pages/InvoiceUploadDirect'); } catch (e) { console.error('Eager load failed: InvoiceUploadDirect', e); }
  try { UserRoles = require('../pages/UserRoles').default || require('../pages/UserRoles'); } catch (e) { console.error('Eager load failed: UserRoles', e); }
  try { SellerConfigurationPage = require('../pages/SellerConfigurationPage').default || require('../pages/SellerConfigurationPage'); } catch (e) { console.error('Eager load failed: SellerConfigurationPage', e); }
} else {
  Layout = lazyLog(() => import(/* webpackChunkName: "layout" */ '../components/Layout'), 'Layout');
  Login = lazyLog(() => import(/* webpackChunkName: "page-login" */ '../pages/Login'), 'Login');
  Dashboard = lazyLog(() => import(/* webpackChunkName: "page-dashboard" */ '../pages/Dashboard'), 'Dashboard');
  Services = lazyLog(() => import(/* webpackChunkName: "page-services" */ '../pages/Services'), 'Services');
  Invoices = lazyLog(() => import(/* webpackChunkName: "page-invoices" */ '../pages/Invoices'), 'Invoices');
  Clients = lazyLog(() => import(/* webpackChunkName: "page-clients" */ '../pages/Clients'), 'Clients');
  TasksPage = lazyLog(() => import(/* webpackChunkName: "page-tasks" */ '../pages/TasksPage'), 'TasksPage');
  ExportPage = lazyLog(() => import(/* webpackChunkName: "page-export" */ '../pages/ExportPage'), 'ExportPage');
  FbrEInvoicing = lazyLog(() => import(/* webpackChunkName: "page-fbr-e-invoicing" */ '../pages/FbrEInvoicing'), 'FbrEInvoicing');
  Settings = lazyLog(() => import(/* webpackChunkName: "page-settings" */ '../pages/Settings'), 'Settings');
  UploadInvoices = lazyLog(() => import(/* webpackChunkName: "page-upload" */ '../pages/UploadInvoices'), 'UploadInvoices');
  InvoiceHistory = lazyLog(() => import(/* webpackChunkName: "page-history" */ '../pages/InvoiceHistory'), 'InvoiceHistory');
  SellerForm = lazyLog(() => import(/* webpackChunkName: "page-seller-form" */ '../pages/SellerForm'), 'SellerForm');
  InvoiceUploadDirect = lazyLog(() => import(/* webpackChunkName: "page-upload-direct" */ '../pages/InvoiceUploadDirect'), 'InvoiceUploadDirect');
  UserRoles = lazyLog(() => import(/* webpackChunkName: "page-user-roles" */ '../pages/UserRoles'), 'UserRoles');
  SellerConfigurationPage = lazyLog(() => import(/* webpackChunkName: "page-seller-config" */ '../pages/SellerConfigurationPage'), 'SellerConfigurationPage');
}

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
          <Route path="clients" element={<SellerRoute><Clients /></SellerRoute>} />
          <Route path="tasks" element={<SellerRoute><TasksPage /></SellerRoute>} />
          <Route path="export" element={<SellerRoute><ExportPage /></SellerRoute>} />
          <Route path="upload" element={<SellerRoute><UploadInvoices /></SellerRoute>} />
          <Route path="upload-direct" element={<SellerRoute><InvoiceUploadDirect /></SellerRoute>} />
          <Route path="history" element={<SellerRoute><InvoiceHistory /></SellerRoute>} />
          <Route path="fbr-e-invoicing" element={<SellerRoute><FbrEInvoicing /></SellerRoute>} />
          <Route path="settings" element={<Settings />} />
          <Route path="seller-register" element={<AdminRoute><SellerForm /></AdminRoute>} />
          <Route path="user-roles" element={<AdminRoute><UserRoles /></AdminRoute>} />
          <Route path="sellers" element={<AdminRoute><SellerConfigurationPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;