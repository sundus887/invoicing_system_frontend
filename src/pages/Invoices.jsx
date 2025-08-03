import { useEffect, useState } from 'react';
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
      hsCode: "", // Add HS Code field
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
      const response = await api.get(`/hscodes/lookup?description=${encodeURIComponent(productDescription)}`);
      return response.data.hsCode;
    } catch (error) {
      console.error('Error looking up HS Code:', error);
      return '9983.99.00'; // Default fallback
    }
  };

  // Auto-assign HS Code when product description changes
  const handleItemDescriptionChange = async (index, value) => {
    const newItems = [...form.items];
    newItems[index].description = value;
    
    // Auto-assign HS Code
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
      
      // Check if user has permission to view invoices
      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to view invoices');
        return;
      }
      
      console.log('📋 Fetching invoices for seller:', sellerId);
      const response = await api.get('/invoices');
      console.log('✅ Backend invoices response:', response.data);
      
      // Backend now automatically filters by seller
      setInvoices(response.data.invoices || response.data);
    } catch (err) {
      console.error('❌ Error fetching invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buyers (clients) from backend with seller context
  const fetchBuyers = async () => {
    try {
      console.log('📋 Fetching buyers for seller:', sellerId);
      const response = await api.get('/clients');
      console.log('✅ Buyers loaded:', response.data);
      
      // Backend now automatically filters by seller
      setBuyers(response.data.buyers || response.data);
    } catch (err) {
      console.error('❌ Error fetching buyers:', err);
      setBuyers([]);
    }
  };

  // Check FBR authentication status
  const checkFbrAuthStatus = async () => {
    try {
      const response = await api.get('/fbr-auth/status');
      setFbrAuthStatus(response.data.isAuthenticated);
    } catch (err) {
      console.error('❌ Error checking FBR auth status:', err);
      setFbrAuthStatus(false);
    }
  };

  // PDF Generation Function - Updated for FBR
  const handleGeneratePDF = async (invoice) => {
    try {
      console.log('   Generating PDF for invoice:', invoice.invoiceNumber);
      
      // Use the FBR-specific PDF endpoint
      const response = await api.get(`/pdf/fbr-invoice/${invoice.invoiceNumber}`, {
        responseType: 'blob'
      });
      
      // Create download link
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
      console.error('❌ Error generating PDF:', error);
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
        hsCode: "", // Add HS Code field
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
      
      // Calculate totals for this item
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = parseFloat(updatedItems[index].quantity) || 0;
        const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0;
        updatedItems[index].totalValue = quantity * unitPrice;
        updatedItems[index].salesTax = updatedItems[index].totalValue * 0.18; // 18% tax
      }
      
      // Calculate invoice totals
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
        'HS Codes', // Add HS Codes column
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
          const hsCodes = inv.items?.map(item => item.hsCode || '0000.00.00').join('; ') || '0000.00.00'; // Add HS Codes
          const fbrStatus = inv.fbrReference ? 'Submitted' : 'Not Submitted';
          
          const row = [
            inv.invoiceNumber || inv._id?.slice(-6) || 'N/A',
            buyerName,
            items,
            hsCodes, // Add HS Codes to export
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
      console.error('Export failed:', error);
      setError('Failed to export invoice data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if user has permission
    if (isSeller() || isAdmin()) {
    fetchInvoices();
    fetchBuyers();
    checkFbrAuthStatus();
    }
  }, [sellerId, isSeller, isAdmin]);

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

      const response = await api.post('/invoices', invoiceData);
      console.log('✅ Invoice created successfully:', response.data);
      
      if (response.data.success) {
        // Submit to FBR
        const fbrResponse = await api.post('/fbrinvoices/create-from-invoice', {
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
      
      {/* FBR Invoice Creation Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Create FBR Invoice</h3>
          
          <form onSubmit={handleAddInvoice} className="space-y-6">
            {/* Buyer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Buyer *
              </label>
              <select
                value={form.buyerId}
                onChange={(e) => setForm(prev => ({ ...prev, buyerId: e.target.value }))}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select a buyer...</option>
                {buyers.map(buyer => (
                  <option key={buyer._id} value={buyer._id}>
                    {buyer.companyName} - {buyer.buyerNTN}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Items *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  + Add Item
                </button>
              </div>
              
              {form.items.map((item, index) => (
                <div key={index} className="border rounded-md p-4 mb-4">
                  <div className="grid grid-cols-7 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemDescriptionChange(index, e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter product/service description"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">HS Code</label>
                      <input
                        type="text"
                        value={item.hsCode}
                        onChange={(e) => updateItem(index, 'hsCode', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        placeholder="Auto-assigned"
                        readOnly={!!item.hsCode}
                      />
                      {item.hsCode && (
                        <small className="text-green-600 text-xs">
                          ✅ Auto-assigned
                        </small>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Value</label>
                      <input
                        type="number"
                        value={item.totalValue}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-6 bg-red-600 text-white px-3 py-2 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Summary */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Invoice Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{form.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (18%):</span>
                  <span>{form.salesTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>{form.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Final Amount:</span>
                  <span>{form.finalValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded"
              >
                Create & Submit to FBR
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
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
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 px-4 text-center text-gray-500">
                  No invoices found. Create your first FBR invoice!
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
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
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleGeneratePDF(inv)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        📄 Download PDF
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoicesPage;