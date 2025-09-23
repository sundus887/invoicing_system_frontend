// src/pages/UploadInvoices.jsx
import React, { useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const columnsHelp = [
  'InvoiceNumber (optional)',
  'BuyerName',
  'BuyerSTRN',
  'BuyerNTN',
  'Address',
  'IssuedDate (yyyy-mm-dd)',
  'ItemDescription',
  'Quantity',
  'UnitPrice',
  'Discount (optional)',
];

function UploadInvoices() {
  const { isSeller, isAdmin, sellerId } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]); // preview rows from backend
  const [errors, setErrors] = useState([]); // validation errors from backend
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverReport, setServerReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState(null); // optional backend correlation id
  const [dragOver, setDragOver] = useState(false);

  // Helper: generate a lightweight CSV template locally (no extra deps)
  const downloadCsvTemplate = () => {
    try {
      const headers = columnsHelp.map(h => '"' + h.replace(/"/g, '""') + '"').join(',');
      const csvContent = "\uFEFF" + headers + "\r\n"; // BOM for Excel compatibility
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV template download failed', e);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    setFile(f);
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const downloadTemplate = async () => {
    try {
      if (!sellerId) return setErrors(['Missing seller/company id. Please relogin or set up seller configuration.']);
      const companyId = encodeURIComponent(sellerId);
      const res = await api.get(`/api/company/${companyId}/template`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download error', err);
      // Try to extract a human-readable error message even if response is a Blob
      const fallback = 'Failed to download template';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          // Attempt to parse JSON error
          try {
            const json = JSON.parse(text);
            setErrors([json.message || fallback]);
          } catch (_) {
            setErrors([text || fallback]);
          }
        } catch (_) {
          setErrors([fallback]);
        }
      } else {
        setErrors([err.response?.data?.message || fallback]);
      }
      // Fallback: provide a client-side CSV template instantly so user is not blocked
      downloadCsvTemplate();
      setSuccess('Backend template not available. A CSV template has been downloaded instead. You can upload CSV or Excel.');
    }
  };

  const uploadForPreview = async () => {
    setErrors([]);
    setPreview([]);
    setSuccess(null);
    setServerReport(null);
    setUploadId(null);
    if (!file) return setErrors(['Please choose an Excel file first']);
    if (!sellerId) return setErrors(['Missing seller/company id']);
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const companyId = encodeURIComponent(sellerId);
      const res = await api.post(`/api/upload/${companyId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Expecting { preview: [...], errors: [...], uploadId?: string }
      setPreview(res.data.preview || []);
      setErrors(res.data.errors || []);
      if (res.data.uploadId) setUploadId(res.data.uploadId);
    } catch (err) {
      console.error('Upload/preview error', err);
      const fallback = 'Upload failed';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          try {
            const json = JSON.parse(text);
            setErrors([json.message || fallback]);
          } catch (_) {
            setErrors([text || fallback]);
          }
        } catch (_) {
          setErrors([fallback]);
        }
      } else {
        setErrors([err.response?.data?.message || fallback]);
      }
    } finally {
      setUploading(false);
    }
  };

  const totalInvoices = useMemo(() => preview.filter(r => r.__valid === true).length, [preview]);

  const handleSubmitBulk = async () => {
    if (!isSeller?.() && !isAdmin?.()) {
      setErrors(['Only seller/admin can upload invoices']);
      return;
    }
    if (errors.length) return;
    if (!preview.length) return setErrors(['Please upload a file and get preview first']);
    if (!sellerId) return setErrors(['Missing seller/company id']);
    setSubmitting(true);
    setSuccess(null);
    setServerReport(null);
    try {
      const companyId = encodeURIComponent(sellerId);
      const payload = uploadId ? { uploadId } : { preview };
      const res = await api.post(`/api/company/${companyId}/submit`, payload);
      setServerReport(res.data);
      setSuccess('Bulk upload completed. See the result report below.');
    } catch (err) {
      console.error('Bulk upload error', err);
      setErrors([err.response?.data?.message || 'Bulk upload failed']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Upload Invoices</h2>
        <p className="text-gray-600">Download the template, fill it, then upload to preview and submit to FBR.</p>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs uppercase text-gray-500">Step 1</div>
          <div className="font-semibold">Download Template</div>
          <p className="text-sm text-gray-600 mt-1">Company-tailored Excel with required columns.</p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button onClick={downloadTemplate} disabled={!sellerId} className="px-4 py-2 bg-gray-900 text-white rounded disabled:opacity-50">Download Excel Template</button>
            <button type="button" onClick={downloadCsvTemplate} className="text-sm text-blue-700 hover:underline">Download CSV Template</button>
          </div>
          {!sellerId && (
            <div className="text-xs text-orange-600 mt-2">Seller/Company ID missing. Please login or configure seller details first.</div>
          )}
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs uppercase text-gray-500">Step 2</div>
          <div className="font-semibold">Upload & Preview</div>
          <p className="text-sm text-gray-600 mt-1">Drag and drop or choose your filled file.</p>
          <div
            className={`mt-3 border-2 border-dashed rounded-lg p-6 text-center transition ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-sm text-gray-700">Drop .xlsx here or</div>
            <label className="inline-block mt-2 px-4 py-2 bg-white border rounded cursor-pointer hover:bg-gray-100">
              Choose File
              <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </label>
            {file && (
              <div className="mt-2 text-xs text-gray-600">Selected: {file.name}</div>
            )}
          </div>
          <button onClick={uploadForPreview} disabled={!file || uploading} className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload & Preview'}
          </button>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-xs uppercase text-gray-500">Step 3</div>
          <div className="font-semibold">Submit to System / FBR</div>
          <p className="text-sm text-gray-600 mt-1">Review the preview, then submit valid rows.</p>
          <ul className="text-xs text-gray-600 mt-2 list-disc ml-4 space-y-1">
            <li>✅ Valid rows are highlighted</li>
            <li>❌ Invalid rows show error messages</li>
            <li>FBR token is handled server-side</li>
          </ul>
        </div>
      </div>

      {/* Columns helper */}
      <div className="bg-white p-4 rounded border mb-4">
        <p className="text-sm text-gray-700 mb-2 font-medium">Template columns (first row must be headers):</p>
        <div className="flex flex-wrap gap-2">
          {columnsHelp.map((c) => (
            <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border">{c}</span>
          ))}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">
          <div className="font-semibold mb-1">Found {errors.length} issues</div>
          <ul className="list-disc ml-5 text-sm space-y-1">
            {errors.map((e, i) => (<li key={i}>{e}</li>))}
          </ul>
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-white rounded border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Preview ({totalInvoices} valid rows)</h3>
            <button disabled={submitting || errors.length>0 || preview.length===0} onClick={handleSubmitBulk} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit to System / FBR'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 sticky top-0">
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Invoice #</th>
                  <th className="p-2 text-left">Buyer</th>
                  <th className="p-2 text-left">Issued Date</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.map((row, idx) => (
                  <tr key={idx} className={row.__valid ? 'bg-white' : 'bg-red-50'}>
                    <td className="p-2">{row.__valid ? '✅' : '❌'}</td>
                    <td className="p-2">{row.invoiceNumber || '-'}</td>
                    <td className="p-2">{row.buyerName || row.buyerCompany}</td>
                    <td className="p-2">{row.issuedDate}</td>
                    <td className="p-2">{Number(row.unitPrice || 0) * Number(row.quantity || 0)}</td>
                    <td className="p-2 text-xs text-gray-600">{row.__message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded p-3 mb-4">{success}</div>
      )}

      {serverReport && (
        <div className="bg-white rounded shadow p-4">
          <h4 className="text-md font-semibold mb-2">Server Report</h4>
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-64">{JSON.stringify(serverReport, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default UploadInvoices;
