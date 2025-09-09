import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function InvoicesPage() {
  const { user, sellerId, isSeller, isAdmin } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // FBR Submission State
  const [fbrSubmitting, setFbrSubmitting] = useState({});
  const [fbrResult, setFbrResult] = useState({});

  // FBR Authentication State
  const [fbrAuthStatus, setFbrAuthStatus] = useState(false);

  // Form state for FBR-compliant invoice creation with HS Codes
  const [form, setForm] = useState({
    buyerId: "",
    items: [{
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalValue: 0,
      salesTax: 0,
      discount: 0,
      hsCode: "",
    }],
    totalAmount: 0,
    salesTax: 0,
    extraTax: 0,
    discount: 0,
    finalValue: 0,
    issuedDate: new Date().toISOString().split('T')[0],
    status: "pending"
  });

  // Buyers state
  const [buyers, setBuyers] = useState([]);

  // HS Code lookup functionality
  const lookupHSCode = async (productDescription) => {
    try {
      const response = await api.get(`/api/hscodes/lookup?description=${encodeURIComponent(productDescription)}`);
      return response.data.hsCode;
    } catch (error) {
      console.error('Error looking up HS Code:', error);
      return '9983.99.00';
    }
  };

  // Auto-assign HS Code when product description changes
  const handleItemDescriptionChange = async (index, value) => {
    const newItems = [...form.items];
    newItems[index].description = value;

    if (value.trim()) {
      const hsCode = await lookupHSCode(value);
      newItems[index].hsCode = hsCode;
      console.log(`🔍 Auto-assigned HS Code for "${value}": ${hsCode}`);
    }

    setForm(prev => ({
      ...prev,
      items: newItems
    }));
  };

  // Fetch invoices from backend with seller context
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to view invoices');
        return;
      }

      const response = await api.get('/api/invoices');
      setInvoices(response.data.invoices || response.data);
      // Reset to first page when data changes
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buyers (clients) from backend with seller context
  const fetchBuyers = async () => {
    try {
      const response = await api.get('/api/clients');
      setBuyers(response.data.clients || response.data);
    } catch (err) {
      setBuyers([]);
    }
  };

  // Check FBR authentication status
  const checkFbrAuthStatus = async () => {
    try {
      const response = await api.get('/api/fbr-auth/status');
      setFbrAuthStatus(response.data.isAuthenticated);
    } catch (err) {
      setFbrAuthStatus(false);
    }
  };

  // PDF Generation Function - Updated for FBR
  const handleGeneratePDF = async (invoice) => {
    try {
      const response = await api.get(`/api/pdf/fbr-invoice/${invoice.invoiceNumber}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fbr-invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('PDF downloaded successfully!');
    } catch (error) {
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Add new item to invoice form
  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        description: "",
        quantity: 1,
        unitPrice: 0,
        totalValue: 0,
        salesTax: 0,
        discount: 0,
        hsCode: "",
      }]
    }));
  };

  // Remove item from invoice form
  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update item in invoice form
  const updateItem = (index, field, value) => {
    setForm(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index][field] = value;

      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = parseFloat(updatedItems[index].quantity) || 0;
        const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0;
        updatedItems[index].totalValue = quantity * unitPrice;
        updatedItems[index].salesTax = updatedItems[index].totalValue * 0.18;
      }

      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
      const totalTax = updatedItems.reduce((sum, item) => sum + (item.salesTax || 0), 0);
      const totalDiscount = updatedItems.reduce((sum, item) => sum + (item.discount || 0), 0);

      return {
        ...prev,
        items: updatedItems,
        totalAmount,
        salesTax: totalTax,
        discount: totalDiscount,
        finalValue: totalAmount + totalTax - totalDiscount
      };
    });
  };

  // Excel Export Function
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);

      const headers = [
        'Invoice #',
        'Buyer',
        'Items',
        'HS Codes',
        'Total Amount',
        'Sales Tax',
        'Final Amount',
        'Date',
        'Status',
        'FBR Status'
      ];

      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value).trim();
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
      };

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...invoices.map(inv => {
          const buyerName = inv.buyerId?.companyName || 'N/A';
          const items = inv.items?.map(item => item.description || item.product).join('; ') || inv.product || 'N/A';
          const hsCodes = inv.items?.map(item => item.hsCode || '0000.00.00').join('; ') || '0000.00.00';
          const fbrStatus = inv.fbrReference ? 'Submitted' : 'Not Submitted';

          const row = [
            inv.invoiceNumber || inv._id?.slice(-6) || 'N/A',
            buyerName,
            items,
            hsCodes,
            (inv.totalAmount || inv.totalValue || 0).toFixed(2),
            (inv.salesTax || 0).toFixed(2),
            (inv.finalValue || inv.finalAmount || 0).toFixed(2),
            inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A',
            inv.status || 'pending',
            fbrStatus
          ];

          return row.map(escapeCSV).join(',');
        })
      ].join('\r\n');

      const BOM = '\uFEFF';
      const csvContentWithBOM = BOM + csvContent;

      const blob = new Blob([csvContentWithBOM], {
        type: 'text/csv;charset=utf-8;'
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      link.setAttribute('download', `invoices-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Invoice data exported successfully as CSV!');
    } catch (error) {
      setError('Failed to export invoice data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // FBR Submission Handler
  const handleSubmitToFbr = async (invoiceId) => {
    setFbrSubmitting(prev => ({ ...prev, [invoiceId]: true }));
    setFbrResult(prev => ({ ...prev, [invoiceId]: null }));
    try {
      const response = await api.post('/api/fbr/submit-invoice', {
        invoiceId,
        sellerId
      });
      setFbrResult(prev => ({
        ...prev,
        [invoiceId]: { success: true, data: response.data.fbrResponse }
      }));
      setSuccess('Invoice submitted to FBR successfully!');
      await fetchInvoices();
    } catch (err) {
      setFbrResult(prev => ({
        ...prev,
        [invoiceId]: {
          success: false,
          error: err.response?.data?.message || 'FBR submission failed'
        }
      }));
      setError('FBR submission failed.');
    } finally {
      setFbrSubmitting(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  useEffect(() => {
    if (isSeller() || isAdmin()) {
      fetchInvoices();
      fetchBuyers();
      checkFbrAuthStatus();
    }
    // eslint-disable-next-line
  }, [sellerId, isSeller, isAdmin]);

  // Derived pagination data
  const totalInvoices = invoices.length;
  const totalPages = Math.max(1, Math.ceil(totalInvoices / pageSize));
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return invoices.slice(start, start + pageSize);
  }, [invoices, page, pageSize]);

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    
    // Check permissions
    if (!isSeller() && !isAdmin()) {
      setError('Only sellers can create invoices');
      return;
    }
    
    if (!fbrAuthStatus) {
      setError('Please authenticate with FBR first in Seller Settings');
      return;
    }

    if (!form.buyerId) {
      setError('Please select a buyer');
      return;
    }

    if (form.items.length === 0 || !form.items[0].description) {
      setError('Please add at least one item with description');
      return;
    }

    try {
      console.log('   Submitting invoice with seller context:', sellerId);
      
      // Create invoice with HS Codes - sellerId automatically assigned by backend
      const invoiceData = {
        buyerId: form.buyerId,
        items: form.items.map(item => ({
          ...item,
          hsCode: item.hsCode || '9983.99.00', // Ensure HS Code is included
          product: item.description, // Map description to product for backend
        })),
        totalAmount: form.totalAmount,
        salesTax: form.salesTax,
        extraTax: form.extraTax,
        discount: form.discount,
        finalValue: form.finalValue,
        issuedDate: form.issuedDate,
        status: form.status
      };

      const response = await api.post('/api/invoices', invoiceData);
      console.log('✅ Invoice created successfully:', response.data);
      
      if (response.data.success) {
        // Submit to FBR
        const fbrResponse = await api.post('/api/fbrinvoices/create-from-invoice', {
          invoiceNumber: response.data.invoice.invoiceNumber,
          sandbox: true
        });

        if (fbrResponse.data.success) {
          setSuccess('Invoice created and submitted to FBR successfully!');
          setShowForm(false);
          resetForm();
          await fetchInvoices();
        } else {
          setError('Invoice created but FBR submission failed');
        }
      }
    } catch (err) {
      console.error('❌ Error adding invoice:', err);
      setError(err.response?.data?.error || 'Failed to add invoice. Please try again.');
    }
  };

  const resetForm = () => {
    setForm({
      buyerId: "",
      items: [{
        description: "",
        quantity: 1,
        unitPrice: 0,
        totalValue: 0,
        salesTax: 0,
        discount: 0,
        hsCode: "", // Reset HS Code field
      }],
      totalAmount: 0,
      salesTax: 0,
      extraTax: 0,
      discount: 0,
      finalValue: 0,
      issuedDate: new Date().toISOString().split('T')[0],
      status: "pending"
    });
  };

  // Show loading state
  if (loading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  // Show permission error
  if (!isSeller() && !isAdmin()) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          You do not have permission to view invoices. Only sellers and admins can access this page.
        </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Seller Context</h3>
            <p className="text-sm text-blue-600">
              Logged in as: <strong>{user?.name}</strong> ({user?.role})
            </p>
            <p className="text-sm text-blue-600">
              Seller ID: <code className="bg-blue-100 px-1 rounded">{sellerId || 'Not set'}</code>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">
              Total Invoices: <strong>{invoices.length}</strong>
            </p>
            <p className="text-sm text-blue-600">
              Total Buyers: <strong>{buyers.length}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* FBR Authentication Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">FBR Status</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            fbrAuthStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {fbrAuthStatus ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
        {!fbrAuthStatus && (
          <p className="text-sm text-red-600 mt-2">
            ⚠ Please authenticate with FBR in Seller Settings before creating invoices
          </p>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">FBR Invoices</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            disabled={exportLoading || invoices.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exportLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                📊 Export to CSV
              </>
            )}
          </button>

          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            onClick={() => setShowForm(true)}
            disabled={!fbrAuthStatus}
          >
            <span className="text-xl">+</span> Create FBR Invoice
          </button>
        </div>
      </div>

      {/* ... (rest of your invoice creation form code remains unchanged) */}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Invoice #</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Buyer</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Items</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">HS Codes</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Total Amount</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Final Amount</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">FBR Status</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {totalInvoices === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 px-4 text-center text-gray-500">
                  No invoices found. Create your first FBR invoice!
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => {
                const buyerName = inv.buyerId?.companyName || 'N/A';
                const items = inv.items?.map(item => item.description || item.product).join(', ') || inv.product || 'N/A';
                const hsCodes = inv.items?.map(item => item.hsCode || '0000.00.00').join(', ') || '0000.00.00';
                const hasFbrData = inv.fbrReference || inv.uuid || inv.irn;

                return (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {inv.invoiceNumber || inv._id?.slice(-6)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{buyerName}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={items}>
                        {items}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={hsCodes}>
                        {hsCodes}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {(inv.totalAmount || inv.totalValue || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {(inv.finalValue || inv.finalAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        inv.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        hasFbrData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hasFbrData ? 'Submitted' : 'Not Submitted'}
                      </span>
                      {fbrResult[inv._id] && (
                        <div className="text-xs mt-1">
                          {fbrResult[inv._id].success
                            ? <span className="text-green-700">IRN: {fbrResult[inv._id].data?.irn || 'N/A'}</span>
                            : <span className="text-red-700">{fbrResult[inv._id].error}</span>
                          }
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleGeneratePDF(inv)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        📄 Download PDF
                      </button>
                      {!hasFbrData && (
                        <button
                          onClick={() => handleSubmitToFbr(inv._id)}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center gap-1"
                          disabled={fbrSubmitting[inv._id]}
                        >
                          {fbrSubmitting[inv._id] ? 'Submitting...' : 'Submit to FBR'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {totalInvoices > 0 && (
          <div className="flex items-center justify-between p-4 border-t bg-white">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalInvoices)} of {totalInvoices}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-sm">Page {page} / {totalPages}</span>
              <button
                className="px-3 py-1 rounded border disabled:opacity-50"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
              <select
                className="ml-2 border rounded px-2 py-1 text-sm"
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}/page</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoicesPage;