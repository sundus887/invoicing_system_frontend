import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ValidateInvoices() {
  const { sellerId } = useAuth();
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setResults([]);
    setError('');
  };

  async function parseExcel(f) {
    const XLSX = await import('xlsx');
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return json;
  }

  const handleValidate = async () => {
    if (!file) return alert('Please upload Excel file first!');
    if (!sellerId) return alert('Missing seller/company id. Please login.');

    setLoading(true);
    setError('');
    try {
      const invoices = await parseExcel(file);

      // Do NOT send secrets from frontend. Backend handles token exchange.
      const res = await api.post(
        '/api/invoices/validate-assign',
        { rows: invoices, sellerId },
        { headers: { 'x-seller-id': sellerId } }
      );

      const data = res.data || {};
      if (data.success === false) {
        setError(data.message || 'Validation failed');
        setResults([]);
        return;
      }
      setResults(data.results || data.rows || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Validate Invoices</h2>

      <div className="flex items-center gap-2">
        <input type="file" onChange={handleFileChange} accept=".xlsx,.xls" />
        <button
          onClick={handleValidate}
          disabled={loading || !file}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Validating...' : 'Validate Records'}
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded p-3">{error}</div>
      )}

      {results.length > 0 && (
        <table className="mt-6 border-collapse border border-gray-300 w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-2 py-1 text-left">Invoice No</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">IRN</th>
              <th className="border px-2 py-1 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i} className={row.valid === false || row.isValid === false ? 'bg-red-50' : 'bg-green-50'}>
                <td className="border px-2 py-1">{row.assignedInvoiceNo || row.InvoiceNumber || row.invoiceNumber || '-'}</td>
                <td className="border px-2 py-1">{row.status || (row.valid === false || row.isValid === false ? 'invalid' : 'valid')}</td>
                <td className="border px-2 py-1">{row.irn || row.IRN || '—'}</td>
                <td className="border px-2 py-1 text-red-600">{Array.isArray(row.errors) ? row.errors.join('; ') : (row.error || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
