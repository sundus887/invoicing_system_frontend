import { useEffect, useState } from 'react';
import api from '../services/api';

function FbrEInvoicingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ accepted: 0, pending: 0, rejected: 0, total: 0 });
  const [tab, setTab] = useState("submissions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch FBR invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/fbr-invoices'); // ✅ Fixed API URL
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
      const response = await api.get('/api/fbr-invoices/summary'); // ✅ Fixed API URL
      console.log('✅ FBR summary loaded:', response.data);
      setSummary(response.data);
    } catch (err) {
      console.error('❌ Error fetching FBR summary:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
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
        {["submissions", "pending", "api"].map((t) => (
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
          </button>
        ))}
      </div>

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

          {/* Invoices List */}
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
                  <div><span className="font-semibold">Client:</span> {inv.client?.name || 'N/A'}</div>
                  <div><span className="font-semibold">Amount:</span> ₹{inv.finalAmount || 0}</div>
                  <div><span className="font-semibold">Submission Date:</span> 
                    {inv.submissionDate ? new Date(inv.submissionDate).toLocaleDateString() : 'N/A'}
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
                <div><span className="font-semibold">Client:</span> {inv.client?.name || 'N/A'}</div>
                <div><span className="font-semibold">Amount:</span> ₹{inv.finalAmount || 0}</div>
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
          <h3 className="text-lg font-bold mb-2">API Settings</h3>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-4">
              Configure your FBR API credentials to enable e-invoicing functionality.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter FBR Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter FBR Client Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.fbr.gov.pk"
                />
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FbrEInvoicingPage;