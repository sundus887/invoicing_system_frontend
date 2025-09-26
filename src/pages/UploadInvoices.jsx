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
  'unitPrice',
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
  // Alias states to match requested core flow names
  const [parsedRows, setParsedRows] = useState([]);
  const [validatedRows, setValidatedRows] = useState([]);
  const [allValid, setAllValid] = useState(false);
  const [validated, setValidated] = useState([]);
  const preview = validated.length ? validated : rows;
  const [errors, setErrors] = useState([]); // validation errors from backend
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverReport, setServerReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadId, setUploadId] = useState(null); // optional backend correlation id
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  // Success modal + export state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [canExport, setCanExport] = useState(false);
  const [exportRows, setExportRows] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  // Validation summary banner
  const [validationSummary, setValidationSummary] = useState(null);
  // Submission summary (partial success)
  const [submitSummary, setSubmitSummary] = useState(null);
  // Track whether a validation pass has occurred for current preview
  const isValidated = validated.length > 0;
  // Results returned by submit (pdfUrl, env, irn, success)
  const [submitResults, setSubmitResults] = useState([]);
  // Reveal export (validated) only if backend returned any IRN on validate
  const [showValidatedExport, setShowValidatedExport] = useState(false);
  // Exporting state for spinner
  const [exporting, setExporting] = useState(false);
 
  // --- Download helpers & polling ---
  function downloadBase64Pdf(base64, fileName = 'invoice.pdf') {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.warn('Base64 PDF download failed:', e);
    }
  }

  // Merge result objects (irn/uuid/status/pdf) back into the visible grid rows
  function mergeResultsIntoPreview(results = []) {
    if (!Array.isArray(results) || results.length === 0) return;
    const byKey = new Map();
    results.forEach((r, idx) => {
      const key = r.UniqueInvoiceID || r.invoiceRefNo || r.invoiceNumber || idx;
      byKey.set(String(key), r);
    });
    const applyMerge = (arr) => arr.map((row, idx) => {
      const key = row.UniqueInvoiceID || row.invoiceRefNo || row.invoiceNumber || idx;
      const extra = byKey.get(String(key)) || results[idx] || {};
      const mergedErrors = Array.isArray(row.__errors) && row.__errors.length ? row.__errors : (extra.errors || []);
      return {
        ...row,
        irn: extra.irn || extra.IRN || row.irn,
        uuid: extra.uuid || row.uuid,
        status: extra.status || row.status,
        pdfUrl: extra.pdfUrl || row.pdfUrl,
        pdfBase64: extra.pdfBase64 || row.pdfBase64,
        qrDataUrl: extra.qrDataUrl || (typeof extra.qr === 'string' && extra.qr.startsWith('data:') ? extra.qr : row.qrDataUrl),
        __errors: Array.isArray(mergedErrors) ? mergedErrors : (mergedErrors ? [String(mergedErrors)] : []),
        __valid: (extra.success === false || extra.status === 'invalid') ? false : (row.__valid ?? true),
      };
    });
    if (validated.length) {
      setValidated(prev => applyMerge(prev));
    } else {
      setRows(prev => applyMerge(prev));
    }
  }

  // Export validated/reserved rows (post-validate) as Excel
  const exportReservedExcel = async () => {
    try {
      setExporting(true);
      const res = await api.get(`/api/invoices/export`, { responseType: 'blob' });
      if (!res) throw new Error('No response');

      const contentType = res.headers?.['content-type'] || res.headers?.['Content-Type'];
      const blob = res.data;

      // If server responded with JSON error inside a Blob, surface the real message
      if (contentType && String(contentType).includes('application/json')) {
        try {
          const text = await blob.text();
          const json = JSON.parse(text);
          const msg = json.message || json.error || 'Export failed';
          setErrors([msg]);
          return;
        } catch (_) {
          setErrors(['Export failed']);
          return;
        }
      }

      // Otherwise treat as binary Excel
      const fileName = extractFileNameFromHeaders(res.headers, 'fbr-invoices.xlsx');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'fbr-invoices.xlsx';
      document.body.appendChild(a);
      // Toast: export started
      setSuccess('Export started');
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Export failed';
      setErrors([msg]);
    } finally {
      setExporting(false);
    }
  };

  // Submit validated rows (only valid ones) using assigned invoice numbers or existing numbers
  const submitInvoices = async () => {
    try {
      setSubmitting(true);
      setErrors([]);
      setSuccess(null);
      const source = validated.length ? validated : rows;
      const validRows = source.filter(r => r.__valid === true && r.__selected !== false);
      if (!validRows.length) throw new Error('No valid rows to submit');
      const invoiceNos = validRows.map(r => r.assignedInvoiceNo || r.invoiceNo || r.invoiceNumber || r.invoiceRefNo).filter(Boolean);
      if (!invoiceNos.length) throw new Error('Validated rows have no invoice numbers');
      const res = await api.post('/api/invoices/submit', { invoiceNos });
      const ok = res?.data?.success !== false;
      if (ok) {
        setSuccess(res?.data?.message || 'Invoices submitted successfully');
      } else {
        setErrors([res?.data?.message || 'Submit failed']);
      }
    } catch (e) {
      setErrors([e?.response?.data?.message || e?.message || 'Submit failed']);
    } finally {
      setSubmitting(false);
    }
  };

  // Simple handler alias to match requested API for export
  const handleExport = async () => {
    await exportSubmittedToExcel();
  };

  function downloadRowPdf(row) {
    const fileName = row.pdfFileName || `invoice_${row.irn || row.IRN || row.uuid || Date.now()}.pdf`;
    if (row.pdfBase64) return downloadBase64Pdf(row.pdfBase64, fileName);
    if (row.pdfUrl) return downloadBlobFromUrl(row.pdfUrl, fileName);
  }

  // Export validated (pre-submit) rows to Excel
  const exportValidatedToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const rowsToExport = (validated.length ? validated : rows).filter(r => r.__valid === true && (r.__selected !== false));
      if (!rowsToExport.length) return;
      const data = rowsToExport.map((r) => {
        const o = {};
        columnsHelp.forEach(h => { o[h] = r[h] ?? ''; });
        // Include helpful flags
        o.valid = r.__valid ? 'yes' : 'no';
        o.errors = Array.isArray(r.__errors) ? r.__errors.join('; ') : (r.__errors || '');
        return o;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Validated');
      const fileName = `Validated_FBR_Invoices_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error('Export validated Excel failed', e);
      setErrors(['Export validated Excel failed.']);
    }
  };

  function extractFileNameFromHeaders(headers, fallback = 'invoice.pdf') {
    const dispo = headers?.["content-disposition"] || headers?.["Content-Disposition"] || headers?.get?.('Content-Disposition') || headers?.get?.('content-disposition');
    if (!dispo) return fallback;
    const match = String(dispo).match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
    return match ? decodeURIComponent(match[1].replace(/"/g, '')) : fallback;
  }

  async function downloadBlobFromUrl(url, suggestedName = 'invoice.pdf') {
    try {
      // Use axios instance to preserve Authorization header
      const res = await api.get(url, { responseType: 'blob' });
      const blob = res.data;
      const fileName = extractFileNameFromHeaders(res.headers, suggestedName);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.warn('Blob PDF download failed:', e);
    }
  }

  async function pollInvoiceJob(jobId, { maxWaitMs = 120000, onStatus } = {}) {
    const start = Date.now();
    let delay = 1500;
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, delay));
      try {
        const statusRes = await api.get(`/api/invoice/status/${encodeURIComponent(jobId)}`);
        const status = statusRes.data || {};
        if (onStatus) try { onStatus(status); } catch {}
        if (status.status === 'completed' || status.completed === true) {
          return status.results || status.data || [];
        }
      } catch (e) {
        // keep polling on transient errors
      }
      delay = Math.min(Math.ceil(delay * 1.25), 5000);
    }
    throw new Error('Polling timed out before job completed');
  }

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
    if (f) setTimeout(() => uploadForPreview({ showMissingFileError: false, fileOverride: f }), 0);
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
    // Auto-parse immediately after dropping a file
    setTimeout(() => uploadForPreview({ showMissingFileError: false, fileOverride: f }), 0);
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
  // opts: { showMissingFileError?: boolean, fileOverride?: File }
  const uploadForPreview = async (opts = {}) => {
    const { showMissingFileError = true, fileOverride = null } = opts;
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
    setUploadId(null);
    setValidated([]);
    setValidationSummary(null);
    const f = fileOverride || file;
    if (!f) {
      if (showMissingFileError) setErrors(['Please choose an Excel file first']);
      return;
    }
    try {
      setUploading(true);
      const XLSX = await import('xlsx');
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Read with first row as headers
      const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      const out = (json.length ? json : []).map((r, idx) => {
        const obj = {};
        columnsHelp.forEach(h => { obj[h] = r[h] ?? ''; });
        // Map between Rate and unitPrice to ensure backend gets unitPrice
        if ((obj.unitPrice === '' || obj.unitPrice === undefined || obj.unitPrice === null) && obj.Rate !== '') {
          obj.unitPrice = obj.Rate;
        }
        if ((obj.Rate === '' || obj.Rate === undefined || obj.Rate === null) && obj.unitPrice !== '') {
          obj.Rate = obj.unitPrice;
        }
        // helpers
        obj.__row = idx + 2; // considering header row is 1
        obj.__errors = [];
        obj.__valid = null; // leave blank; will be set after clicking Validate Records
        obj.__selected = true; // default selected
        return obj;
      });
      // If sheet had no headers, initialize empty row with headers
      setRows(out);
      setParsedRows(out);
      setValidatedRows([]);
      setAllValid(false);
    } catch (err) {
      console.error('Local parse error', err);
      setErrors(['Failed to parse Excel. Make sure it uses the provided template headers.']);
    } finally {
      setUploading(false);
    }
  };

  const totalInvoices = useMemo(() => preview.filter(r => r.__valid === true && r.__selected).length, [preview]);

  const handleCellEdit = (rowIndex, key, value) => {
    if (validated.length) {
      setValidated(prev => prev.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r)));
    } else {
      setRows(prev => prev.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r)));
    }
  };

  const toggleRowFlag = (rowIndex, flag) => {
    const toggleFn = (arrSetter) => arrSetter(prev => prev.map((r, i) => (
      i === rowIndex ? { ...r, [flag]: !r[flag] } : r
    )));
    if (validated.length) {
      toggleFn(setValidated);
    } else {
      toggleFn(setRows);
    }
  };

  // Clear preview/grid so user can upload a new sheet easily
  const clearPreview = () => {
    setRows([]);
    setValidated([]);
    setErrors([]);
    setSuccess(null);
    setServerReport(null);
    setValidationSummary(null);
    setFile(null);
  };

  // --- Client-side validation helper (pre-checks before server) ---
  function localValidateRow(row) {
    const errs = [];
    // Map common names from your example to our sheet columns if present
    const invoiceNo = row.invoiceNo ?? row.UniqueInvoiceID ?? row.invoiceRefNo;
    const saleType = row.saleType ?? row.saleType;
    const fedPayable = row.fedPayable ?? row.fedPayable;
    // Basic rules (extend as needed)
    if (!invoiceNo) errs.push('Invoice number missing');
    if (!saleType) errs.push('Sale type required');
    if (fedPayable !== undefined && fedPayable !== '' && isNaN(Number(fedPayable))) errs.push('FED payable must be number');

    // Stronger FBR-like rules (optional columns)
    const invoiceDate = row.invoiceDate ?? row.InvoiceDate;
    const customerName = row.customerName ?? row.BuyerBusinessName;
    const customerNTN = row.customerNTN ?? row.BuyerNTNCNIC;
    const customerCNIC = row.customerCNIC ?? null;
    if (!invoiceDate) errs.push('Invoice date missing');
    if (!customerName) errs.push('Customer name required');
    if (!customerNTN && !customerCNIC) errs.push('Either NTN or CNIC required');

    const quantity = row.quantity;
    const unitPrice = row.unitPrice ?? row.Rate;
    const salesValue = row.salesValue ?? row.valueSalesExcludingST;
    const taxRate = row.taxRate ?? null;
    const taxAmount = row.taxAmount ?? null;
    const totalValue = row.totalValue ?? row.totalValues;
    const totalTax = row.totalTax ?? null;
    const grossTotal = row.grossTotal ?? null;

    const mustNumber = [
      ['Quantity', quantity],
      ['Unit price', unitPrice],
      ['Sales value', salesValue],
      ['Tax rate', taxRate],
      ['Tax amount', taxAmount],
      ['Total value', totalValue],
      ['Total tax', totalTax],
      ['Gross total', grossTotal],
    ];
    mustNumber.forEach(([label, v]) => {
      if (v !== null && v !== undefined && v !== '' && isNaN(Number(v))) {
        errs.push(`${label} must be number`);
      }
    });

    return errs;
  }

  // Validate on server (do NOT wipe the original rows; populate `validated` for preview)
  const validateRecords = async () => {
    try {
      setValidating(true);
      setErrors([]);
      setSuccess(null);
      setValidationSummary(null);
      if (!rows.length) throw new Error('Upload Excel first');
      // 0) Local pre-checks to drive UX immediately
      const preChecked = rows.map((r) => {
        const localErrs = localValidateRow(r);
        return { ...r, __errors: localErrs, __valid: localErrs.length === 0, __selected: r.__selected ?? true };
      });
      setValidated(preChecked);
      setValidatedRows(preChecked);
      
      // Call the new validate-assign route (returns per-row isValid/errors/assignedInvoiceNo and possibly IRN/QR/PDF)
      let data = null;
      try {
        if (!sellerId) throw new Error('Missing seller/company id');
        const companyId = encodeURIComponent(sellerId);
        const res = await api.post(`/api/invoices/validate-assign/${companyId}`, { rows });
        data = res.data || {};
      } catch (err1) {
        // Fallback chain: legacy simple validate, then company-scoped
        try {
          const resSimple = await api.post('/api/validate', { rows });
          data = resSimple.data || {};
        } catch (err2) {
          if (!sellerId) throw err2;
          const companyId = encodeURIComponent(sellerId);
          const res2 = await api.post(`/api/invoice/validate/${companyId}`, { rows });
          data = res2.data || {};
        }
      }

      // Backend may return { results, summary }
      const validatedRowsRaw = data.results || data.rows || data.validatedRows || data.data || [];

      // Normalize to objects with our known columns and helper flags (server view)
      const normalized = Array.isArray(validatedRowsRaw) ? validatedRowsRaw.map((r, idx) => {
        const rowObj = (r && typeof r === 'object' && !Array.isArray(r)) ? { ...r } : {};
        columnsHelp.forEach(h => { if (rowObj[h] === undefined) rowObj[h] = ''; });
        rowObj.__row = rowObj.__row ?? (idx + 2);
        const errs = rowObj.__errors ?? rowObj.errors ?? rowObj.messages ?? [];
        rowObj.__errors = Array.isArray(errs) ? errs : (errs ? [String(errs)] : []);
        // Respect API fields isValid/valid
        const explicitValid = rowObj.__valid ?? rowObj.isValid ?? rowObj.valid ?? rowObj.success;
        const explicitInvalid = rowObj.invalid === true || rowObj.status === 'invalid' || (Array.isArray(rowObj.__errors) && rowObj.__errors.length > 0);
        rowObj.__valid = explicitValid !== undefined ? Boolean(explicitValid) : !explicitInvalid;
        rowObj.__selected = rowObj.__selected ?? true;
        // Assigned invoice number
        if (rowObj.assignedInvoiceNo) {
          rowObj.assignedInvoiceNo = String(rowObj.assignedInvoiceNo);
        }
        // Carry through IRN/QR/PDF fields from backend if present
        if (rowObj.irn || rowObj.IRN) {
          rowObj.irn = rowObj.irn || rowObj.IRN;
        }
        if (rowObj.qr && typeof rowObj.qr === 'string' && rowObj.qr.startsWith('data:')) {
          rowObj.qrDataUrl = rowObj.qr;
        }
        return rowObj;
      }) : [];

      // Merge server over local; iterate preChecked so rows are never dropped
      const mergedWithLocal = preChecked.map((local, i) => {
        // Merge by rowId if present, otherwise by index
        let srv = {};
        if (Array.isArray(normalized) && normalized.length) {
          const s = normalized[i] || {};
          srv = s;
        }
        const errs = [];
        if (Array.isArray(local.__errors)) errs.push(...local.__errors);
        if (Array.isArray(srv.__errors)) errs.push(...srv.__errors);
        const isValid = (local.__valid !== false) && (srv.__valid !== false) && errs.length === 0;
        // Merge core identifiers and artifacts
        const irn = srv.irn || srv.IRN || local.irn;
        const uuid = srv.uuid || local.uuid;
        const pdfUrl = srv.pdfUrl || local.pdfUrl;
        const pdfBase64 = srv.pdfBase64 || local.pdfBase64;
        const qrDataUrl = srv.qrDataUrl || (typeof srv.qr === 'string' && srv.qr.startsWith('data:') ? srv.qr : local.qrDataUrl);
        const assignedInvoiceNo = srv.assignedInvoiceNo || local.assignedInvoiceNo || '';
        return { ...local, ...srv, assignedInvoiceNo, irn, uuid, pdfUrl, pdfBase64, qrDataUrl, __errors: errs, __valid: isValid };
      });

      // Persist merged validation (avoids flicker if server returned no rows)
      setValidated(mergedWithLocal);
      setValidatedRows(mergedWithLocal);

      // Compute and show summary counts
      const total = Number(data?.summary?.total ?? (mergedWithLocal || []).length);
      const validCount = Number(data?.summary?.valid ?? (mergedWithLocal || []).filter(x => x.__valid === true && x.__selected !== false).length);
      const invalidCount = total - validCount;
      setValidationSummary({ total, valid: validCount, invalid: invalidCount });
      // Reveal export when there are validated rows
      setShowValidatedExport(validCount > 0);
      setAllValid(total > 0 && validCount === total);

      if (mergedWithLocal.length && mergedWithLocal.every(x => x.__valid === true)) {
        setSuccess('All rows validated by server');
      } else if (mergedWithLocal.some(x => x.__valid === false)) {
        setErrors([`Some rows have validation errors (server). ${validCount}/${total} valid, ${invalidCount} invalid.`]);
      }
    } catch (e) {
      setErrors([e?.response?.data?.message || e?.message || 'Validation failed']);
    } finally {
      setValidating(false);
    }
  };

  // Submit only valid + selected rows; then poll for results and download PDFs
  const submitValidated = async () => {
    try {
      setSubmitting(true);
      setErrors([]);
      setSuccess(null);
      // Hide validation summary once we move to submission
      setValidationSummary(null);
      if (!sellerId) throw new Error('Missing seller/company id');
      const toSubmit = (validated.length ? validated : rows).filter(r => (r.__valid === true) && r.__selected);
      if (!toSubmit.length) throw new Error('No valid rows to submit');
      const companyId = encodeURIComponent(sellerId);

      // 1) Submit to start background job
      const submitRes = await api.post(`/api/invoice/submit/${companyId}`, { rows: toSubmit });
      const returnedJobId = submitRes.data?.jobId || submitRes.data?.id || submitRes.data?.job?.id;
      if (!returnedJobId) {
        // Some backends may return results immediately
        const immediateResults = submitRes.data?.results || submitRes.data?.data || [];
        setServerReport(submitRes.data);
        // Attempt downloads if results already present
        for (const r of immediateResults) {
          const fileName = r.pdfFileName || `invoice_${r.irn || r.IRN || r.uuid || Date.now()}.pdf`;
          if (r.pdfBase64) {
            downloadBase64Pdf(r.pdfBase64, fileName);
          } else if (r.pdfUrl) {
            await downloadBlobFromUrl(r.pdfUrl, fileName);
          }
        }
        // Determine success and set export state
        const allOk = immediateResults.length > 0 && immediateResults.every(r => (r.success !== false) || r.irn || r.IRN || r.uuid || (String(r.status||'').toLowerCase()==='success'));
        const merged = toSubmit.map((row, idx) => ({ ...row, ...(immediateResults[idx] || {}) }));
        setExportRows(merged);
        setCanExport(allOk);
        setJobId(submitRes.data?.jobId || null);
        setSubmitResults(immediateResults || []);
        setJobStatus({ complete: true, results: immediateResults });
        if (allOk) {
          setSuccess('All invoices submitted successfully.');
          setSuccessMessage('All rows validated and submitted successfully.');
          setShowSuccessModal(true);
        } else {
          const successCount = immediateResults.filter(r => (r.success !== false) || r.irn || r.IRN || r.uuid || (String(r.status||'').toLowerCase()==='success')).length;
          setSubmitSummary({ successCount, total: immediateResults.length });
          setSuccess(`Submitted with errors: ${successCount}/${immediateResults.length} succeeded.`);
        }
        // Merge identifiers and pdf info into preview rows
        mergeResultsIntoPreview(immediateResults);
        return;
      }

      // 2) Poll for completion
      setJobId(returnedJobId);
      setJobStatus({ complete: false, progress: 0 });
      const results = await pollInvoiceJob(returnedJobId, {
        maxWaitMs: 2 * 60 * 1000,
        onStatus: (s) => {
          // Accept either numeric progress or derived info
          const progress = typeof s.progress === 'number' ? s.progress : undefined;
          setJobStatus({ complete: !!(s.completed || s.complete || s.status==='completed'), progress, ...s });
        }
      });

      // 3) Download PDFs for successful rows
      let downloaded = 0;
      for (const r of (results || [])) {
        if (r.success !== false && (r.pdfBase64 || r.pdfUrl)) {
          const fileName = r.pdfFileName || `invoice_${r.irn || r.IRN || r.uuid || Date.now()}.pdf`;
          if (r.pdfBase64) {
            downloadBase64Pdf(r.pdfBase64, fileName);
            downloaded++;
          } else if (r.pdfUrl) {
            await downloadBlobFromUrl(r.pdfUrl, fileName);
            downloaded++;
          }
        }
      }

      setServerReport({ jobId: returnedJobId, results });
      // Prepare export data and success modal
      const allOk = (results || []).length > 0 && (results || []).every(r => (r.success !== false) || r.irn || r.IRN || r.uuid || (String(r.status||'').toLowerCase()==='success'));
      const merged = toSubmit.map((row, idx) => ({ ...row, ...((results || [])[idx] || {}) }));
      setExportRows(merged);
      setCanExport(allOk);
      setSubmitResults(results || []);
      // Merge identifiers and pdf info into preview rows for display
      mergeResultsIntoPreview(results);
      setJobStatus({ complete: true, results });
      if (allOk) {
        setSuccess('All invoices submitted successfully.');
        setSuccessMessage('All rows validated and submitted successfully.');
        setShowSuccessModal(true);
      } else {
        const successCount = (results || []).filter(r => (r.success !== false) || r.irn || r.IRN || r.uuid || (String(r.status||'').toLowerCase()==='success')).length;
        setSubmitSummary({ successCount, total: (results || []).length });
        setSuccess(`Submitted with errors: ${successCount}/${(results || []).length} succeeded.`);
      }
    } catch (e) {
      setErrors([e?.response?.data?.message || e.message || 'Submit failed']);
    } finally {
      setSubmitting(false);
      // Ensure summary stays hidden after submit completes
      setValidationSummary(null);
    }
  };

  // Export Submitted rows to Excel
  const exportSubmittedToExcel = async () => {
    // Try server-side export first when jobId is available
    if (jobId) {
      try {
        const res = await api.get(`/api/invoice/export/${encodeURIComponent(jobId)}`, { responseType: 'blob' });
        if (res?.status === 200 && res.data) {
          const blob = res.data;
          const fileName = extractFileNameFromHeaders(res.headers, `FBRInvoicesExport_${new Date().toISOString().slice(0,10)}.xlsx`);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return;
        }
      } catch (e) {
        // fall back to client-side build
        console.warn('Server export failed, falling back to client XLSX:', e);
      }
    }

    // Fallback: client-side XLSX build
    try {
      const XLSX = await import('xlsx');
      const rowsToExport = exportRows && exportRows.length ? exportRows : (validated.length ? validated : rows);
      if (!rowsToExport.length) return;
      // Ensure every row has template columns
      const data = rowsToExport.map((r) => {
        const o = {};
        columnsHelp.forEach(h => { o[h] = r[h] ?? ''; });
        // Include common submission result fields if present
        o.irn = r.irn || r.IRN || '';
        o.uuid = r.uuid || '';
        o.status = r.status || (r.success === false ? 'failed' : (r.success ? 'success' : ''));
        o.message = Array.isArray(r.__errors) && r.__errors.length ? r.__errors.join('; ') : (r.message || '');
        return o;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Submitted');
      const fileName = `FBRInvoicesExport_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      console.error('Export Excel failed', e);
      setErrors(['Export failed.']);
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
              <button
                type="button"
                onClick={clearPreview}
                className="ml-2 text-gray-500 hover:text-gray-800 border rounded px-2 py-1 text-sm"
                aria-label="Close preview"
                title="Close preview"
              >
                ×
              </button>
            </div>
          </div>
          <div className="overflow-auto max-h-[60vh] border rounded">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  {columnsHelp.map((h) => (
                    <th key={h} className="p-2 text-left border-b whitespace-nowrap">{h}</th>
                  ))}
                  <th className="p-2 text-left border-b">Invoice No</th>
                  <th className="p-2 text-left border-b">IRN/UUID</th>
                  <th className="p-2 text-left border-b">QR</th>
                  <th className="p-2 text-left border-b">PDF</th>
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
                    <td className="p-1 border-b text-[11px]">
                      {row.assignedInvoiceNo ? row.assignedInvoiceNo : (row.invoiceNo || row.invoiceNumber || row.invoiceRefNo ? (row.invoiceNo || row.invoiceNumber || row.invoiceRefNo) : '(will be assigned)')}
                    </td>
                    <td className="p-1 border-b text-[11px]">
                      {row.irn || row.IRN || row.uuid || ''}
                    </td>
                    <td className="p-1 border-b">
                      {row.qrDataUrl || (typeof row.qr === 'string' && row.qr.startsWith('data:')) ? (
                        <a href={row.qrDataUrl || row.qr} target="_blank" rel="noreferrer" title="Open QR">
                          <img src={row.qrDataUrl || row.qr} alt="QR" className="w-8 h-8 object-contain border rounded" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-1 border-b">
                      {(row.pdfBase64 || row.pdfUrl) ? (
                        <button
                          type="button"
                          onClick={() => downloadRowPdf(row)}
                          className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          PDF
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-1 border-b text-center">
                      {row.__valid === true ? '✅' : row.__valid === false ? '❌' : '-'}
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
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            {!isValidated && (
              <button onClick={validateRecords} disabled={!rows.length || validating} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700">
                {validating ? 'Validating...' : 'Validate Records'}
              </button>
            )}
            {isValidated && showValidatedExport && (
              <>
                <button onClick={exportReservedExcel} disabled={!validationSummary?.valid || exporting} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700">
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
              </>
            )}
            {isValidated && (
              <button onClick={submitInvoices} disabled={!validationSummary?.valid || submitting} className="px-3 py-2 rounded bg-amber-500 text-white disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
            {canExport && (
              <button
                onClick={exportSubmittedToExcel}
                className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Export Excel
              </button>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded p-3 mb-4">{success}</div>
      )}

      {validationSummary && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded p-3 mb-4">
          <div className="font-semibold">Validation Summary</div>
          <div className="text-sm mt-1">
            Total: <strong>{validationSummary.total}</strong> · Valid: <strong>{validationSummary.valid}</strong> · Invalid: <strong>{validationSummary.invalid}</strong>
          </div>
        </div>
      )}

      {submitSummary && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 mb-4">
          <div className="font-semibold">Submission Summary</div>
          <div className="text-sm mt-1">
            Succeeded: <strong>{submitSummary.successCount}</strong> / <strong>{submitSummary.total}</strong>
          </div>
        </div>
      )}

      {serverReport && (
        <div className="bg-white rounded shadow p-4">
          <h4 className="text-md font-semibold mb-2">Server Report</h4>
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-64">{JSON.stringify(serverReport, null, 2)}</pre>
        </div>
      )}

      {/* Submit Results: PDF links, env badge, IRN */}
      {submitResults && submitResults.length > 0 && (
        <div className="bg-white rounded shadow p-4 mt-4">
          <h4 className="text-md font-semibold mb-2">Submitted Invoices</h4>
          <div className="space-y-2 text-sm">
            {submitResults.map((r, i) => (
              <div key={r.rowId || r.UniqueInvoiceID || r.invoiceRefNo || i} className="flex flex-wrap items-center gap-3 border-b py-2">
                {r.success !== false ? (
                  <>
                    {r.pdfUrl ? (
                      <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download PDF</a>
                    ) : r.pdfBase64 ? (
                      <button onClick={() => downloadBase64Pdf(r.pdfBase64, `invoice_${r.irn || r.IRN || r.uuid || Date.now()}.pdf`)} className="text-blue-600 hover:underline">Download PDF</button>
                    ) : (
                      <span className="text-gray-500">PDF not available</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${String(r.env||'').toLowerCase()==='sandbox' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                      {String(r.env||'').toLowerCase()==='sandbox' ? 'SANDBOX' : 'PROD'}
                    </span>
                    <div className="text-gray-700">IRN: <span className="font-mono">{r.irn || r.IRN || '-'}</span></div>
                  </>
                ) : (
                  <div className="text-red-700">Failed: {r.error || r.message || 'Unknown error'}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-2xl">ℹ</div>
              <div>
                <h5 className="font-semibold mb-1">Success</h5>
                <p className="text-sm text-gray-700">{successMessage || 'All rows validated and submitted successfully.'}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              {canExport && (
                <button onClick={exportSubmittedToExcel} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                  Export Excel
                </button>
              )}
              <button onClick={() => setShowSuccessModal(false)} className="px-3 py-2 rounded border">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadInvoices;
