import React, { useState } from "react";
import api from "../services/api";

export default function InvoiceUploadDirect() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    setError(null);
    setPdfUrl("");
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await api.post("/api/invoice/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob", // backend returns PDF
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setPdfUrl(url);
    } catch (err) {
      try {
        if (err?.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          setError(text);
        } else {
          setError(err?.response?.data?.message || "Upload failed");
        }
      } catch (_) {
        setError("Upload failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload Invoices (Direct PDF)</h2>
      <div className="flex items-center gap-2">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button
          onClick={handleUpload}
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={!file || loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {pdfUrl && (
        <a href={pdfUrl} download="invoice.pdf" className="block mt-4 text-blue-600">
          Download PDF Invoice
        </a>
      )}
    </div>
  );
}
