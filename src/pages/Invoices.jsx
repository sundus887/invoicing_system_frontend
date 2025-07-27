import { useEffect, useState } from 'react';
import api from '../services/api';

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    invoiceNumber: "",
    buyerInfo: "",
    items: "",
    totalAmount: "",
    discount: "",
    gst: "",
    incomeTax: "",
    finalAmount: "",
    digitalSignature: "",
    irn: "",
    qrCode: "",
  });

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/invoices'); // ✅ Added /api/ prefix
      console.log('✅ Backend invoices response:', response.data);
      setInvoices(response.data);
    } catch (err) {
      console.error('❌ Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Excel Export Function - Fixed API endpoint and blob handling
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      
      // Try backend export first - FIXED: Use correct endpoint
      try {
        // 🎯 FIX: Use the same API URL as other requests
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('🚀 Using API URL for export:', apiUrl);
        
        const response = await fetch(`${apiUrl}/api/export/excel`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the blob data
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        // Success message
        alert('Excel file downloaded successfully!');
        return;
        
      } catch (backendError) {
        console.log('Backend export failed, using client-side fallback:', backendError);
        
        // Fallback to client-side CSV export
        const headers = [
          'Invoice #',
          'Client',
          'Services',
          'Total Amount',
          'Discount',
          'Tax',
          'Final Amount',
          'Status',
          'Date'
        ];
        
        const csvContent = [
          headers.join(','),
          ...invoices.map(inv => [
            inv._id?.slice(-6) || 'N/A',
            inv.client || 'N/A',
            (inv.services?.map(service => service.name).join(', ') || inv.items || 'N/A').replace(/,/g, ';'),
            inv.totalAmount || 0,
            inv.discount || 0,
            inv.tax || inv.gst || 0,
            inv.finalAmount || 0,
            inv.status || 'pending',
            inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A'
          ].join(','))
        ].join('\n');
        
        // Create and download the CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Backend export failed. Invoice data exported as CSV instead.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export invoice data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      // Create invoice data with optional QR code
      const invoiceData = {
        ...form,
        qrCode: form.qrCode || null // Make QR code optional
      };
      
      await api.post('/api/invoices', invoiceData); // ✅ Added /api/ prefix
      setShowForm(false);
      setForm({
        invoiceNumber: "",
        buyerInfo: "",
        items: "",
        totalAmount: "",
        discount: "",
        gst: "",
        incomeTax: "",
        finalAmount: "",
        digitalSignature: "",
        irn: "",
        qrCode: "",
      });
      await fetchInvoices();
    } catch (err) {
      console.error('❌ Error adding invoice:', err);
      setError('Failed to add invoice. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading invoices...</div>;
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Invoices</h2>
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
                📊 Export to Excel
              </>
            )}
          </button>
          <button
            className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
            onClick={() => setShowForm(true)}
          >
            <span className="text-xl">+</span> Add Invoice
          </button>
        </div>
      </div>
      {showForm && (
        <form
          onSubmit={handleAddInvoice}
          className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} placeholder="Invoice Number" className="border p-2 rounded" required />
          <input name="buyerInfo" value={form.buyerInfo} onChange={handleChange} placeholder="Buyer Info" className="border p-2 rounded" required />
          <input name="items" value={form.items} onChange={handleChange} placeholder="Items" className="border p-2 rounded" />
          <input name="totalAmount" value={form.totalAmount} onChange={handleChange} placeholder="Total Amount" className="border p-2 rounded" />
          <input name="discount" value={form.discount} onChange={handleChange} placeholder="Discount" className="border p-2 rounded" />
          <input name="gst" value={form.gst} onChange={handleChange} placeholder="GST" className="border p-2 rounded" />
          <input name="incomeTax" value={form.incomeTax} onChange={handleChange} placeholder="Income Tax" className="border p-2 rounded" />
          <input name="finalAmount" value={form.finalAmount} onChange={handleChange} placeholder="Final Amount" className="border p-2 rounded" />
          <input name="digitalSignature" value={form.digitalSignature} onChange={handleChange} placeholder="Digital Signature" className="border p-2 rounded" />
          <input name="irn" value={form.irn} onChange={handleChange} placeholder="IRN" className="border p-2 rounded" />
          <input name="qrCode" value={form.qrCode} onChange={handleChange} placeholder="QR Code (optional - data url)" className="border p-2 rounded" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">Add Invoice</button>
          <button type="button" onClick={() => setShowForm(false)} className="col-span-1 md:col-span-2 text-gray-500 mt-2">Cancel</button>
        </form>
      )}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Invoice #</th>
            <th className="py-2 px-4 border">Client</th>
            <th className="py-2 px-4 border">Services</th>
            <th className="py-2 px-4 border">Total Amount</th>
            <th className="py-2 px-4 border">Discount</th>
            <th className="py-2 px-4 border">Tax</th>
            <th className="py-2 px-4 border">Final Amount</th>
            <th className="py-2 px-4 border">Status</th>
            <th className="py-2 px-4 border">Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="9" className="py-4 px-4 border text-center text-gray-500">
                No invoices found. Add your first invoice!
              </td>
            </tr>
          ) : (
            invoices.map((inv, idx) => (
              <tr key={inv._id || idx}>
                <td className="py-2 px-4 border">{inv._id?.slice(-6) || `INV-${idx + 1}`}</td>
                <td className="py-2 px-4 border">{inv.client || 'N/A'}</td>
                <td className="py-2 px-4 border">
                  {inv.services?.map(service => service.name).join(', ') || inv.items || 'N/A'}
                </td>
                <td className="py-2 px-4 border">₹{inv.totalAmount || 0}</td>
                <td className="py-2 px-4 border">₹{inv.discount || 0}</td>
                <td className="py-2 px-4 border">₹{inv.tax || inv.gst || 0}</td>
                <td className="py-2 px-4 border">₹{inv.finalAmount || 0}</td>
                <td className="py-2 px-4 border">
                  <span className={`px-2 py-1 rounded text-xs ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    inv.status === 'unpaid' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {inv.status || 'pending'}
                  </span>
                </td>
                <td className="py-2 px-4 border">
                  {inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesPage;