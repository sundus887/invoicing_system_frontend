import React, { useState } from "react";
import api from "../services/api";

export default function SellerForm() {
  const [form, setForm] = useState({
    businessName: "",
    ntn: "",
    irisUser: "",
    irisPass: "",
    clientId: "",
    clientSecret: "",
  });
  const [excelUrl, setExcelUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setExcelUrl("");
    try {
      setDownloading(true);
      const res = await api.post("/api/seller/register", form, {
        responseType: "blob", // backend returns Excel file
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setExcelUrl(url);
    } catch (err) {
      try {
        if (err?.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          setError(text);
        } else {
          setError(err?.response?.data?.message || "Failed to register seller / download template");
        }
      } catch (_) {
        setError("Failed to register seller / download template");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Register Seller</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="businessName" placeholder="Business Name" onChange={handleChange} className="border p-2 w-full"/>
        <input name="ntn" placeholder="NTN" onChange={handleChange} className="border p-2 w-full"/>
        <input name="irisUser" placeholder="IRIS Username" onChange={handleChange} className="border p-2 w-full"/>
        <input name="irisPass" placeholder="IRIS Password" type="password" onChange={handleChange} className="border p-2 w-full"/>
        <input name="clientId" placeholder="Client ID" onChange={handleChange} className="border p-2 w-full"/>
        <input name="clientSecret" placeholder="Client Secret" type="password" onChange={handleChange} className="border p-2 w-full"/>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={downloading}>
          {downloading ? "Generating..." : "Register & Download Excel"}
        </button>
      </form>

      {error && (
        <div className="mt-3 text-sm text-red-600">{error}</div>
      )}

      {excelUrl && (
        <a href={excelUrl} download="seller-template.xlsx" className="block mt-4 text-green-600">
          Download Excel Template
        </a>
      )}
    </div>
  );
}
