// src/pages/AddSeller.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../services/api';

const AddSeller = () => {
  // Seller Configuration Fields (Read-only after initial setup)
  const [sellerConfig, setSellerConfig] = useState({
    companyName: "",
    sellerNTN: "",
    sellerSTRN: "",
    phone: "",
    address: "",
    fbrClientId: "",
    fbrClientSecret: "",
    environment: "sandbox"
  });
  
  // FBR Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();

  // Fetch seller configuration from backend
  const fetchSellerConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/seller-settings');
      console.log('✅ Backend seller config response:', response.data);
      
      if (response.data.success && response.data.settings) {
        setSellerConfig(response.data.settings);
      }
    } catch (err) {
      console.error('❌ Error fetching seller config:', err);
      setError('Failed to load seller configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check FBR authentication status
  const checkFbrAuthStatus = async () => {
    try {
      const response = await api.get('/api/fbr-auth/status');
      setIsAuthenticated(response.data.isAuthenticated);
      
      if (response.data.isAuthenticated) {
        const sellerResponse = await api.get('/api/fbr-auth/seller-info');
        setSellerInfo(sellerResponse.data.sellerInfo);
      }
    } catch (err) {
      console.error('❌ Error checking FBR auth status:', err);
    }
  };

  useEffect(() => {
    fetchSellerConfig();
    checkFbrAuthStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Save seller configuration
      const configResponse = await api.post('/api/seller-settings', sellerConfig);
      
      if (configResponse.data.success) {
        setSuccess('Seller configuration saved successfully!');
        setIsEditing(false);
        // Do not force FBR login here; backend will manage tokens automatically if credentials are stored server-side
        await checkFbrAuthStatus();
      }
    } catch (err) {
      console.error('❌ Error saving seller config:', err);
      setError('Failed to save seller configuration. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFbrLogin = async () => {
    setAuthLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/fbr-auth/login', {
        clientId: sellerConfig.fbrClientId,
        clientSecret: sellerConfig.fbrClientSecret,
        sellerNTN: sellerConfig.sellerNTN,
        sellerSTRN: sellerConfig.sellerSTRN,
        businessName: sellerConfig.companyName,
        environment: sellerConfig.environment
      });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        setSuccess('FBR authentication successful!');
        await checkFbrAuthStatus();
      } else {
        setError('FBR authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('❌ Error during FBR login:', err);
      setError('FBR authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFbrLogout = async () => {
    try {
      await api.post('/api/fbr-auth/logout');
      setIsAuthenticated(false);
      setSellerInfo(null);
      setSuccess('Logged out from FBR successfully!');
    } catch (err) {
      console.error('❌ Error during FBR logout:', err);
      setError('Error logging out from FBR.');
    }
  };

  const handleInputChange = (field, value) => {
    setSellerConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading seller configuration...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Seller Configuration</h2>
        {!isEditing && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
            onClick={() => setIsEditing(true)}
          >
            Edit Configuration
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* FBR Authentication Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">FBR Authentication Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAuthenticated 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
            {sellerInfo && (
              <span className="text-sm text-gray-600">
                Environment: {sellerInfo.environment?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="space-x-2">
            {!isAuthenticated ? (
              <button
                onClick={handleFbrLogin}
                disabled={authLoading}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {authLoading ? 'Authenticating...' : 'Login to FBR'}
              </button>
            ) : (
              <button
                onClick={handleFbrLogout}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Logout from FBR
              </button>
            )}
          </div>
        </div>
        
        {!isAuthenticated && (
          <p className="text-sm text-red-600 mt-2">
            ⚠️ FBR authentication is required to create invoices. Please configure your credentials and login.
          </p>
        )}
      </div>

      {/* Seller Configuration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={sellerConfig.companyName}
              onChange={e => handleInputChange('companyName', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seller NTN *
            </label>
            <input
              type="text"
              value={sellerConfig.sellerNTN}
              onChange={e => handleInputChange('sellerNTN', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seller STRN *
            </label>
            <input
              type="text"
              value={sellerConfig.sellerSTRN}
              onChange={e => handleInputChange('sellerSTRN', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={sellerConfig.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              value={sellerConfig.address}
              onChange={e => handleInputChange('address', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
              rows={3}
              required
            />
          </div>

          {/* FBR API Credentials */}
          <div className="md:col-span-2">
            <h4 className="text-md font-semibold mb-3 text-gray-800">FBR API Credentials</h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FBR Client ID (Optional)
            </label>
            <input
              type="text"
              value={sellerConfig.fbrClientId}
              onChange={e => handleInputChange('fbrClientId', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
              placeholder="If blank, backend will use server-stored credentials"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FBR Client Secret (Optional)
            </label>
            <input
              type="password"
              value={sellerConfig.fbrClientSecret}
              onChange={e => handleInputChange('fbrClientSecret', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
              placeholder="Leave empty to use server-stored secret"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <select
              value={sellerConfig.environment}
              onChange={e => handleInputChange('environment', e.target.value)}
              className={`w-full border p-2 rounded ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              disabled={!isEditing}
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production</option>
            </select>
          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="md:col-span-2 flex space-x-2 pt-4">
              <button
                type="submit"
                disabled={authLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
              >
                {authLoading ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchSellerConfig(); // Reset to original values
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="text-md font-semibold text-blue-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• This is a one-time configuration for your company's FBR integration</li>
          <li>• FBR authentication is required to create and submit invoices</li>
          <li>• Use Sandbox environment for testing before switching to Production</li>
          <li>• Keep your FBR credentials secure and never share them</li>
          <li>• Only one seller configuration is allowed per application</li>
        </ul>
      </div>
    </div>
  );
};

export default AddSeller;