import React, { useState, useEffect } from 'react';
import api, { retryRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function FbrEInvoicingPage() {
  const { user, sellerId, isSeller, isAdmin } = useAuth();
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [submittedInvoices, setSubmittedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [retryCount, setRetryCount] = useState(0);

  // Fetch pending FBR invoices
  const fetchPendingInvoices = async () => {
    try {
      setError(null);
      
      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to view FBR invoices.');
        return;
      }

      console.log('🌐 Fetching pending FBR invoices for seller:', sellerId);
      
      const response = await retryRequest(async () => {
        return await api.get('/api/fbrinvoices/pending');
      }, 3);

      console.log('✅ Backend pending FBR invoices response:', response.data);
      
      if (response.data.success) {
        setPendingInvoices(response.data.pendingInvoices);
        setRetryCount(0);
      } else {
        setError('Failed to load pending FBR invoices.');
      }
    } catch (err) {
      console.error('❌ Error fetching pending FBR invoices:', err);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < 2) {
        setTimeout(() => {
          console.log(`🔄 Auto-retrying pending FBR invoices fetch (attempt ${retryCount + 1})...`);
          fetchPendingInvoices();
        }, 2000);
      } else {
        setError('Failed to load pending FBR invoices after multiple attempts.');
      }
    }
  };

  // Fetch submitted FBR invoices
  const fetchSubmittedInvoices = async () => {
    try {
      setError(null);

      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to view FBR invoices.');
        return;
      }

      console.log('🌐 Fetching submitted FBR invoices for seller:', sellerId);
      
      const response = await retryRequest(async () => {
        return await api.get('/api/fbrinvoices/submissions');
      }, 3);

      console.log('✅ Backend submitted FBR invoices response:', response.data);
      
      if (response.data.success) {
        setSubmittedInvoices(response.data.submittedInvoices);
        setRetryCount(0);
      } else {
        setError('Failed to load submitted FBR invoices.');
      }
    } catch (err) {
      console.error('❌ Error fetching submitted FBR invoices:', err);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < 2) {
        setTimeout(() => {
          console.log(`🔄 Auto-retrying submitted FBR invoices fetch (attempt ${retryCount + 1})...`);
          fetchSubmittedInvoices();
        }, 2000);
      } else {
        setError('Failed to load submitted FBR invoices after multiple attempts.');
      }
    }
  };

  // Submit invoice to FBR
  const handleSubmitToFBR = async (invoiceId) => {
    try {
      setError(null);
      
      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to submit to FBR.');
        return;
      }

      console.log('📤 Submitting invoice to FBR:', invoiceId);
      
      // This would be a POST request to submit to FBR
      // For now, we'll just show a success message
      setSuccess('Invoice submitted to FBR successfully! (Mock submission)');
      
      // Refresh the data
      await fetchPendingInvoices();
      await fetchSubmittedInvoices();
    } catch (err) {
      console.error('❌ Error submitting to FBR:', err);
      setError('Failed to submit invoice to FBR. Please try again.');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    setLoading(true);
    if (activeTab === 'pending') {
      fetchPendingInvoices().finally(() => setLoading(false));
    } else {
      fetchSubmittedInvoices().finally(() => setLoading(false));
    }
  }, [activeTab]);

  if (loading) {
    return (
        <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading FBR invoices...</p>
        {retryCount > 0 && (
          <p className="text-sm text-yellow-600 mt-1">
            Retry attempt {retryCount}/2
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
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

      {/* Seller Context Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Seller Context Information</h3>
        <div className="text-sm text-blue-700">
          <p><strong>User:</strong> {user?.name || 'N/A'} ({user?.role || 'N/A'})</p>
          <p><strong>Seller ID:</strong> {sellerId || 'N/A'}</p>
          <p><strong>Permissions:</strong> {isSeller() ? 'Seller' : isAdmin() ? 'Admin' : 'Limited'}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">FBR E-Invoicing</h2>
          </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Submissions ({pendingInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submitted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Submitted ({submittedInvoices.length})
          </button>
        </nav>
      </div>

      {/* Pending Invoices Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
              <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Invoice #</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-gray-500">
                    No pending FBR invoices found.
                  </td>
                </tr>
              ) : (
                pendingInvoices.map((fbrInvoice) => (
                  <tr key={fbrInvoice._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.invoiceId?.buyerId?.companyName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      ${fbrInvoice.amount?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.submittedAt ? new Date(fbrInvoice.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        {fbrInvoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleSubmitToFBR(fbrInvoice._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        disabled={!isSeller() && !isAdmin()}
                      >
                        Submit to FBR
                      </button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
        </div>
      )}

      {/* Submitted Invoices Tab */}
      {activeTab === 'submitted' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Invoice #</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">FBR Status</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">IRN</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Submitted Date</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submittedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 px-4 text-center text-gray-500">
                    No submitted FBR invoices found.
                  </td>
                </tr>
              ) : (
                submittedInvoices.map((fbrInvoice) => (
                  <tr key={fbrInvoice._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.invoiceId?.buyerId?.companyName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      ${fbrInvoice.amount?.toFixed(2) || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        fbrInvoice.fbrStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        fbrInvoice.fbrStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {fbrInvoice.fbrStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.irn || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {fbrInvoice.submittedAt ? new Date(fbrInvoice.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                        <button
                        onClick={() => window.open(`/api/fbrinvoices/generate-pdf/${fbrInvoice.invoiceNumber}`, '_blank')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        disabled={!isSeller() && !isAdmin()}
                      >
                        Download PDF
                          </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FbrEInvoicingPage;