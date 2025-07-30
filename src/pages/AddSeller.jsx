// src/pages/AddSeller.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../services/api';

const AddSeller = ({ onAdd }) => {
  // Seller Information Fields
  const [companyName, setCompanyName] = useState("");
  const [sellerNTN, setSellerNTN] = useState("");
  const [sellerSTRN, setSellerSTRN] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  
  // Table state
  const [sellers, setSellers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Fetch sellers from backend
  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the correct endpoint for seller settings
      const response = await api.get('/api/seller-settings');
      console.log('✅ Backend sellers response:', response.data);
      setSellers(response.data);
    } catch (err) {
      console.error('❌ Error fetching sellers:', err);
      setError('Failed to load sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSeller = { 
      companyName,
      sellerNTN,
      sellerSTRN,
      phone,
      address,
      invoiceNumber
    };
    
    // Use the correct endpoint for seller settings
    api.post('/api/seller-settings', newSeller)
      .then(res => {
        console.log('Seller added successfully:', res.data);
        setShowForm(false);
        // Reset form
        setCompanyName("");
        setSellerNTN("");
        setSellerSTRN("");
        setPhone("");
        setAddress("");
        setInvoiceNumber("");
        fetchSellers(); // Refresh the list
      })
      .catch(err => {
        console.error('Error adding seller:', err);
        setError('Failed to add seller. Please try again.');
      });
  };

  if (loading) {
    return <div className="text-center py-8">Loading sellers...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchSellers}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Seller Management</h2>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <span className="text-xl">+</span> Add Seller
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Company Name"
            className="w-full border p-2 rounded"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Seller NTN"
            className="w-full border p-2 rounded"
            value={sellerNTN}
            onChange={e => setSellerNTN(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Seller STRN"
            className="w-full border p-2 rounded"
            value={sellerSTRN}
            onChange={e => setSellerSTRN(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full border p-2 rounded"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Address"
            className="w-full border p-2 rounded md:col-span-2"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Invoice Number"
            className="w-full border p-2 rounded"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">Add Seller</button>
          <button type="button" onClick={() => setShowForm(false)} className="col-span-1 md:col-span-2 text-gray-500 mt-2">Cancel</button>
        </form>
      )}
      
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Company Name</th>
            <th className="py-2 px-4 border">Seller NTN</th>
            <th className="py-2 px-4 border">Seller STRN</th>
            <th className="py-2 px-4 border">Phone</th>
            <th className="py-2 px-4 border">Address</th>
            <th className="py-2 px-4 border">Invoice No</th>
            <th className="py-2 px-4 border">Date</th>
          </tr>
        </thead>
        <tbody>
          {sellers.length === 0 ? (
            <tr>
              <td colSpan="7" className="py-4 px-4 border text-center text-gray-500">
                No sellers found. Add your first seller!
              </td>
            </tr>
          ) : (
            sellers.map((seller, idx) => (
              <tr key={seller._id || idx}>
                <td className="py-2 px-4 border">{seller.companyName}</td>
                <td className="py-2 px-4 border">{seller.sellerNTN}</td>
                <td className="py-2 px-4 border">{seller.sellerSTRN}</td>
                <td className="py-2 px-4 border">{seller.phone}</td>
                <td className="py-2 px-4 border">{seller.address}</td>
                <td className="py-2 px-4 border">{seller.invoiceNumber}</td>
                <td className="py-2 px-4 border">
                  {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AddSeller;