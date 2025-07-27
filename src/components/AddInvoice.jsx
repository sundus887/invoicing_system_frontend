// AddInvoice.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddInvoice({ invoices, setInvoices }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const handleAdd = (e) => {
    e.preventDefault();

    // Add new invoice to list
    const newInvoice = { name, amount: `Rs ${amount}` };
    setInvoices([...invoices, newInvoice]);

    // Clear fields and navigate
    setName("");
    setAmount("");
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Add Invoice</h2>
      <form onSubmit={handleAdd} className="space-y-4">
        <input
          type="text"
          placeholder="Client Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Amount (in Rs)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}
