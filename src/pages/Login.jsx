import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginWithEmail } from "../services/auth";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate form data
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Attempting login for:', formData.email);
      
      // Use the auth context login function
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        console.log('✅ Login successful for:', result.user?.name);
        
        // Get the intended destination or default to dashboard
        const from = location.state?.from?.pathname || "/dashboard";
        
        // Show success message briefly before redirect
        setError(""); // Clear any previous errors
        
        // Redirect to intended page
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.response?.status === 403) {
        setError("Account is disabled. Please contact your administrator.");
      } else if (err.response?.status === 404) {
        setError("User not found. Please check your email address.");
      } else if (err.message?.includes('Network Error')) {
        setError("Connection failed. Please check your internet connection.");
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role = 'seller') => {
    setLoading(true);
    setError("");

    try {
      console.log('🔐 Attempting demo login for role:', role);
      
      // Demo credentials based on role
      const demoCredentials = {
        admin: { email: 'admin@taxnexus.com', password: 'admin123' },
        seller: { email: 'seller@taxnexus.com', password: 'seller123' },
        buyer: { email: 'buyer@taxnexus.com', password: 'buyer123' }
      };

      const credentials = demoCredentials[role];
      
      const result = await login(credentials);

      if (result.success) {
        console.log('✅ Demo login successful for:', result.user?.name);
        navigate("/dashboard", { replace: true });
      } else {
        setError("Demo login failed. Please try again.");
      }
    } catch (err) {
      console.error('❌ Demo login error:', err);
      setError("Demo login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Logo positioned above app name */}
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src="/tax-nexus-logo-color-full-lg.jpg" 
                alt="Tax Nexus Logo" 
                className="w-16 h-16 object-cover rounded-lg shadow-lg"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Tax Nexus
            </h2>
            <p className="text-gray-600 mt-2">Professional Invoice Management</p>
            <p className="text-sm text-gray-500 mt-1">Multi-Tenant Tax Consultancy Platform</p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Demo Login Buttons */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Or try demo accounts:</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('seller')}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  Seller
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('buyer')}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                >
                  Buyer
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ Multi-Tenant Platform</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Admin:</strong> Full system access and user management</p>
            <p><strong>Seller:</strong> Manage own services, invoices, and clients</p>
            <p><strong>Buyer:</strong> View own invoices and profile</p>
            <p><strong>Data Isolation:</strong> Each seller only sees their own data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;