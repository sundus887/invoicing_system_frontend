// src/pages/AddClient.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../services/api'; // Import the api instance

const AddClient = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newClient = { name, email, phone };
    
    // Use the api instance instead of fetch
    api.post('/clients', newClient)
      .then(res => {
        console.log('Client added successfully:', res.data);
        // Optionally, you can call onAdd(res.data) if you want to update parent state
        navigate("/clients");
      })
      .catch(err => {
        alert("Failed to add client");
        console.error('Error adding client:', err);
      });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Client</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="w-full border p-2 rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
        <button className="bg-indigo-600 text-white px-4 py-2 rounded" type="submit">
          Add Client
        </button>
      </form>
    </div>
  );
};

export default AddClient;
