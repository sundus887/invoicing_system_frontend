import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../services/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, sellerId, isAdmin } = useAuth();

  const handleLogout = () => {
    // Use the auth service logout function
    logout();
    
    // Clear any additional stored data
    localStorage.removeItem('token');
    
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-3">
      <div className="flex justify-between items-center">
        {/* Left side - App Name */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Tax Nexus</h1>
        </div>
        
        {/* Right side - Admin Info and Logout */}
        <div className="flex items-center gap-4">
          {/* Admin Role Badge */}
          {isAdmin() && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
              <Shield size={12} />
              Admin
            </span>
          )}
          
          {/* Admin ID */}
          {sellerId && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
              ID: {sellerId.slice(-6)}
            </span>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;