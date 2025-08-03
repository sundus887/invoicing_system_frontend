import { useEffect, useState } from 'react';
import api from '../services/api';

function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [exportStats, setExportStats] = useState({
    totalInvoices: 0,
    totalClients: 0,
    totalServices: 0,
    fbrSubmissions: 0,
    invoicesWithHSCodes: 0
  });

  // Export options state
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // csv, excel, pdf
    dateRange: 'all', // all, this_month, last_month, custom
    startDate: '',
    endDate: '',
    includeHSCodes: true,
    includeFBRData: true,
    includeClientDetails: true,
    includeSellerDetails: true
  });

  // Fetch export statistics
  const fetchExportStats = async () => {
    try {
      const [invoicesRes, clientsRes, servicesRes, fbrRes] = await Promise.all([
        api.get('/api/invoices'),
        api.get('/api/clients'),
        api.get('/api/services'),
        api.get('/api/fbrinvoices/submissions')
      ]);

      const invoices = invoicesRes.data?.invoices || [];
      const clients = clientsRes.data?.clients || [];
      const services = servicesRes.data?.services || [];
      const fbrSubmissions = fbrRes.data?.submittedInvoices || [];

      // Calculate HS code statistics
      const invoicesWithHSCodes = invoices.filter(invoice => {
        if (invoice.items && invoice.items.length > 0) {
          return invoice.items.some(item => item.hsCode && item.hsCode !== '9983.99.00');
        }
        return invoice.hsCode && invoice.hsCode !== '9983.99.00';
      }).length;

      setExportStats({
        totalInvoices: invoices.length,
        totalClients: clients.length,
        totalServices: services.length,
        fbrSubmissions: fbrSubmissions.length,
        invoicesWithHSCodes: invoicesWithHSCodes
      });
    } catch (err) {
      console.error('❌ Error fetching export stats:', err);
    }
  };

  useEffect(() => {
    fetchExportStats();
  }, []);

  const handleOptionChange = (name, value) => {
    setExportOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = async (type) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log(`🔄 Starting ${type.toUpperCase()} export with options:`, exportOptions);

      // Only CSV export is supported
      if (type !== 'csv') {
        setError(`${type.toUpperCase()} export is not available. Only CSV export is supported.`);
        return;
      }

      // Create CSV data client-side since backend is not available
      const csvData = await generateCSVData();
      const filename = `tax-nexus-export-${new Date().toISOString().split('T')[0]}.csv`;

      // Handle file download
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setSuccess(`${type.toUpperCase()} export completed successfully!`);
      await fetchExportStats(); // Refresh stats
    } catch (err) {
      console.error(`❌ Error during ${type} export:`, err);
      setError(`Failed to export ${type.toUpperCase()}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Generate CSV data client-side
  const generateCSVData = async () => {
    try {
      // Fetch data from available endpoints
      const [invoicesRes, clientsRes, servicesRes, fbrRes] = await Promise.all([
        api.get('/api/invoices').catch(() => ({ data: { invoices: [] } })),
        api.get('/api/clients').catch(() => ({ data: { clients: [] } })),
        api.get('/api/services').catch(() => ({ data: { services: [] } })),
        api.get('/api/fbrinvoices/submissions').catch(() => ({ data: { submittedInvoices: [] } }))
      ]);

      const invoices = invoicesRes.data?.invoices || [];
      const clients = clientsRes.data?.clients || [];
      const services = servicesRes.data?.services || [];
      const fbrSubmissions = fbrRes.data?.submittedInvoices || [];

      // Create CSV headers
      const headers = [
        'Invoice #',
        'Client Name',
        'Client NTN',
        'Client STRN',
        'Product/Service',
        'Quantity',
        'Unit Price',
        'Total Value',
        'Sales Tax',
        'Final Amount',
        'Date',
        'Status',
        'FBR Status',
        'FBR Reference',
        'HS Code'
      ];

      // Create CSV rows
      const csvRows = invoices.map(invoice => {
        const client = clients.find(c => c._id === invoice.buyerId?._id);
        const fbrInvoice = fbrSubmissions.find(f => f.invoiceId === invoice._id);
        
        return [
          invoice.invoiceNumber || invoice.invoiceNo || '',
          client?.companyName || '',
          client?.buyerNTN || '',
          client?.buyerSTRN || '',
          invoice.product || '',
          invoice.units || '',
          invoice.unitPrice || '',
          invoice.totalValue || '',
          invoice.salesTax || '',
          invoice.finalValue || '',
          invoice.date ? new Date(invoice.date).toLocaleDateString() : '',
          invoice.status || 'pending',
          fbrInvoice?.status || 'Not Submitted',
          fbrInvoice?.fbrReference || '',
          invoice.hsCode || ''
        ].map(field => `"${field}"`).join(',');
      });

      // Combine headers and data
      const csvContent = [headers.join(','), ...csvRows].join('\n');
      
      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      return BOM + csvContent;
    } catch (error) {
      console.error('Error generating CSV data:', error);
      throw error;
    }
  };

  const handleBulkExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('🔄 Starting bulk export...');

      // Export CSV only (since other formats are not available)
      await handleExport('csv');

      setSuccess('Bulk export completed successfully!');
    } catch (err) {
      console.error('❌ Error during bulk export:', err);
      setError('Failed to complete bulk export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Export Management</h2>
        <div className="text-sm text-gray-600">
          Export your data in various formats for reporting and compliance
        </div>
      </div>

      {/* Export Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{exportStats.totalInvoices}</div>
          <div className="text-sm text-gray-600">Total Invoices</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{exportStats.totalClients}</div>
          <div className="text-sm text-gray-600">Total Clients</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">{exportStats.totalServices}</div>
          <div className="text-sm text-gray-600">Total Services</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{exportStats.fbrSubmissions}</div>
          <div className="text-sm text-gray-600">FBR Submissions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-teal-600">{exportStats.invoicesWithHSCodes}</div>
          <div className="text-sm text-gray-600">With HS Codes</div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Export Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportOptions.format}
              onChange={(e) => handleOptionChange('format', e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="csv">CSV (Comma Separated Values)</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={exportOptions.dateRange}
              onChange={(e) => handleOptionChange('dateRange', e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {exportOptions.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exportOptions.startDate}
                  onChange={(e) => handleOptionChange('startDate', e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={exportOptions.endDate}
                  onChange={(e) => handleOptionChange('endDate', e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
            </>
          )}
        </div>

        {/* Include Options */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Include in Export
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeHSCodes}
                onChange={(e) => handleOptionChange('includeHSCodes', e.target.checked)}
                className="rounded mr-2"
              />
              <span className="text-sm">HS Codes</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeFBRData}
                onChange={(e) => handleOptionChange('includeFBRData', e.target.checked)}
                className="rounded mr-2"
              />
              <span className="text-sm">FBR Submission Data</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeClientDetails}
                onChange={(e) => handleOptionChange('includeClientDetails', e.target.checked)}
                className="rounded mr-2"
              />
              <span className="text-sm">Client Details</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeSellerDetails}
                onChange={(e) => handleOptionChange('includeSellerDetails', e.target.checked)}
                className="rounded mr-2"
              />
              <span className="text-sm">Seller Details</span>
            </label>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Exporting...
            </>
          ) : (
            <>
              📊 Export CSV
            </>
          )}
        </button>

        <button
          onClick={handleBulkExport}
          disabled={loading}
          className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Exporting...
            </>
          ) : (
            <>
              📦 Bulk Export
            </>
          )}
        </button>
      </div>

      {/* Export History */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Exports</h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📋</div>
          <p>Export history will be displayed here</p>
          <p className="text-sm">Track your recent exports and download them again</p>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Export Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>CSV Export:</strong> Best for data analysis and spreadsheet applications. Compatible with Excel, Google Sheets, and other spreadsheet software.</p>
          <p><strong>HS Codes:</strong> Include Harmonized System codes for customs and tax compliance</p>
          <p><strong>FBR Data:</strong> Include Federal Board of Revenue submission information</p>
          <p><strong>Bulk Export:</strong> Export data in CSV format for comprehensive backup</p>
          <p><strong>Note:</strong> Currently only CSV export is available. Excel and PDF exports will be added in future updates.</p>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;