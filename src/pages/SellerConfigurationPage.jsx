import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SellerConfigurationPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fbrLoading, setFbrLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Seller Settings State
  const [sellerSettings, setSellerSettings] = useState({
    companyName: '',
    sellerNTN: '',
    sellerSTRN: '',
    address: '',
    phone: ''
  });

  // FBR API Settings State
  const [fbrSettings, setFbrSettings] = useState({
    clientId: '',
    clientSecret: '',
    apiUrl: 'https://iris.fbr.gov.pk/api/v1',
    environment: 'sandbox',
    sellerNTN: '',
    sellerSTRN: '',
    businessName: ''
  });

  // FBR Authentication Status
  const [fbrAuthStatus, setFbrAuthStatus] = useState({
    isAuthenticated: false,
    lastLoginAttempt: null,
    loginError: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load seller settings
      try {
        const sellerResponse = await api.get('/api/seller-settings');
        console.log('Seller settings response:', sellerResponse.data);
        if (sellerResponse.data && sellerResponse.data.length > 0) {
          const latestSettings = sellerResponse.data[0];
          setSellerSettings({
            companyName: latestSettings.companyName || '',
            sellerNTN: latestSettings.sellerNTN || '',
            sellerSTRN: latestSettings.sellerSTRN || '',
            address: latestSettings.address || '',
            phone: latestSettings.phone || ''
          });
        }
      } catch (err) {
        console.log('No seller settings found yet');
      }

      // Load FBR API settings
      try {
        const fbrResponse = await api.get('/api/fbr-api-settings');
        console.log('FBR settings response:', fbrResponse.data);
        if (fbrResponse.data) {
          setFbrSettings({
            clientId: fbrResponse.data.clientId || '',
            clientSecret: fbrResponse.data.clientSecret || '',
            apiUrl: fbrResponse.data.apiUrl || 'https://iris.fbr.gov.pk/api/v1',
            environment: fbrResponse.data.environment || 'sandbox',
            sellerNTN: fbrResponse.data.sellerNTN || '',
            sellerSTRN: fbrResponse.data.sellerSTRN || '',
            businessName: fbrResponse.data.businessName || ''
          });
        }
      } catch (err) {
        console.log('No FBR settings found yet');
      }

      // Check FBR authentication status
      try {
        const authResponse = await api.get('/api/fbr-auth/status');
        console.log('FBR auth status response:', authResponse.data);
        setFbrAuthStatus(authResponse.data);
      } catch (err) {
        console.log('FBR auth status not available');
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerChange = (field, value) => {
    console.log('Updating seller field:', field, value);
    setSellerSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFbrChange = (field, value) => {
    console.log('Updating FBR field:', field, value);
    setFbrSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditConfiguration = () => {
    console.log('Edit configuration clicked - isEditing will be:', !isEditing);
    setIsEditing(!isEditing); // Toggle the state
    setError(null);
    setSuccess(null);
  };

  const handleSaveConfiguration = async () => {
    try {
      console.log('Saving configuration...');
      setSaving(true);
      setError(null);

      // Save seller settings
      console.log('Saving seller settings:', sellerSettings);
      await api.post('/api/seller-settings', sellerSettings);

      // Save FBR API settings
      console.log('Saving FBR settings:', fbrSettings);
      await api.post('/api/fbr-api-settings', fbrSettings);

      setSuccess('Configuration saved successfully!');
      setIsEditing(false);
      
      // Reload data to get updated status
      await loadData();

    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    console.log('Cancel edit clicked');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    loadData(); // Reload original data
  };

  const handleLoginToFBR = async () => {
    try {
      console.log('Login to FBR clicked');
      setFbrLoading(true);
      setError(null);

      // First ensure FBR settings are saved
      console.log('Saving FBR settings before login:', fbrSettings);
      await api.post('/api/fbr-api-settings', fbrSettings);

      // Attempt FBR authentication
      const loginData = {
        clientId: fbrSettings.clientId,
        clientSecret: fbrSettings.clientSecret,
        sellerNTN: fbrSettings.sellerNTN,
        sellerSTRN: fbrSettings.sellerSTRN,
        businessName: fbrSettings.businessName,
        environment: fbrSettings.environment
      };
      
      console.log('Attempting FBR login with:', loginData);
      const response = await api.post('/api/fbr-auth/login', loginData);

      console.log('FBR login response:', response.data);

      if (response.data.success) {
        setSuccess('Successfully authenticated with FBR!');
        setFbrAuthStatus({
          isAuthenticated: true,
          lastLoginAttempt: new Date(),
          loginError: null
        });
      } else {
        setError('FBR authentication failed. Please check your credentials.');
      }

    } catch (err) {
      console.error('Error logging into FBR:', err);
      setError('Failed to authenticate with FBR. Please check your credentials and try again.');
      setFbrAuthStatus(prev => ({
        ...prev,
        isAuthenticated: false,
        lastLoginAttempt: new Date(),
        loginError: err.response?.data?.message || 'Authentication failed'
      }));
    } finally {
      setFbrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seller configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seller Configuration</h1>
        <button
          onClick={handleEditConfiguration}
          className={`px-4 py-2 rounded text-white ${
            isEditing 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Cancel Edit' : 'Edit Configuration'}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* FBR Authentication Status */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">FBR Authentication Status</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                fbrAuthStatus.isAuthenticated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {fbrAuthStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </span>
              
              {!fbrAuthStatus.isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-600 text-sm">
                    FBR authentication is required to create invoices. Please configure your credentials and login.
                  </span>
                </div>
              )}
            </div>
            
            {!fbrAuthStatus.isAuthenticated && (
              <button
                onClick={handleLoginToFBR}
                disabled={fbrLoading || !isEditing}
                className={`px-4 py-2 rounded text-white ${
                  fbrLoading || !isEditing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {fbrLoading ? 'Authenticating...' : 'Login to FBR'}
              </button>
            )}
          </div>
          
          {fbrAuthStatus.lastLoginAttempt && (
            <div className="mt-4 text-sm text-gray-600">
              Last login attempt: {new Date(fbrAuthStatus.lastLoginAttempt).toLocaleString()}
            </div>
          )}
          
          {fbrAuthStatus.loginError && (
            <div className="mt-2 text-sm text-red-600">
              Error: {fbrAuthStatus.loginError}
            </div>
          )}
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seller Settings */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Seller Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={sellerSettings.companyName}
                    onChange={(e) => handleSellerChange('companyName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller NTN *
                  </label>
                  <input
                    type="text"
                    value={sellerSettings.sellerNTN}
                    onChange={(e) => handleSellerChange('sellerNTN', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller STRN *
                  </label>
                  <input
                    type="text"
                    value={sellerSettings.sellerSTRN}
                    onChange={(e) => handleSellerChange('sellerSTRN', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={sellerSettings.phone}
                    onChange={(e) => handleSellerChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    value={sellerSettings.address}
                    onChange={(e) => handleSellerChange('address', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* FBR API Settings */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">FBR API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FBR Client ID *
                  </label>
                  <input
                    type="text"
                    value={fbrSettings.clientId}
                    onChange={(e) => handleFbrChange('clientId', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FBR Client Secret *
                  </label>
                  <input
                    type="password"
                    value={fbrSettings.clientSecret}
                    onChange={(e) => handleFbrChange('clientSecret', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FBR Business Name *
                  </label>
                  <input
                    type="text"
                    value={fbrSettings.businessName}
                    onChange={(e) => handleFbrChange('businessName', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment
                  </label>
                  <select
                    value={fbrSettings.environment}
                    onChange={(e) => handleFbrChange('environment', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${
                      isEditing ? 'border-gray-300 focus:border-blue-500' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfiguration}
                disabled={saving}
                className={`px-4 py-2 rounded text-white ${
                  saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How FBR Integration Works</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Seller Details:</strong> These are your client's business information (NTN, STRN, address) - stored locally for invoice display</p>
          <p>• <strong>FBR API Credentials:</strong> Your client's FBR API credentials (Client ID & Secret) - used for authentication</p>
          <p>• <strong>Authentication:</strong> When you click "Login to FBR", the system authenticates with FBR using your client's credentials</p>
          <p>• <strong>Invoice Creation:</strong> Once authenticated, you can create invoices that will be automatically submitted to FBR</p>
          <p>• <strong>FBR Response:</strong> FBR returns UUID, IRN, and QR Code which are saved with each invoice</p>
          <p>• <strong>Important:</strong> Seller details are NOT automatically fetched from FBR - you need to enter them manually</p>
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
        <p><strong>Debug Info:</strong></p>
        <p>isEditing: {isEditing.toString()}</p>
        <p>fbrAuthStatus.isAuthenticated: {fbrAuthStatus.isAuthenticated.toString()}</p>
        <p>loading: {loading.toString()}</p>
        <p>saving: {saving.toString()}</p>
        <p>fbrLoading: {fbrLoading.toString()}</p>
      </div>
    </div>
  );
};

export default SellerConfigurationPage;