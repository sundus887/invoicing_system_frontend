import React from "react";
import AppSidebar from "./AppSidebar.jsx";
import Navbar from "./Navbar.jsx";
import { Outlet } from "react-router-dom";

const Layout = () => (
  <div className="flex min-h-screen bg-gray-100">
    {/* Sidebar */}
    <AppSidebar />
    
    {/* Main Content Area */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Navbar */}
      <Navbar />
      
      {/* Page Content */}
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;