import { useEffect, useState } from 'react';
import api from '../services/api';

function FbrEInvoicingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ accepted: 0, pending: 0, rejected: 0, total: 0 });
  const [tab, setTab] = useState("submissions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState([]);
  
  // FBR API Settings state
  const [apiSettings, setApiSettings] = useState({
    clientId: '',
    clientSecret: '',
    apiUrl: '',
    environment: 'sandbox'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Form state with HS code support
  const [form, setForm] = useState({
    client: '',
    amount: '',
    salesTax: '',
    extraTax: '',
    fbrEnvironment: 'sandbox',
    items: [
      {
        description: '',
        hsCode: '',
        quantity: 1,
        unitPrice: '',
        totalValue: '',
        salesTax: ''
      }
    ]
  });

  // Fetch FBR invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/fbrinvoices');
      console.log('✅ FBR invoices loaded:', response.data);
      setInvoices(response.data);
    } catch (err) {
      console.error('❌ Error fetching FBR invoices:', err);
      setError('Failed to load FBR invoices. Please try again.');
    } finally {
      setLoading(false);
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

  // Fetch clients for the form
  const fetchClients = async () => {
    try {
      console.log('🔄 Fetching clients...');
      const response = await api.get('/api/clients');
      console.log('✅ Clients loaded:', response.data);
      setClients(response.data);
    } catch (err) {
      console.error('❌ Error fetching clients:', err);
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

  // Handle form submission with HS code validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 Submitting FBR invoice with HS codes:', form);
      
      // Validate HS codes
      const invalidItems = form.items.filter(item => !item.hsCode || !/^\d{4}\.\d{2}\.\d{2}$/.test(item.hsCode));
      if (invalidItems.length > 0) {
        alert('Please enter valid HS codes for all items (format: XXXX.XX.XX)');
        return;
      }
      
      const response = await api.post('/api/fbrinvoices', form);
      console.log('✅ FBR invoice created:', response.data);
      
      setShowForm(false);
      setForm({
        client: '',
        amount: '',
        salesTax: '',
        extraTax: '',
        fbrEnvironment: 'sandbox',
        items: [
          {
            description: '',
            hsCode: '',
            quantity: 1,
            unitPrice: '',
            totalValue: '',
            salesTax: ''
          }
        ]
      });
      
      await fetchInvoices();
    } catch (err) {
      console.error('❌ Error creating FBR invoice:', err);
      alert('Failed to create FBR invoice. Please try again.');
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item changes including HS code
  const handleItemChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new item with HS code field
  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        hsCode: '',
        quantity: 1,
        unitPrice: '',
        totalValue: '',
        salesTax: ''
      }]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
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
      alert('Failed to save FBR API settings. Please try again.');
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

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    fetchClients();
    fetchApiSettings();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading FBR e-invoicing...</div>;
  }

  if (error) {
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
              <select
                name="client"
                value={form.client}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.companyName} - {client.buyerSTRN}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                name="amount"
                placeholder="Total Amount"
                value={form.amount}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              
              <input
                type="number"
                name="salesTax"
                placeholder="Sales Tax"
                value={form.salesTax}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
              
              <input
                type="number"
                name="extraTax"
                placeholder="Extra Tax"
                value={form.extraTax}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              
              <select
                name="fbrEnvironment"
                value={form.fbrEnvironment}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>

            {/* Items Section with HS Code */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Items (with HS Codes)</h3>
              {form.items.map((item, index) => (
                <div key={index} className="border p-4 rounded mb-2 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="border p-2 rounded"
                      required
                    />
                    <input
                      type="text"
                      placeholder="HS Code (e.g., 8517.12.00)"
                      value={item.hsCode}
                      onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                      className="border p-2 rounded"
                      required
                      pattern="^\d{4}\.\d{2}\.\d{2}$"
                      title="Format: XXXX.XX.XX"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="border p-2 rounded"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="border p-2 rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Total Value"
                      value={item.totalValue}
                      onChange={(e) => handleItemChange(index, 'totalValue', e.target.value)}
                      className="border p-2 rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Sales Tax"
                      value={item.salesTax}
                      onChange={(e) => handleItemChange(index, 'salesTax', e.target.value)}
                      className="border p-2 rounded"
                      required
                    />
                  </div>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 text-sm mt-2"
                    >
                      Remove Item
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 text-sm"
              >
                + Add Another Item
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Create FBR Invoice
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
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

          {/* Invoices List with HS Code Display */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">FBR Invoices</h3>
            {invoices.length === 0 ? (
              <div className="text-gray-500">No invoices found.</div>
            ) : (
              invoices.map(inv => (
                <div key={inv._id} className="bg-white rounded-lg shadow p-4 mb-2">
                  <div><span className="font-semibold">Invoice #:</span> {inv.invoiceNumber || 'N/A'}</div>
                  <div><span className="font-semibold">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      inv.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      inv.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inv.status || 'pending'}
                    </span>
                  </div>
                  <div><span className="font-semibold">Client:</span> {inv.client?.companyName || inv.client?.name || 'N/A'}</div>
                  <div><span className="font-semibold">Amount:</span> {inv.amount || inv.finalAmount || 0}</div>
                  <div><span className="font-semibold">Environment:</span> {inv.fbrEnvironment || 'sandbox'}</div>
                  
                  {/* HS Code Display */}
                  {inv.hsCode && (
                    <div><span className="font-semibold">HS Code:</span> {inv.hsCode}</div>
                  )}
                  
                  {/* Items with HS Codes */}
                  {inv.items && inv.items.length > 0 && (
                    <div className="mt-2">
                      <span className="font-semibold">Items:</span>
                      <div className="ml-4 mt-1">
                        {inv.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            • {item.description} - HS: {item.hsCode} - Qty: {item.quantity} - {item.totalValue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div><span className="font-semibold">Submission Date:</span> 
                    {inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div><span className="font-semibold">Created:</span> 
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "pending" && (
        <div>
          <h3 className="text-lg font-bold mb-2">Pending Invoices</h3>
          {invoices.filter(inv => inv.status === "pending").length === 0 ? (
            <div className="text-gray-500">No pending invoices found.</div>
          ) : (
            invoices.filter(inv => inv.status === "pending").map(inv => (
              <div key={inv._id} className="bg-white rounded-lg shadow p-4 mb-2">
                <div><span className="font-semibold">Invoice #:</span> {inv.invoiceNumber || 'N/A'}</div>
                <div><span className="font-semibold">Client:</span> {inv.client?.companyName || inv.client?.name || 'N/A'}</div>
                <div><span className="font-semibold">Amount:</span> {inv.amount || inv.finalAmount || 0}</div>
                <div><span className="font-semibold">Environment:</span> {inv.fbrEnvironment || 'sandbox'}</div>
                
                {/* HS Code Display */}
                {inv.hsCode && (
                  <div><span className="font-semibold">HS Code:</span> {inv.hsCode}</div>
                )}
                
                {/* Items with HS Codes */}
                {inv.items && inv.items.length > 0 && (
                  <div className="mt-2">
                    <span className="font-semibold">Items:</span>
                    <div className="ml-4 mt-1">
                      {inv.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          • {item.description} - HS: {item.hsCode} - Qty: {item.quantity} - {item.totalValue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div><span className="font-semibold">Created Date:</span> 
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <button className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                  Submit to FBR
                </button>
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