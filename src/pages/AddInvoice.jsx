// src/pages/AddInvoice.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddInvoice = ({ onAdd }) => {
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInvoice = {
      id: "INV" + Date.now(),
      client,
      amount,
      date,
    };
    if (onAdd) onAdd(newInvoice);
    navigate("/invoices");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Invoice</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Client"
          className="w-full border p-2 rounded"
          value={client}
          onChange={e => setClient(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Amount"
          className="w-full border p-2 rounded"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
        <input
          type="date"
          className="w-full border p-2 rounded"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded" type="submit">
          Add Invoice
        </button>
      </form>
    </div>
  );
};

export default AddInvoice;
