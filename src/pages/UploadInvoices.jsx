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

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
  };

  const downloadTemplate = async () => {
    try {
      if (!sellerId) return setErrors(['Missing seller/company id']);
      const res = await api.get(`/api/company/${sellerId}/template`, { responseType: 'blob' });
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
      setErrors([err.response?.data?.message || 'Failed to download template']);
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
      const res = await api.post(`/api/upload/${sellerId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Expecting { preview: [...], errors: [...], uploadId?: string }
      setPreview(res.data.preview || []);
      setErrors(res.data.errors || []);
      if (res.data.uploadId) setUploadId(res.data.uploadId);
    } catch (err) {
      console.error('Upload/preview error', err);
      setErrors([err.response?.data?.message || 'Upload failed']);
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
      const payload = uploadId ? { uploadId } : { preview };
      const res = await api.post(`/api/company/${sellerId}/submit`, payload);
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
      <h2 className="text-2xl font-bold mb-4">Upload Invoices (Excel)</h2>

      <div className="bg-white p-4 rounded shadow mb-4">
        <p className="text-sm text-gray-700 mb-2">Template columns (first row as headers):</p>
        <div className="text-xs bg-gray-50 border rounded p-3 mb-3">
          {columnsHelp.join(' | ')}
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={downloadTemplate} className="px-4 py-2 bg-gray-800 text-white rounded">Download Excel Template</button>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
          <button onClick={uploadForPreview} disabled={!file || uploading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload & Preview'}</button>
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
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Preview ({totalInvoices} valid rows)</h3>
            <button disabled={submitting || errors.length>0 || preview.length===0} onClick={handleSubmitBulk} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit to System / FBR'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
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
