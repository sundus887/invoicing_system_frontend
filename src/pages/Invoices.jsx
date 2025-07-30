import { useEffect, useState } from 'react';
import api from '../services/api';
import { generatePDFInvoice } from '../components/PDFInvoice'; // ✅ Fixed import

function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // PDF Modal states
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedBuyerForPDF, setSelectedBuyerForPDF] = useState('default');
  const [selectedSellerForPDF, setSelectedSellerForPDF] = useState('default');
  
  const [form, setForm] = useState({
    invoiceNumber: "",
    product: "",
    units: "",
    unitPrice: "",
    totalValue: "",
    salesTax: "",
    extraTax: "",
    finalValue: "",
    date: new Date().toISOString().split('T')[0],
    status: "pending",
    buyerId: "",
    sellerId: "",
  });

  // Add state for buyers and sellers
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/invoices');
      console.log('✅ Backend invoices response:', response.data);
      console.log('   Number of invoices:', response.data.length);
      console.log('📋 First invoice sample:', response.data[0]);
      setInvoices(response.data);
    } catch (err) {
      console.error('❌ Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buyers (clients) from backend - FIXED ENDPOINT
  const fetchBuyers = async () => {
    try {
      console.log('   Fetching buyers...');
      const response = await api.get('/api/invoices/buyers/available');
      console.log('✅ Buyers loaded:', response.data);
      setBuyers(response.data);
    } catch (err) {
      console.error('❌ Error fetching buyers:', err);
      setBuyers([]);
    }
  };

  // Fetch sellers from backend - FIXED ENDPOINT
  const fetchSellers = async () => {
    try {
      console.log('🔄 Fetching sellers...');
      const response = await api.get('/api/invoices/sellers/available');
      console.log('✅ Sellers loaded:', response.data);
      setSellers(response.data);
    } catch (err) {
      console.error('❌ Error fetching sellers:', err);
      setSellers([]);
    }
  };

  // PDF Generation Function - NEW WITH BUYER/SELLER SELECTION
  const handleGeneratePDF = async (invoice, selectedBuyerId = 'default', selectedSellerId = 'default') => {
    try {
      console.log('   Generating PDF for invoice:', invoice._id);
      console.log('🔍 Selected buyer ID:', selectedBuyerId);
      console.log('   Selected seller ID:', selectedSellerId);
      
      // Use the new backend endpoint with buyer/seller selection
      const response = await api.get(`/api/invoices/${invoice._id}/pdf/${selectedBuyerId}/${selectedSellerId}`);
      
      const { invoice: invoiceData, buyer, seller } = response.data;
      
      console.log('✅ Received PDF data:', { invoiceData, buyer, seller });
      
      // Generate PDF with specific buyer/seller data
      await generatePDFInvoice(invoiceData, buyer, seller);
      console.log('✅ PDF generated successfully with selected buyer/seller');
      
      // Close modal after successful generation
      setShowPDFModal(false);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Open PDF selection modal
  const openPDFModal = (invoice) => {
    setSelectedInvoice(invoice);
    setSelectedBuyerForPDF(invoice.buyerId || 'default');
    setSelectedSellerForPDF(invoice.sellerId || 'default');
    setShowPDFModal(true);
  };

  // Excel Export Function - Fixed API endpoint and blob handling
  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      
      // Try backend export first
      try {
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

        // Get the CSV data from backend
        const csvData = await response.text();
        
        // Add BOM (Byte Order Mark) for better Excel compatibility if not already present
        const BOM = '\uFEFF';
        const csvDataWithBOM = csvData.startsWith(BOM) ? csvData : BOM + csvData;
        
        // Create and download the CSV file with proper encoding
        const blob = new Blob([csvDataWithBOM], { 
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
        
        // Success message
        alert('Invoice data exported successfully as CSV!');
        return;
        
      } catch (backendError) {
        console.log('Backend export failed, using client-side fallback:', backendError);
        
        // Fallback to client-side CSV export with correct field names
        const headers = [
          'Invoice #',
          'Product',
          'Units/Quantity',
          'Unit Price Excluding GST',
          'Total Value Excluding GST',
          'Sales Tax',
          'Extra Tax',
          'Value including GST & Extra Tax',
          'Date',
          'Status'
        ];
        
        // Helper function to properly escape CSV values
        const escapeCSV = (value) => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value).trim();
          // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
          }
          return stringValue;
        };
        
        const csvContent = [
          headers.map(escapeCSV).join(','),
          ...invoices.map(inv => {
            // Use actual invoice data or calculate defaults
            const unitPrice = parseFloat(inv.unitPrice) || 0;
            const quantity = parseFloat(inv.units) || 1;
            const totalValue = parseFloat(inv.totalValue) || (unitPrice * quantity);
            const salesTax = parseFloat(inv.salesTax) || (totalValue * 0.18);
            const extraTax = parseFloat(inv.extraTax) || 0;
            const finalValue = parseFloat(inv.finalValue) || (totalValue + salesTax + extraTax);
            
            const row = [
              inv.invoiceNumber || inv._id?.slice(-6) || 'N/A',
              inv.product || inv.items?.[0]?.product || 'N/A',
              quantity.toFixed(2),
              unitPrice.toFixed(2),
              totalValue.toFixed(2),
              salesTax.toFixed(2),
              extraTax.toFixed(2),
              finalValue.toFixed(2),
              inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A',
              inv.status || 'pending'
            ];
            
            return row.map(escapeCSV).join(',');
          })
        ].join('\r\n'); // Use \r\n for better Excel compatibility on Windows
        
        // Add BOM (Byte Order Mark) for better Excel compatibility
        const BOM = '\uFEFF';
        const csvContentWithBOM = BOM + csvContent;
        
        // Create and download the CSV file with proper encoding
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
    fetchBuyers();
    fetchSellers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    
    // Auto-calculate values based on unit price and quantity
    if (name === 'unitPrice' || name === 'units') {
      const unitPrice = parseFloat(name === 'unitPrice' ? value : form.unitPrice) || 0;
      const units = parseFloat(name === 'units' ? value : form.units) || 0;
      const totalValue = unitPrice * units;
      const salesTax = totalValue * 0.18; // 18% GST
      const extraTax = parseFloat(form.extraTax) || 0;
      const finalValue = totalValue + salesTax + extraTax;
      
      newForm.totalValue = totalValue.toFixed(2);
      newForm.salesTax = salesTax.toFixed(2);
      newForm.finalValue = finalValue.toFixed(2);
    }
    
    // Recalculate final value when extra tax changes
    if (name === 'extraTax') {
      const totalValue = parseFloat(form.totalValue) || 0;
      const salesTax = parseFloat(form.salesTax) || 0;
      const extraTax = parseFloat(value) || 0;
      const finalValue = totalValue + salesTax + extraTax;
      newForm.finalValue = finalValue.toFixed(2);
    }
    
    setForm(newForm);
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    try {
      console.log('   Submitting invoice with data:', form);
      console.log('   Buyer ID:', form.buyerId);
      console.log('📊 Seller ID:', form.sellerId);
      
      // Validate buyer and seller selection
      if (!form.buyerId) {
        alert('Please select a buyer');
        return;
      }
      if (!form.sellerId) {
        alert('Please select a seller');
        return;
      }
      
      const response = await api.post('/api/invoices', form);
      console.log('✅ Invoice added successfully:', response.data);
      
      setShowForm(false);
      setForm({
        invoiceNumber: "",
        product: "",
        units: "",
        unitPrice: "",
        totalValue: "",
        salesTax: "",
        extraTax: "",
        finalValue: "",
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        buyerId: "",
        sellerId: "",
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
                📊 Export to CSV
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
          <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} placeholder="Invoice #" className="border p-2 rounded" required />
          <input name="product" value={form.product} onChange={handleChange} placeholder="Product" className="border p-2 rounded" required />
          <input name="units" type="number" value={form.units} onChange={handleChange} placeholder="Units/Quantity" className="border p-2 rounded" required />
          <input name="unitPrice" type="number" step="0.01" value={form.unitPrice} onChange={handleChange} placeholder="Unit Price Excluding GST" className="border p-2 rounded" required />
          <input name="totalValue" type="number" step="0.01" value={form.totalValue} onChange={handleChange} placeholder="Total Value Excluding GST" className="border p-2 rounded" required />
          <input name="salesTax" type="number" step="0.01" value={form.salesTax} onChange={handleChange} placeholder="Sales Tax" className="border p-2 rounded" />
          <input name="extraTax" type="number" step="0.01" value={form.extraTax} onChange={handleChange} placeholder="Extra Tax" className="border p-2 rounded" />
          <input name="finalValue" type="number" step="0.01" value={form.finalValue} onChange={handleChange} placeholder="Value including GST & Extra Tax" className="border p-2 rounded" required />
          <input name="date" type="date" value={form.date} onChange={handleChange} className="border p-2 rounded" required />
          <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded" required>
            <option value="">Select Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {/* Buyer Selection */}
          <select name="buyerId" value={form.buyerId} onChange={handleChange} className="border p-2 rounded" required>
            <option value="">Select Buyer (Client)</option>
            {buyers.map(buyer => (
              <option key={buyer._id} value={buyer._id}>
                {buyer.companyName} - {buyer.buyerSTRN}
              </option>
            ))}
          </select>
          
          {/* Seller Selection */}
          <select name="sellerId" value={form.sellerId} onChange={handleChange} className="border p-2 rounded" required>
            <option value="">Select Seller</option>
            {sellers.map(seller => (
              <option key={seller._id} value={seller._id}>
                {seller.companyName} - {seller.sellerNTN}
              </option>
            ))}
          </select>
          
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">Add Invoice</button>
          <button type="button" onClick={() => setShowForm(false)} className="col-span-1 md:col-span-2 text-gray-500 mt-2">Cancel</button>
        </form>
      )}
      
      {/* PDF Selection Modal */}
      {showPDFModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Select Buyer & Seller for PDF</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Buyer:</label>
              <select 
                value={selectedBuyerForPDF} 
                onChange={(e) => setSelectedBuyerForPDF(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="default">Use Invoice Default</option>
                {buyers.map(buyer => (
                  <option key={buyer._id} value={buyer._id}>
                    {buyer.companyName} - {buyer.buyerSTRN}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Seller:</label>
              <select 
                value={selectedSellerForPDF} 
                onChange={(e) => setSelectedSellerForPDF(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="default">Use Invoice Default</option>
                {sellers.map(seller => (
                  <option key={seller._id} value={seller._id}>
                    {seller.companyName} - {seller.sellerNTN}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleGeneratePDF(selectedInvoice, selectedBuyerForPDF, selectedSellerForPDF)}
                className="bg-blue-600 text-white px-4 py-2 rounded flex-1"
              >
                Generate PDF
              </button>
              <button
                onClick={() => setShowPDFModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Invoice #</th>
            <th className="py-2 px-4 border">Product</th>
            <th className="py-2 px-4 border">Units/Quantity</th>
            <th className="py-2 px-4 border">Unit Price Excluding GST</th>
            <th className="py-2 px-4 border">Total Value Excluding GST</th>
            <th className="py-2 px-4 border">Sales Tax</th>
            <th className="py-2 px-4 border">Extra Tax</th>
            <th className="py-2 px-4 border">Value including GST & Extra Tax</th>
            <th className="py-2 px-4 border">Date</th>
            <th className="py-2 px-4 border">Status</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="11" className="py-4 px-4 border text-center text-gray-500">
                No invoices found. Add your first invoice!
              </td>
            </tr>
          ) : (
            invoices.map((inv, idx) => {
              console.log('📋 Rendering invoice:', inv); // ✅ Added debugging
              
              // Use actual invoice data or calculate defaults
              const unitPrice = parseFloat(inv.unitPrice) || 0;
              const quantity = parseFloat(inv.units) || 1;
              const totalValue = parseFloat(inv.totalValue) || (unitPrice * quantity);
              const salesTax = parseFloat(inv.salesTax) || (totalValue * 0.18); // 18% GST
              const extraTax = parseFloat(inv.extraTax) || 0;
              const finalValue = parseFloat(inv.finalValue) || (totalValue + salesTax + extraTax);
              
              return (
                <tr key={inv._id || idx}>
                  <td className="py-2 px-4 border">{inv.invoiceNumber || inv._id?.slice(-6) || `INV-${idx + 1}`}</td>
                  <td className="py-2 px-4 border">{inv.product || inv.items?.[0]?.product || 'N/A'}</td>
                  <td className="py-2 px-4 border">{quantity.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{unitPrice.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{totalValue.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{salesTax.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{extraTax.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{finalValue.toLocaleString()}</td>
                  <td className="py-2 px-4 border">
                    {inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      inv.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inv.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    <button
                      onClick={() => openPDFModal(inv)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      📄 Generate PDF
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesPage;