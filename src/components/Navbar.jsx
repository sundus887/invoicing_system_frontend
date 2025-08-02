import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../services/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, sellerId, isSeller, isAdmin, isBuyer } = useAuth();

  const handleLogout = () => {
    // Use the auth service logout function
    logout();
    
    // Clear any additional stored data
    localStorage.removeItem('token');
    
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  // Get role-based navigation items
  const getNavigationItems = () => {
    const items = [];

    // Admin can see everything
    if (isAdmin()) {
      items.push(
        { name: 'Dashboard', path: '/dashboard', icon: '  ' },
        { name: 'Sellers', path: '/sellers', icon: '  ' },
        { name: 'Services', path: '/services', icon: '  ' },
        { name: 'Invoices', path: '/invoices', icon: '  ' },
        { name: 'Clients', path: '/clients', icon: '  ' },
        { name: 'Tasks', path: '/tasks', icon: '✅' },
        { name: 'Export', path: '/export', icon: '  ' },
        { name: 'FBR E-Invoicing', path: '/fbr-einvoicing', icon: '🏛️' }
      );
    }
    // Seller can see their own data
    else if (isSeller()) {
      items.push(
        { name: 'Dashboard', path: '/dashboard', icon: '  ' },
        { name: 'Services', path: '/services', icon: '  ' },
        { name: 'Invoices', path: '/invoices', icon: '  ' },
        { name: 'Clients', path: '/clients', icon: '  ' },
        { name: 'Tasks', path: '/tasks', icon: '✅' },
        { name: 'Export', path: '/export', icon: '  ' },
        { name: 'FBR E-Invoicing', path: '/fbr-einvoicing', icon: '🏛️' }
      );
    }
    // Buyer can see limited data
    else if (isBuyer()) {
      items.push(
        { name: 'Dashboard', path: '/dashboard', icon: '  ' },
        { name: 'My Invoices', path: '/invoices', icon: '  ' },
        { name: 'My Profile', path: '/profile', icon: '👤' }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-3">
      <div className="flex justify-between items-center">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-800">Tax Nexus</h1>
            {isAdmin() && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
                <Shield size={12} />
                Admin
              </span>
            )}
            {isSeller() && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                <User size={12} />
                Seller
              </span>
            )}
            {isBuyer() && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                <User size={12} />
                Buyer
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Right side - User Info and Logout */}
        <div className="flex items-center gap-4">
          {/* User Information */}
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span className="font-medium">{user?.name || 'User'}</span>
            </div>
            {sellerId && (
              <div className="flex items-center gap-1">
                <Settings size={14} />
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  ID: {sellerId.slice(-6)}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-col space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        
        {/* Mobile User Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span className="font-medium">{user?.name || 'User'}</span>
            </div>
            {sellerId && (
              <div className="flex items-center gap-1">
                <Settings size={14} />
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  ID: {sellerId.slice(-6)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;