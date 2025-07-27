import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Clients from '../pages/Clients';
import Services from '../pages/Services';
import Invoices from '../pages/Invoices';
import FbrEInvoicing from '../pages/FbrEInvoicing';
import UserRoles from '../pages/UserRoles';
import Settings from '../pages/Settings';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route - Login page (NO Layout wrapper) */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - All wrapped in Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="services" element={<Services />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="fbr-e-invoicing" element={<FbrEInvoicing />} />
          <Route path="user-roles" element={<UserRoles />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;