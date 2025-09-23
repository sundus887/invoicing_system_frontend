// src/pages/InvoiceHistory.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function InvoiceHistory() {
  const { isSeller, isAdmin, sellerId } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all'); // all|submitted|failed|pending

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!isSeller?.() && !isAdmin?.()) {
        setError('You do not have permission to view invoice history');
        return;
      }
      if (!sellerId) {
        setRows([]);
        return;
      }
      // Prefer company-scoped history if backend provides it
      try {
        const res = await api.get(`/api/company/${sellerId}/history`);
        setRows(res.data.history || res.data || []);
      } catch (err) {
        // fallback to generic invoices listing
        const res = await api.get('/api/invoices');
        const data = Array.isArray(res.data) ? res.data : (res.data.invoices || []);
        setRows(data);
      }
    } catch (err) {
      console.error('History fetch error', err);
      setError(err.response?.data?.message || 'Failed to load invoice history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [sellerId]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter((r) => {
      const fbrSubmitted = !!(r.fbrReference || r.irn || r.uuid || r.qrCode || r.fbrStatus === 'submitted');
      const failed = r.fbrStatus === 'failed' || r.error || r.fbrError;
      const pending = !fbrSubmitted && !failed;
      if (status === 'submitted' && !fbrSubmitted) return false;
      if (status === 'failed' && !failed) return false;
      if (status === 'pending' && !pending) return false;
      if (!s) return true;
      const hay = `${r.invoiceNumber || ''} ${r.buyerId?.companyName || r.buyerName || ''} ${r.fbrStatus || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q, status]);

  const exportCSV = () => {
    const headers = ['Invoice #', 'Buyer', 'Amount', 'Issued Date', 'Status', 'IRN/UUID', 'Message'];
    const lines = [headers.join(',')];
    for (const r of filtered) {
      const statusText = r.fbrStatus || (r.fbrReference || r.irn || r.uuid ? 'submitted' : 'pending');
      const msg = r.fbrMessage || r.error || '';
      const row = [
        r.invoiceNumber || (r._id ? r._id.slice(-6) : ''),
        r.buyerId?.companyName || r.buyerName || '',
        (r.finalValue || r.finalAmount || r.totalAmount || r.totalValue || 0),
        r.issuedDate || '',
        statusText,
        r.irn || r.uuid || r.fbrReference || '',
        msg.replace(/\n|\r|,/g, ' '),
      ];
      lines.push(row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    }
    const blob = new Blob(["\uFEFF" + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-history.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6">Loading history…</div>;
  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">{error}</div>
      <button onClick={fetchHistory} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Invoice History</h2>
        <div className="flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search invoices…" className="border rounded px-3 py-2" />
          <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded px-3 py-2">
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded">Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Invoice #</th>
              <th className="p-2 text-left">Buyer</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Issued</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">IRN/UUID</th>
              <th className="p-2 text-left">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr><td className="p-4 text-center text-gray-500" colSpan={7}>No records</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r._id || i}>
                <td className="p-2">{r.invoiceNumber || (r._id ? r._id.slice(-6) : '')}</td>
                <td className="p-2">{r.buyerId?.companyName || r.buyerName || '-'}</td>
                <td className="p-2">{(r.finalValue || r.finalAmount || r.totalAmount || r.totalValue || 0).toFixed(2)}</td>
                <td className="p-2">{r.issuedDate ? new Date(r.issuedDate).toLocaleDateString() : '-'}</td>
                <td className="p-2">{r.fbrStatus || (r.fbrReference || r.irn || r.uuid ? 'submitted' : 'pending')}</td>
                <td className="p-2">{r.irn || r.uuid || r.fbrReference || '-'}</td>
                <td className="p-2 text-xs text-gray-600">{r.fbrMessage || r.error || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoiceHistory;
