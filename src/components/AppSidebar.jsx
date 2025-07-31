import React from "react";
import { Link, useLocation } from "react-router-dom";

const AppSidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">IS</span>
        </div>
        <div>
          <h1 className="font-bold text-lg">InvoSync</h1>
          <p className="text-xs text-gray-500">Invoice Management</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/dashboard" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          Dashboard
        </Link>

        <Link 
          to="/clients" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/clients" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01 1l-4.7 6.3c-.37.5-.58 1.11-.58 1.73V20c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2z"/>
          </svg>
          Buyer Management
        </Link>

        <Link 
          to="/sellers" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/sellers" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Seller Management
        </Link>

        <Link 
          to="/services" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/services" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
          Services
        </Link>

        <Link 
          to="/invoices" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/invoices" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          Invoices
        </Link>

        <Link 
          to="/fbr-e-invoicing" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/fbr-e-invoicing" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          FBR e-Invoicing
        </Link>

        <Link 
          to="/user-roles" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/user-roles" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          User Roles
        </Link>

        <Link 
          to="/export" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            location.pathname === "/export" 
              ? "bg-black text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          Export Data
        </Link>
      </nav>
    </div>
  );
};

export default AppSidebar; 
