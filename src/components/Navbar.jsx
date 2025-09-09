import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Shield, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../services/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, sellerId, isAdmin, isSeller } = useAuth();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-3">
      <div className="flex justify-between items-center">
        {/* Left side - App Name and Navigation */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-800">Tax Nexus</h1>
          {/* FBR Settings Link (visible to sellers and admins) */}
          {(isSeller?.() || isAdmin?.()) && (
            <Link
              to="/fbr-settings"
              className="flex items-center gap-1 text-blue-700 hover:underline text-sm font-medium"
            >
              <Settings size={16} />
              FBR Settings
            </Link>
          )}
        </div>
        
        {/* Right side - Admin Info and Logout */}
        <div className="flex items-center gap-4">
          {/* Admin Role Badge */}
          {isAdmin?.() && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
              <Shield size={12} />
              Admin
            </span>
          )}
          
          {/* Seller/Admin ID */}
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