// src/pages/AddInvoice.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddInvoice = ({ onAdd }) => {
  // Invoice Details Fields - Matching Table Columns
  const [invoiceNo, setInvoiceNo] = useState("");
  const [product, setProduct] = useState("");
  const [units, setUnits] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [salesTax, setSalesTax] = useState("");
  const [extraTax, setExtraTax] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInvoice = {
      id: "INV" + Date.now(),
      // Invoice Details - Matching Table Columns
      invoiceNo,
      product,
      units,
      unitPrice,
      totalValue,
      salesTax,
      extraTax,
      finalValue,
      date,
    };
    if (onAdd) onAdd(newInvoice);
    navigate("/invoices");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Invoice Details Section - Matching Table Columns */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Invoice No"
              className="w-full border p-2 rounded"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Product"
              className="w-full border p-2 rounded"
              value={product}
              onChange={e => setProduct(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Units/Quantity"
              className="w-full border p-2 rounded"
              value={units}
              onChange={e => setUnits(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Unit Price Excluding GST"
              className="w-full border p-2 rounded"
              value={unitPrice}
              onChange={e => setUnitPrice(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Total Value Excluding GST"
              className="w-full border p-2 rounded"
              value={totalValue}
              onChange={e => setTotalValue(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Sales Tax @ 18%"
              className="w-full border p-2 rounded"
              value={salesTax}
              onChange={e => setSalesTax(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Extra Tax"
              className="w-full border p-2 rounded"
              value={extraTax}
              onChange={e => setExtraTax(e.target.value)}
            />
            <input
              type="number"
              placeholder="Value including GST & Extra Tax"
              className="w-full border p-2 rounded"
              value={finalValue}
              onChange={e => setFinalValue(e.target.value)}
              required
            />
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors" type="submit">
          Add Invoice
        </button>
      </form>
    </div>
  );
};

export default AddInvoice;
