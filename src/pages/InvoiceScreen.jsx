import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function InvoiceScreen() {
  const { sellerId } = useAuth();
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validatedRows, setValidatedRows] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const rowsToShow = useMemo(() => (validatedRows.length ? validatedRows : parsedRows), [validatedRows, parsedRows]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const isExcel = (f) => !!f && (/\.xlsx$/i.test(f.name) || /\.xls$/i.test(f.name));

  async function uploadExcel() {
    try {
      setError(null);
      if (!sellerId) throw new Error("Missing seller/company id");
      if (!file) throw new Error("Please choose an Excel file first");
      if (!isExcel(file)) throw new Error("Only Excel files (.xlsx, .xls) are allowed");
      setLoading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/api/invoice/preview/${encodeURIComponent(sellerId)}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setParsedRows(res.data?.parsedRows || res.data?.rows || []);
      setValidatedRows([]);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function validateRecords() {
    try {
      setError(null);
      if (!sellerId) throw new Error("Missing seller/company id");
      if (!parsedRows.length) throw new Error("Upload and parse Excel first");
      setLoading(true);
      const res = await api.post(`/api/invoice/validate/${encodeURIComponent(sellerId)}`, { rows: parsedRows });
      setValidatedRows(res.data?.validated || res.data?.rows || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitRecords() {
    try {
      setError(null);
      if (!sellerId) throw new Error("Missing seller/company id");
      const validRows = (validatedRows.length ? validatedRows : parsedRows).filter(r => r.valid !== false);
      if (!validRows.length) throw new Error("No valid rows to submit");
      setLoading(true);
      const res = await api.post(`/api/invoice/submit/${encodeURIComponent(sellerId)}`, { rows: validRows });
      const jid = res.data?.jobId || res.data?.id;
      setJobId(jid);
      if (jid) pollStatus(jid);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus(id) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/invoice/status/${encodeURIComponent(id)}`);
        setJobStatus(res.data);
        if (res.data?.complete) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (_) {}
    }, 2000);
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Bulk Invoices</h2>

      {error && (
        <div className="mb-3 bg-red-50 text-red-700 border border-red-200 rounded p-3">{error}</div>
      )}

      <div className="border rounded mb-3" style={{height: '60vh', overflow: 'auto'}}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-100">
            <tr>
              {rowsToShow[0] ? Object.keys(rowsToShow[0]).filter(k => k !== 'errors' && k !== 'valid').map((h) => (
                <th key={h} className="p-2 text-left border-b">{h}</th>
              )) : null}
              <th className="p-2 text-left border-b">Valid</th>
              <th className="p-2 text-left border-b">Errors</th>
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row, i) => (
              <tr key={row.rowId || i} className={row.valid === false ? 'bg-red-50' : ''}>
                {Object.keys(row).filter(k => k !== 'errors' && k !== 'valid').map((k) => (
                  <td key={k} className="p-2 border-b border-gray-100">{String(row[k] ?? '')}</td>
                ))}
                <td className="p-2 border-b border-gray-100">{row.valid ? '✓' : (row.valid === false ? '✗' : '')}</td>
                <td className="p-2 border-b border-gray-100">{Array.isArray(row.errors) ? row.errors.join(', ') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <input type="file" accept=".xlsx,.xls" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
        <button onClick={uploadExcel} disabled={!file || loading} className="px-3 py-2 rounded bg-black text-white disabled:opacity-50">Upload Excel</button>
        <button onClick={validateRecords} disabled={!parsedRows.length || loading} className="px-3 py-2 rounded border">Validate Records</button>
        <button onClick={submitRecords} disabled={(!validatedRows.length && !parsedRows.length) || loading} className="px-3 py-2 rounded bg-amber-500 text-white disabled:opacity-50">Submit</button>
      </div>

      {jobStatus && (
        <div className="mt-4">
          <h3 className="font-semibold">Job Status</h3>
          <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">{JSON.stringify(jobStatus, null, 2)}</pre>
          <div className="mt-2 flex flex-col gap-1">
            {Array.isArray(jobStatus.results) && jobStatus.results.map((r, idx) => (
              r?.pdfPath ? (
                <a key={r.rowId || idx} href={r.pdfPath} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                  Download PDF {r.irn || r.uuid || r.rowId || (idx+1)}
                </a>
              ) : null
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
