// src/pages/UploadInvoices.jsx
import React, { useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import generatePDFInvoice from '../components/PDFInvoice';

// Excel template headers (bold in generated .xlsx). Order and labels per latest request.
const columnsHelp = [
  'UniqueInvoiceID',
  'invoiceType',
  'InvoiceDate',
  'SellerBusinessName',
  'SellerProvince',
  'SellerAddress',
  'SellerNTNCNIC',
  'BuyerNTNCNIC',
  'BuyerBusinessName',
  'BuyerProvince',
  'BuyerAddress',
  'invoiceRefNo',
  'BuyerRegistrationType',
  'ScenarioID',
  'HsCode',
  'ProductDescription',
  'Rate',
  'uoM',
  'quantity',
  'totalValues',
  'valueSalesExcludingST',
  'salesTaxApplicable',
  'fixedNotifiedValueOrRetailPrice',
  'salesTaxWithheldAtSource',
  'extraTax',
  'furtherTax',
  'sroScheduleNo',
  'fedPayable',
  'discount',
  'saleType',
  'sroItemSerialNo',
];

function UploadInvoices() {
  const { isSeller, isAdmin, sellerId } = useAuth();

  const [file, setFile] = useState(null);
  // Local rows parsed from Excel (editable)
  const [rows, setRows] = useState([]);
  const [validated, setValidated] = useState([]);
  const preview = validated.length ? validated : rows;
  const [errors, setErrors] = useState([]); // validation errors from backend
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverReport, setServerReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState(null); // optional backend correlation id
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  // Helper: generate a real .xlsx Excel file with BOLD header row using ExcelJS
  const downloadExcelTemplateLocal = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Template');

      // Add header row with bold font
      const headerRow = sheet.addRow(columnsHelp);
      headerRow.font = { bold: true };

      // Set column widths
      sheet.columns = columnsHelp.map(h => ({ width: Math.min(Math.max(h.length + 2, 14), 30) }));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Local Excel template download failed', e);
      // Fallback to CSV if ExcelJS generation fails
      downloadCsvTemplate();
    }
  };

  const isExcel = (f) => !!f && (/\.xlsx$/i.test(f.name) || /\.xls$/i.test(f.name));

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (f && !isExcel(f)) {
      setFile(null);
      setErrors(['Only Excel files (.xlsx, .xls) are allowed']);
      return;
    }
    setFile(f);
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
    // Auto-parse immediately after picking a file
    if (f) setTimeout(() => uploadForPreview(), 0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    if (!isExcel(f)) {
      setErrors(['Only Excel files (.xlsx, .xls) are allowed']);
      return;
    }
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
      // Clear existing banners before starting
      setErrors([]);
      setSuccess(null);
      if (!sellerId) return setErrors(['Missing seller/company id. Please relogin or set up seller configuration.']);

      // 1) Probe availability (do not parse binary as JSON)
      const q = `sellerId=${encodeURIComponent(sellerId)}`;
      const probe = await fetch(`/api/company-import/template/status?${q}`, { credentials: 'include' });
      let statusJson = { available: false };
      try {
        statusJson = await probe.json();
      } catch (_) {
        // ignore JSON parse errors
      }
      if (!probe.ok || !statusJson?.available) {
        // Backend not ready — gracefully fall back to local generator
        await downloadExcelTemplateLocal();
        setErrors([]);
        setSuccess('Backend template unavailable. A local Excel template with bold headers has been downloaded.');
        return;
      }

      // 2) Download binary as Blob
      const res = await fetch(`/api/company-import/template?${q}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Template download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = statusJson?.fileName || 'template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // 4) Clear banners on success (IMPORTANT)
      setErrors([]);
      setSuccess(null);
    } catch (err) {
      console.error('Template download error', err);
      // Try to extract a human-readable error message even if response is a Blob
      const fallback = 'Template download failed.';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          // Attempt to parse JSON error
          try {
            const json = JSON.parse(text);
            setErrors([json.message || fallback]);
          } catch (_) {
            const cleaned = (text || '').replace(/<[^>]*>/g, '').slice(0, 300);
            setErrors([cleaned || fallback]);
          }
        } catch (_) {
          setErrors([fallback]);
        }
      } else {
        const msg = err.response?.data?.message || String(err.message || '')
          .replace(/<[^>]*>/g, '').slice(0, 300);
        setErrors([msg || fallback]);
      }
      // As a last resort, still provide the local template so user is not blocked
      try {
        await downloadExcelTemplateLocal();
        setErrors([]);
        setSuccess('A local Excel template with bold headers has been downloaded.');
      } catch {}
    }
  };

  // Parse Excel locally and hydrate editable rows
  const uploadForPreview = async () => {
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
    setUploadId(null);
    setValidated([]);
    if (!file) return setErrors(['Please choose an Excel file first']);
    try {
      setUploading(true);
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Read with first row as headers
      const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      const out = (json.length ? json : []).map((r, idx) => {
        const obj = {};
        columnsHelp.forEach(h => { obj[h] = r[h] ?? ''; });
        // helpers
        obj.__row = idx + 2; // considering header row is 1
        obj.__errors = [];
        obj.__valid = null; // unknown until validation
        obj.__selected = true; // default selected
        return obj;
      });
      // If sheet had no headers, initialize empty row with headers
      setRows(out);
    } catch (err) {
      console.error('Local parse error', err);
      setErrors(['Failed to parse Excel. Make sure it uses the provided template headers.']);
    } finally {
      setUploading(false);
    }
  };

  const totalInvoices = useMemo(() => preview.filter(r => r.__valid === true && r.__selected).length, [preview]);

  const handleCellEdit = (rowIndex, key, value) => {
    setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, [key]: value } : r));
    setValidated([]); // invalidate validated cache when editing
  };

  const toggleRowFlag = (rowIndex, flag) => {
    if (flag === '__selected') {
      setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, __selected: !r.__selected } : r));
    } else if (flag === '__valid') {
      setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, __valid: !r.__valid } : r));
    }
  };

  const validateRecords = () => {
    const numericKeys = new Set(['quantity','Rate','totalValues','valueSalesExcludingST','fedPayable','discount']);
    const requiredKeys = ['UniqueInvoiceID','invoiceType','InvoiceDate','ProductDescription','quantity','Rate'];
    const v = rows.map(r => {
      const errors = [];
      requiredKeys.forEach(k => { if (!String(r[k] ?? '').trim()) errors.push(`${k} is required`); });
      // basic date check
      if (r.InvoiceDate && isNaN(Date.parse(r.InvoiceDate))) errors.push('InvoiceDate is invalid');
      // numeric checks
      numericKeys.forEach(k => { if (r[k] !== '' && isNaN(Number(r[k]))) errors.push(`${k} must be a number`); });
      return { ...r, __errors: errors, __valid: errors.length === 0 };
    });
    setValidated(v);
    if (v.every(x => x.__errors.length === 0)) {
      setErrors([]);
      setSuccess('All rows validated');
    } else {
      setErrors(['Some rows have validation errors.']);
      setSuccess(null);
    }
  };

  const submitValidated = async () => {
    try {
      setSubmitting(true);
      setErrors([]);
      setSuccess(null);
      if (!sellerId) throw new Error('Missing seller/company id');
      const toSubmit = preview.filter(r => (r.__valid === true) && r.__selected);
      if (!toSubmit.length) throw new Error('No valid rows to submit');
      const companyId = encodeURIComponent(sellerId);
      const res = await api.post(`/api/invoice/submit/${companyId}`, { rows: toSubmit });
      setServerReport(res.data);
      setSuccess('Submitted successfully');
    } catch (e) {
      setErrors([e?.response?.data?.message || e.message || 'Submit failed']);
    } finally {
      setSubmitting(false);
    }
  };

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

      // Attempt to auto-generate and download PDFs for successful invoices
      try {
        const rows = (res?.data?.results || res?.data?.invoices || res?.data?.data || [])
          .map(r => ({ ...r }))
          .filter(r => (r.__valid === true) || (r.status?.toString().toLowerCase() === 'success') || r.irn || r.IRN || r.uuid);

        for (const row of rows) {
          // Build minimal buyer and seller objects from row if available
          const buyer = {
            companyName: row.buyerName || row.buyerCompany,
            address: row.address,
            buyerSTRN: row.buyerSTRN,
            buyerNTN: row.buyerNTN,
            truckNo: row.truckNo,
          };
          const seller = {
            companyName: row.sellerBusinessName,
            sellerProvince: row.sellerProvince,
            address: row.sellerAddress,
            sellerNTN: row.sellerNTNOrCNIC,
            sellerSTRN: row.sellerSTRN,
          };
          await generatePDFInvoice(row, buyer, seller);
        }
      } catch (pdfErr) {
        console.warn('PDF auto-download skipped due to error:', pdfErr);
      }
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
            <button onClick={downloadTemplate} disabled={!sellerId} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">Download Excel Template</button>
          </div>
          <div className="text-xs text-gray-600 mt-2">Seller information will be auto-filled by the system when generating FBR invoices; keep seller columns for reference.</div>
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
            <div className="text-sm text-gray-700">Drop .xlsx/.xls here or</div>
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

      {/* Template columns helper removed per request */}

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
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 inline-block bg-red-100 border border-red-200"></span> Invalid</label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 inline-block bg-green-50 border border-green-200"></span> Valid</label>
            </div>
          </div>
          <div className="overflow-auto max-h-[60vh] border rounded">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  {columnsHelp.map((h) => (
                    <th key={h} className="p-2 text-left border-b whitespace-nowrap">{h}</th>
                  ))}
                  <th className="p-2 text-left border-b">Valid</th>
                  <th className="p-2 text-left border-b">Selected</th>
                  <th className="p-2 text-left border-b">Errors</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className={`${row.__valid === false ? 'bg-red-50' : row.__valid ? 'bg-green-50' : ''}`}>
                    {columnsHelp.map((h) => (
                      <td key={h} className="p-1 border-b align-top">
                        <input
                          className="w-full border rounded px-1 py-0.5 text-xs"
                          value={row[h] ?? ''}
                          onChange={(e) => handleCellEdit(idx, h, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="p-1 border-b">
                      <input type="checkbox" checked={!!row.__valid} onChange={() => toggleRowFlag(idx, '__valid')} />
                    </td>
                    <td className="p-1 border-b">
                      <input type="checkbox" checked={row.__selected !== false} onChange={() => toggleRowFlag(idx, '__selected')} />
                    </td>
                    <td className="p-1 border-b text-[11px] text-red-700">
                      {Array.isArray(row.__errors) && row.__errors.length ? row.__errors.join(', ') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded bg-black text-white disabled:opacity-50">
              {uploading ? 'Parsing...' : 'Upload Excel'}
            </button>
            <button onClick={validateRecords} disabled={!rows.length} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700">Validate Records</button>
            <button onClick={submitValidated} disabled={!preview.length || submitting} className="px-3 py-2 rounded bg-amber-500 text-white disabled:opacity-50">Submit</button>
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
