import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "../services/auth";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Use the auth service logout function
    logout();
    
    // Clear any additional stored data
    localStorage.removeItem('token');
    
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
      {/* Left side - can be used for breadcrumbs or page title */}
      <div className="flex items-center">
        {/* Removed the "Dashboard" text */}
      </div>
      
      {/* Right side - Logout only */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;