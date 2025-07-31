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
    status: "active",
    hsCode: "", // Auto-assigned HS code for service-related products
    category: "", // Service category
    isProduct: false, // Whether this service involves physical products
  });

  // HS Code lookup state
  const [hsCodeSuggestions, setHsCodeSuggestions] = useState([]);
  const [showHsCodeSuggestions, setShowHsCodeSuggestions] = useState(false);

  // Service categories for better organization
  const serviceCategories = [
    "Tax Consultancy",
    "Accounting Services",
    "Audit Services",
    "Business Registration",
    "FBR Services",
    "Legal Services",
    "Financial Advisory",
    "Import/Export Services",
    "Manufacturing Services",
    "Trading Services",
    "Other"
  ];

  // Service types for better classification
  const serviceTypes = [
    "Consultation",
    "Documentation",
    "Filing",
    "Registration",
    "Audit",
    "Compliance",
    "Advisory",
    "Processing",
    "Training",
    "Other"
  ];

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

  // HS Code lookup function
  const lookupHSCode = async (description) => {
    if (!description || description.length < 2) {
      setHsCodeSuggestions([]);
      setShowHsCodeSuggestions(false);
      return;
    }
    
    try {
      const response = await api.get(`/api/hscodes/lookup?description=${encodeURIComponent(description)}`);
      if (response.data.success) {
        setHsCodeSuggestions(response.data.suggestions || []);
        setShowHsCodeSuggestions(true);
      }
    } catch (err) {
      console.error('❌ Error looking up HS code:', err);
      setHsCodeSuggestions([]);
    }
  };

  // Select HS code suggestion
  const selectHsCode = (hsCode) => {
    setForm(prev => ({ ...prev, hsCode }));
    setShowHsCodeSuggestions(false);
    setHsCodeSuggestions([]);
  };

  useEffect(() => {
    fetchServices();
  }, []); // Empty dependency array - only run once

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // HS Code lookup when description changes
    if (name === 'description' && form.isProduct) {
      lookupHSCode(value);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      setError(null); // Clear error before adding
      console.log('🔄 Adding service with data:', form);
      
      // Validate required fields
      if (!form.name || !form.type || !form.category) {
        setError('Please fill in all required fields (Name, Type, Category)');
        return;
      }

      await api.post('/api/services', form);
      console.log('✅ Service added successfully');
      setShowForm(false);
      setForm({
        name: "",
        type: "",
        description: "",
        price: "",
        duration: "",
        status: "active",
        hsCode: "",
        category: "",
        isProduct: false,
      });
      await fetchServices(); // Refresh the list
    } catch (err) {
      console.error('❌ Error adding service:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to add service. Please try again.');
      }
    }
  };

  const clearForm = () => {
    setShowForm(false);
    setError(null);
    setForm({
      name: "",
      type: "",
      description: "",
      price: "",
      duration: "",
      status: "active",
      hsCode: "",
      category: "",
      isProduct: false,
    });
    setHsCodeSuggestions([]);
    setShowHsCodeSuggestions(false);
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
        <h2 className="text-2xl font-bold">Services Management</h2>
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
          className="bg-white p-6 rounded-xl shadow mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Service Name *" 
              className="border p-2 rounded" 
              required 
            />
            
            <select 
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              className="border p-2 rounded" 
              required
            >
              <option value="">Select Category *</option>
              {serviceCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange} 
              className="border p-2 rounded" 
              required
            >
              <option value="">Select Type *</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <input 
              name="price" 
              value={form.price} 
              onChange={handleChange} 
              placeholder="Price (Rs.)" 
              type="number"
              step="0.01"
              className="border p-2 rounded" 
            />
            
            <input 
              name="duration" 
              value={form.duration} 
              onChange={handleChange} 
              placeholder="Duration (e.g., 2 hours, 1 day)" 
              className="border p-2 rounded" 
            />
            
            <select 
              name="status" 
              value={form.status} 
              onChange={handleChange} 
              className="border p-2 rounded"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                name="isProduct" 
                checked={form.isProduct} 
                onChange={handleChange} 
                className="rounded"
              />
              <label className="text-sm">Involves physical products (for HS code assignment)</label>
            </div>
          </div>
          
          <div className="mt-4">
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Service Description" 
              className="border p-2 rounded w-full h-24 resize-none"
            />
          </div>
          
          {/* HS Code Section - Only show if involves products */}
          {form.isProduct && (
            <div className="mt-4">
              <div className="relative">
                <input 
                  name="hsCode" 
                  value={form.hsCode} 
                  onChange={handleChange} 
                  placeholder="HS Code (Auto-assigned based on description)" 
                  className="border p-2 rounded w-full font-mono text-sm bg-gray-50" 
                  readOnly
                />
                {/* HS Code Suggestions */}
                {showHsCodeSuggestions && hsCodeSuggestions.length > 0 && (
                  <div className="absolute z-10 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto w-full mt-1">
                    {hsCodeSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => selectHsCode(suggestion.hsCode)}
                      >
                        <div className="font-medium">{suggestion.description}</div>
                        <div className="text-gray-600">HS Code: {suggestion.hsCode}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 HS codes are automatically assigned based on the service description when it involves physical products.
              </p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Add Service
            </button>
            <button 
              type="button" 
              onClick={clearForm}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {/* Services Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{services.length}</div>
          <div className="text-sm text-gray-600">Total Services</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">
            {services.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Services</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">
            {services.filter(s => s.status === 'inactive').length}
          </div>
          <div className="text-sm text-gray-600">Inactive Services</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">
            {services.filter(s => s.hsCode && s.hsCode !== '').length}
          </div>
          <div className="text-sm text-gray-600">With HS Codes</div>
        </div>
      </div>
      
      {/* Services Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Category</th>
              <th className="py-2 px-4 border">Type</th>
              <th className="py-2 px-4 border">Description</th>
              <th className="py-2 px-4 border">Price</th>
              <th className="py-2 px-4 border">Duration</th>
              <th className="py-2 px-4 border">HS Code</th>
              <th className="py-2 px-4 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-4 px-4 border text-center text-gray-500">
                  No services found. Add your first service!
                </td>
              </tr>
            ) : (
              services.map((service, idx) => (
                <tr key={service._id || idx}>
                  <td className="py-2 px-4 border font-medium">{service.name}</td>
                  <td className="py-2 px-4 border">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {service.category || service.type || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">{service.type}</td>
                  <td className="py-2 px-4 border text-sm max-w-xs truncate" title={service.description}>
                    {service.description || '-'}
                  </td>
                  <td className="py-2 px-4 border">
                    {service.price ? `Rs. ${service.price}` : '-'}
                  </td>
                  <td className="py-2 px-4 border">{service.duration || '-'}</td>
                  <td className="py-2 px-4 border font-mono text-xs">
                    {service.hsCode || '-'}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      service.status === 'active' ? 'bg-green-100 text-green-800' :
                      service.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status || 'active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Service Management Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Categories:</strong> Organize services by business area (Tax, Accounting, etc.)</p>
          <p><strong>Types:</strong> Classify services by nature (Consultation, Documentation, etc.)</p>
          <p><strong>HS Codes:</strong> Automatically assigned for services involving physical products</p>
          <p><strong>Status:</strong> Track active, inactive, or discontinued services</p>
          <p><strong>Integration:</strong> Services can be linked to invoices for FBR compliance</p>
        </div>
      </div>
    </div>
  );
}

export default ServicesPage;