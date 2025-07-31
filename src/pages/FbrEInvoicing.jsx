import { useEffect, useState } from 'react';
import api from '../services/api';

function FbrEInvoicingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ accepted: 0, pending: 0, rejected: 0, total: 0 });
  const [tab, setTab] = useState("submissions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // New state for invoice number selection
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  
  // FBR API Settings state
  const [apiSettings, setApiSettings] = useState({
    clientId: '',
    clientSecret: '',
    apiUrl: '',
    environment: 'sandbox'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Updated form state for auto-population
  const [form, setForm] = useState({
    totalAmount: '',
    salesTax: '',
    extraTax: '',
    items: []
  });

  // Fetch available invoices for FBR submission
  const fetchAvailableInvoices = async () => {
    try {
      console.log('🔄 Fetching available invoices for FBR...');
      const response = await api.get('/api/fbrinvoices/available-invoices');
      console.log('✅ Available invoices loaded:', response.data);
      if (response.data.success) {
        setAvailableInvoices(response.data.invoices);
      }
    } catch (err) {
      console.error('❌ Error fetching available invoices:', err);
    }
  };

  // Fetch FBR invoices (submissions)
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/fbrinvoices/submissions');
      console.log('✅ FBR submissions loaded:', response.data);
      if (response.data.success) {
        setInvoices(response.data.submissions);
      }
    } catch (err) {
      console.error('❌ Error fetching FBR submissions:', err);
      setError('Failed to load FBR submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending invoices
  const fetchPendingInvoices = async () => {
    try {
      const response = await api.get('/api/fbrinvoices/pending');
      console.log('✅ Pending invoices loaded:', response.data);
      if (response.data.success) {
        setInvoices(response.data.pendingInvoices);
      }
    } catch (err) {
      console.error('❌ Error fetching pending invoices:', err);
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const response = await api.get('/api/fbrinvoices/summary');
      console.log('✅ FBR summary loaded:', response.data);
      setSummary(response.data);
    } catch (err) {
      console.error('❌ Error fetching FBR summary:', err);
    }
  };

  // Fetch FBR API Settings
  const fetchApiSettings = async () => {
    try {
      setSettingsLoading(true);
      console.log('🔍 Fetching FBR API settings...');
      const response = await api.get('/api/fbr-api-settings');
      console.log('✅ FBR API settings loaded:', response.data);
      if (response.data && response.data.length > 0) {
        console.log('📝 Setting API settings from backend:', response.data[0]);
        setApiSettings(response.data[0]);
      } else {
        console.log('📝 No backend data found, using empty defaults');
        setApiSettings({
          clientId: '',
          clientSecret: '',
          apiUrl: '',
          environment: 'sandbox'
        });
      }
    } catch (err) {
      console.error('❌ Error fetching FBR API settings:', err);
      console.log('📝 No FBR API settings found, using empty defaults');
      setApiSettings({
        clientId: '',
        clientSecret: '',
        apiUrl: '',
        environment: 'sandbox'
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle invoice number selection and auto-populate form
  const handleInvoiceNumberChange = async (invoiceNumber) => {
    setSelectedInvoiceNumber(invoiceNumber);
    
    if (!invoiceNumber) {
      // Clear form if no invoice selected
      setForm({
        totalAmount: '',
        salesTax: '',
        extraTax: '',
        items: []
      });
      return;
    }
    
    setIsLoadingInvoice(true);
    try {
      console.log('🔄 Fetching invoice data for:', invoiceNumber);
      const response = await api.get(`/api/fbrinvoices/invoice/${invoiceNumber}`);
      console.log('✅ Invoice data loaded:', response.data);
      
      if (response.data.success) {
        const invoice = response.data.invoice;
        // Auto-populate form fields
        setForm({
          totalAmount: invoice.totalAmount || '',
          salesTax: invoice.salesTax || '',
          extraTax: invoice.extraTax || '',
          items: invoice.items || [] // Already includes HS codes
        });
        
        alert('✅ Invoice data loaded successfully!');
      }
    } catch (err) {
      console.error('❌ Error fetching invoice data:', err);
      alert('❌ Error loading invoice data');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  // Test backend connectivity
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connectivity...');
      const response = await api.get('/api/health');
      console.log('✅ Backend is reachable:', response.data);
      return true;
    } catch (err) {
      console.error('❌ Backend connectivity test failed:', err);
      return false;
    }
  };

  // Handle form submission with new API endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoiceNumber) {
      alert('Please select an invoice number first');
      return;
    }
    
    // Test backend connectivity first
    const isBackendReachable = await testBackendConnection();
    if (!isBackendReachable) {
      alert('❌ Cannot connect to the backend server. Please check your internet connection or try again later.');
      return;
    }
    
    try {
      console.log('🔄 Submitting FBR invoice:', selectedInvoiceNumber);
      console.log('📋 API Settings:', apiSettings);
      console.log('📋 Form Data:', form);
      
      const requestData = {
        invoiceNumber: selectedInvoiceNumber,
        sandbox: apiSettings.environment === 'sandbox'
      };
      
      console.log('📤 Request data being sent:', requestData);
      
      const response = await api.post('/api/fbrinvoices/create-from-invoice', requestData);
      
      console.log('✅ FBR invoice created:', response.data);
      
      if (response.data.success) {
        alert(`✅ FBR Invoice submitted successfully!\nReference: ${response.data.fbrReference}`);
        
        // Clear form and refresh data
        setSelectedInvoiceNumber('');
        setForm({
          totalAmount: '',
          salesTax: '',
          extraTax: '',
          items: []
        });
        
        // Refresh available invoices
        await fetchAvailableInvoices();
        
        // Refresh submissions if on submissions tab
        if (tab === 'submissions') {
          await fetchInvoices();
        }
      }
    } catch (err) {
      console.error('❌ Error creating FBR invoice:', err);
      
      // Show more detailed error information
      let errorMessage = 'Failed to create FBR invoice. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        console.error('Server error:', err.response.status, err.response.data);
        errorMessage = `Server error (${err.response.status}): ${err.response.data?.message || 'Unknown server error'}`;
      } else if (err.request) {
        // Request was made but no response received
        console.error('Network error:', err.request);
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
      } else {
        // Something else happened
        console.error('Other error:', err.message);
        errorMessage = `Error: ${err.message}`;
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  // Generate FBR invoice PDF
  const generateFBRInvoice = async () => {
    if (!selectedInvoiceNumber) {
      alert('Please select an invoice number first');
      return;
    }
    
    try {
      // Open PDF in new window/tab
      window.open(`/api/fbrinvoices/generate-pdf/${selectedInvoiceNumber}`, '_blank');
    } catch (err) {
      console.error('❌ Error generating PDF:', err);
      alert('❌ Error generating PDF');
    }
  };

  // Retry FBR submission
  const retryFBRSubmission = async (fbrInvoiceId) => {
    try {
      const response = await api.post(`/api/fbrinvoices/${fbrInvoiceId}/retry`);
      console.log('✅ FBR submission retry result:', response.data);
      
      if (response.data.success) {
        alert('✅ FBR submission retry successful!');
        await fetchInvoices(); // Refresh submissions
      } else {
        alert(`❌ Retry failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error('❌ Error retrying submission:', err);
      alert('❌ Error retrying submission');
    }
  };

  // Save FBR API Settings
  const saveApiSettings = async () => {
    try {
      setSettingsLoading(true);
      setSettingsSaved(false);
      
      const response = await api.post('/api/fbr-api-settings', apiSettings);
      console.log('✅ FBR API settings saved:', response.data);
      setSettingsSaved(true);
      
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('❌ Error saving FBR API settings:', err);
      alert('❌ Failed to save FBR API settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle API settings form changes
  const handleApiSettingChange = (field, value) => {
    setApiSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear API settings form
  const clearApiSettings = () => {
    setApiSettings({
      clientId: '',
      clientSecret: '',
      apiUrl: '',
      environment: 'sandbox'
    });
    setSettingsSaved(false);
  };

  // Load data based on active tab
  const loadTabData = async () => {
    if (tab === 'submissions') {
      await fetchInvoices();
    } else if (tab === 'pending') {
      await fetchPendingInvoices();
    } else if (tab === 'create') {
      await fetchAvailableInvoices();
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchApiSettings();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [tab]);

  if (loading && tab === 'submissions') {
    return <div className="text-center py-8">Loading FBR e-invoicing...</div>;
  }

  if (error && tab === 'submissions') {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchInvoices}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">FBR e-Invoicing</h1>
      <p className="text-gray-500 mb-6">Send invoices to FBR via API for tax compliance</p>

      {/* Tab Buttons */}
      <div className="flex space-x-2 mb-6">
        {["submissions", "pending", "api", "create"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full font-medium ${
              tab === t ? "bg-gray-200" : "bg-gray-100"
            }`}
          >
            {t === "submissions" && "Submissions"}
            {t === "pending" && "Pending Invoices"}
            {t === "api" && "API Settings"}
            {t === "create" && "Create FBR Invoice"}
          </button>
        ))}
      </div>

      {/* Create FBR Invoice Tab */}
      {tab === "create" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create New FBR Invoice</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Invoice Number Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Invoice Number *
                </label>
                <select
                  value={selectedInvoiceNumber}
                  onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                  disabled={isLoadingInvoice}
                >
                  <option value="">Select Invoice Number</option>
                  {availableInvoices.map(invoice => (
                    <option key={invoice.invoiceNumber} value={invoice.invoiceNumber}>
                      {invoice.invoiceNumber} - {invoice.buyerName} - Rs. {invoice.totalAmount}
                    </option>
                  ))}
                </select>
                {isLoadingInvoice && (
                  <div className="text-blue-600 text-sm mt-1">Loading invoice data...</div>
                )}
              </div>
              
              <input
                type="number"
                name="totalAmount"
                placeholder="Total Amount"
                value={form.totalAmount}
                readOnly
                className="border p-2 rounded bg-gray-50"
              />
              
              <input
                type="number"
                name="salesTax"
                placeholder="Sales Tax"
                value={form.salesTax}
                readOnly
                className="border p-2 rounded bg-gray-50"
              />
              
              <input
                type="number"
                name="extraTax"
                placeholder="Extra Tax"
                value={form.extraTax}
                readOnly
                className="border p-2 rounded bg-gray-50"
              />
              
              <select
                name="fbrEnvironment"
                value={apiSettings.environment}
                onChange={(e) => handleApiSettingChange('environment', e.target.value)}
                className="border p-2 rounded"
              >
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>

            {/* Items Section with HS Code Display */}
            {form.items && form.items.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Items (with Auto-Assigned HS Codes)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">S. No.</th>
                        <th className="border border-gray-300 p-2 text-left">Description</th>
                        <th className="border border-gray-300 p-2 text-left">HS Code</th>
                        <th className="border border-gray-300 p-2 text-left">Quantity</th>
                        <th className="border border-gray-300 p-2 text-left">Rate</th>
                        <th className="border border-gray-300 p-2 text-left">Amount</th>
                        <th className="border border-gray-300 p-2 text-left">Discount</th>
                        <th className="border border-gray-300 p-2 text-left">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{index + 1}</td>
                          <td className="border border-gray-300 p-2">{item.description || item.product}</td>
                          <td className="border border-gray-300 p-2 font-mono">{item.hsCode || '9983.99.00'}</td>
                          <td className="border border-gray-300 p-2">{item.quantity}</td>
                          <td className="border border-gray-300 p-2">{item.unitPrice}</td>
                          <td className="border border-gray-300 p-2">{item.totalValue}</td>
                          <td className="border border-gray-300 p-2">{item.discount || 0}</td>
                          <td className="border border-gray-300 p-2">{item.finalValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!selectedInvoiceNumber || isLoadingInvoice}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoadingInvoice ? 'Loading...' : 'Create FBR Invoice'}
              </button>
              
              <button
                type="button"
                onClick={generateFBRInvoice}
                disabled={!selectedInvoiceNumber}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Generate FBR Invoice PDF
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoiceNumber('');
                  setForm({
                    totalAmount: '',
                    salesTax: '',
                    extraTax: '',
                    items: []
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content based on active tab */}
      {tab === "submissions" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 flex flex-col items-center shadow">
              <span className="text-green-500 text-2xl">✔</span>
              <div className="text-xl font-bold">{summary.accepted || 0}</div>
              <div className="text-gray-500">Accepted</div>
            </div>
            <div className="bg-white rounded-lg p-4 flex flex-col items-center shadow">
              <span className="text-yellow-500 text-2xl">⏳</span>
              <div className="text-xl font-bold">{summary.pending || 0}</div>
              <div className="text-gray-500">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-4 flex flex-col items-center shadow">
              <span className="text-red-500 text-2xl">⛔</span>
              <div className="text-xl font-bold">{summary.rejected || 0}</div>
              <div className="text-gray-500">Rejected</div>
            </div>
            <div className="bg-white rounded-lg p-4 flex flex-col items-center shadow">
              <span className="text-blue-500 text-2xl">🔄</span>
              <div className="text-xl font-bold">{summary.total || 0}</div>
              <div className="text-gray-500">Total</div>
            </div>
          </div>

          {/* FBR Submissions List */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">FBR Submissions</h3>
            {invoices.length === 0 ? (
              <div className="text-gray-500">No FBR submissions found.</div>
            ) : (
              invoices.map(inv => (
                <div key={inv._id} className="bg-white rounded-lg shadow p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><span className="font-semibold">Invoice #:</span> {inv.invoiceNumber || 'N/A'}</div>
                    <div><span className="font-semibold">FBR Reference:</span> {inv.fbrReference || 'N/A'}</div>
                    <div><span className="font-semibold">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                        inv.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status || 'pending'}
                      </span>
                    </div>
                    <div><span className="font-semibold">Buyer:</span> {inv.buyerName || 'N/A'}</div>
                    <div><span className="font-semibold">Seller:</span> {inv.sellerName || 'N/A'}</div>
                    <div><span className="font-semibold">Amount:</span> Rs. {inv.totalAmount || 0}</div>
                    <div><span className="font-semibold">Environment:</span> {inv.environment || 'sandbox'}</div>
                    <div><span className="font-semibold">Submission Date:</span> 
                      {inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Items with HS Codes */}
                  {inv.items && inv.items.length > 0 && (
                    <div className="mt-3">
                      <span className="font-semibold">Items:</span>
                      <div className="ml-4 mt-1">
                        {inv.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            • {item.description} - HS: {item.hsCode} - Qty: {item.quantity} - Rs. {item.totalValue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Retry button for failed submissions */}
                  {inv.status === 'rejected' && (
                    <button 
                      onClick={() => retryFBRSubmission(inv._id)}
                      className="mt-2 bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-700"
                    >
                      Retry Submission
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "pending" && (
        <div>
          <h3 className="text-lg font-bold mb-2">Pending Invoices (Not Yet Submitted to FBR)</h3>
          {invoices.length === 0 ? (
            <div className="text-gray-500">No pending invoices found.</div>
          ) : (
            invoices.map(inv => (
              <div key={inv._id} className="bg-white rounded-lg shadow p-4 mb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><span className="font-semibold">Invoice #:</span> {inv.invoiceNumber || 'N/A'}</div>
                  <div><span className="font-semibold">Buyer:</span> {inv.buyerName || 'N/A'}</div>
                  <div><span className="font-semibold">Seller:</span> {inv.sellerName || 'N/A'}</div>
                  <div><span className="font-semibold">Amount:</span> Rs. {inv.totalAmount || 0}</div>
                  <div><span className="font-semibold">Created Date:</span> 
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                {/* Items with HS Codes */}
                {inv.items && inv.items.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold">Items:</span>
                    <div className="ml-4 mt-1">
                      {inv.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          • {item.description} - HS: {item.hsCode} - Qty: {item.quantity} - Rs. {item.totalValue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 text-sm text-blue-600">
                  💡 This invoice is ready for FBR submission. Go to "Create FBR Invoice" tab to submit it.
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "api" && (
        <div>
          <h3 className="text-lg font-bold mb-2">FBR API Settings</h3>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-4">
              Configure your FBR API credentials to enable e-invoicing functionality. 
              Always test in sandbox environment first.
            </p>
            
            {settingsSaved && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                ✅ FBR API settings saved successfully!
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter FBR Client ID"
                  value={apiSettings.clientId}
                  onChange={(e) => handleApiSettingChange('clientId', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret *
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter FBR Client Secret"
                  value={apiSettings.clientSecret}
                  onChange={(e) => handleApiSettingChange('clientSecret', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL *
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.fbr.gov.pk"
                  value={apiSettings.apiUrl}
                  onChange={(e) => handleApiSettingChange('apiUrl', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={apiSettings.environment}
                  onChange={(e) => handleApiSettingChange('environment', e.target.value)}
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Always test in sandbox environment first before switching to production.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  onClick={saveApiSettings}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? 'Saving...' : 'Save FBR API Settings'}
                </button>
                <button 
                  type="button"
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                  onClick={clearApiSettings}
                >
                  Clear Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FbrEInvoicingPage;