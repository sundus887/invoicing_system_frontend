import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import AddClient from "./pages/AddClient";
import AddSeller from "./pages/AddSeller";
import Invoices from "./pages/Invoices";
import AddInvoice from "./pages/AddInvoice";
import Services from "./pages/Services";
import FbrEInvoicing from "./pages/FbrEInvoicing";
import UserRoles from "./pages/UserRoles";

// Simple authentication check
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Router>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="sellers" element={<AddSeller />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="add-invoice" element={<AddInvoice />} />
        <Route path="add-client" element={<AddClient />} />
        <Route path="services" element={<Services />} />
        <Route path="fbr-e-invoicing" element={<FbrEInvoicing />} />
        <Route path="user-roles" element={<UserRoles />} />
      </Route>
    </Routes>
  </Router>
);

export default AppRoutes;
