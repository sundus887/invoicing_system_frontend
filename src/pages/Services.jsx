// src/pages/Services.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    price: "",
    duration: "",
    status: "",
  });

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('🔄 Fetching services...');
      const response = await api.get('/api/services');
      console.log('✅ Services loaded:', response.data);
      setServices(response.data);
      setError(null); // Ensure error is cleared on success
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setError('Failed to load services from backend. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []); // Empty dependency array - only run once

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      setError(null); // Clear error before adding
      console.log('🔄 Adding service...');
      await api.post('/api/services', form);
      console.log('✅ Service added successfully');
      setShowForm(false);
      setForm({
        name: "",
        type: "",
        description: "",
        price: "",
        duration: "",
        status: "",
      });
      await fetchServices(); // Refresh the list
    } catch (err) {
      console.error('❌ Error adding service:', err);
      setError('Failed to add service. Please try again.');
    }
  };

  // Don't show loading if we have data
  if (loading && services.length === 0) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  // Only show error if we have no data
  if (error && services.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchServices}
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
        <h2 className="text-2xl font-bold">Services</h2>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <span className="text-xl">+</span> Add Service
        </button>
      </div>
      
      {/* Show error message at top if there's an error but we have data */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={fetchServices}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAddService}
          className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
          <input name="type" value={form.type} onChange={handleChange} placeholder="Type" className="border p-2 rounded" required />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border p-2 rounded" />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Price" className="border p-2 rounded" />
          <input name="duration" value={form.duration} onChange={handleChange} placeholder="Duration" className="border p-2 rounded" />
          <input name="status" value={form.status} onChange={handleChange} placeholder="Status" className="border p-2 rounded" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">Add Service</button>
          <button type="button" onClick={() => setShowForm(false)} className="col-span-1 md:col-span-2 text-gray-500 mt-2">Cancel</button>
        </form>
      )}
      
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Name</th>
            <th className="py-2 px-4 border">Type</th>
            <th className="py-2 px-4 border">Description</th>
            <th className="py-2 px-4 border">Price</th>
            <th className="py-2 px-4 border">Duration</th>
            <th className="py-2 px-4 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {services.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-4 px-4 border text-center text-gray-500">
                No services found. Add your first service!
              </td>
            </tr>
          ) : (
            services.map((service, idx) => (
              <tr key={idx}>
                <td className="py-2 px-4 border">{service.name}</td>
                <td className="py-2 px-4 border">{service.type}</td>
                <td className="py-2 px-4 border">{service.description}</td>
                <td className="py-2 px-4 border">{service.price}</td>
                <td className="py-2 px-4 border">{service.duration}</td>
                <td className="py-2 px-4 border">{service.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ServicesPage;