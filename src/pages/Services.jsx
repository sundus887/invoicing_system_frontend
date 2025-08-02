// src/pages/Services.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function ServicesPage() {
  const { user, sellerId, isSeller, isAdmin } = useAuth();
  
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
    "Poultry Services", // Add poultry category
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
    "Product Supply", // Add product supply type
    "Other"
  ];

  // Fetch services from backend with seller context
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Check if user has permission to view services
      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to view services');
        return;
      }
      
      console.log('🔄 Fetching services for seller:', sellerId);
      const response = await api.get('/services');
      console.log('✅ Services loaded:', response.data);
      
      // Backend now automatically filters by seller
      setServices(response.data.services || response.data);
      setError(null); // Ensure error is cleared on success
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setError(err.response?.data?.message || 'Failed to load services from backend. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // HS Code lookup function - Updated to use correct endpoint
  const lookupHSCode = async (description) => {
    if (!description || description.length < 2) {
      setHsCodeSuggestions([]);
      setShowHsCodeSuggestions(false);
      return;
    }
    
    try {
      // Use the correct endpoint from your backend
      const response = await api.get(`/hscodes/suggestions?description=${encodeURIComponent(description)}&limit=5`);
      if (response.data && response.data.suggestions) {
        setHsCodeSuggestions(response.data.suggestions);
        setShowHsCodeSuggestions(true);
      } else {
        // Fallback to direct lookup
        const lookupResponse = await api.get(`/hscodes/lookup?description=${encodeURIComponent(description)}`);
        if (lookupResponse.data && lookupResponse.data.hsCode) {
          setHsCodeSuggestions([{
            description: description,
            hsCode: lookupResponse.data.hsCode
          }]);
          setShowHsCodeSuggestions(true);
        }
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

  // Auto-assign HS Code when description changes
  const handleDescriptionChange = async (value) => {
    setForm(prev => ({ ...prev, description: value }));

    // Auto-assign HS Code if it's a product
    if (form.isProduct && value.trim()) {
      try {
        const response = await api.get(`/hscodes/lookup?description=${encodeURIComponent(value)}`);
        if (response.data && response.data.hsCode) {
          setForm(prev => ({ ...prev, hsCode: response.data.hsCode }));
          console.log(`🔍 Auto-assigned HS Code for "${value}": ${response.data.hsCode}`);
        }
      } catch (err) {
        console.error('❌ Error auto-assigning HS code:', err);
      }
    }

    // Show suggestions
    if (form.isProduct) {
      lookupHSCode(value);
    }
  };

  useEffect(() => {
    // Only fetch data if user has permission
    if (isSeller() || isAdmin()) {
      fetchServices();
    }
  }, [sellerId, isSeller, isAdmin]); // Add dependencies for multi-tenancy

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'description') {
      handleDescriptionChange(value);
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear HS Code if product checkbox is unchecked
    if (name === 'isProduct' && !checked) {
      setForm(prev => ({ ...prev, hsCode: '' }));
      setShowHsCodeSuggestions(false);
      setHsCodeSuggestions([]);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    
    // Check permissions
    if (!isSeller() && !isAdmin()) {
      setError('Only sellers can add services');
      return;
    }
    
    try {
      setError(null); // Clear error before adding
      console.log('🔄 Adding service with seller context:', sellerId);
      
      // Validate required fields
      if (!form.name || !form.type || !form.category) {
        setError('Please fill in all required fields (Name, Type, Category)');
        return;
      }

      // Prepare service data with HS Code - sellerId automatically assigned by backend
      const serviceData = {
        ...form,
        hsCode: form.isProduct ? (form.hsCode || '9983.99.00') : '', // Only include HS Code for products
        price: form.price ? parseFloat(form.price) : 0
      };

      await api.post('/services', serviceData);
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
      setHsCodeSuggestions([]);
      setShowHsCodeSuggestions(false);
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

  // Show loading state
  if (loading && services.length === 0) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  // Show permission error
  if (!isSeller() && !isAdmin()) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          You do not have permission to view services. Only sellers and admins can access this page.
        </div>
      </div>
    );
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
      {/* Seller Context Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Seller Context</h3>
            <p className="text-sm text-blue-600">
              Logged in as: <strong>{user?.name}</strong> ({user?.role})
            </p>
            <p className="text-sm text-blue-600">
              Seller ID: <code className="bg-blue-100 px-1 rounded">{sellerId || 'Not set'}</code>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">
              Total Services: <strong>{services.length}</strong>
            </p>
            <p className="text-sm text-blue-600">
              With HS Codes: <strong>{services.filter(s => s.hsCode && s.hsCode !== '').length}</strong>
            </p>
          </div>
        </div>
      </div>

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
                {form.hsCode && (
                  <div className="text-green-600 text-xs mt-1">
                    ✅ Auto-assigned HS Code: {form.hsCode}
                  </div>
                )}
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
                <br />
                🐔 For poultry services, HS codes like 2309.00.00 (poultry meal) and 1511.00.00 (poultry oil) will be assigned.
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
                    {service.hsCode ? (
                      <span className="text-green-600" title="HS Code assigned">
                        {service.hsCode} ✅
                      </span>
                    ) : '-'}
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
        <h4 className="font-semibold text-blue-800 mb-2">ℹ Service Management Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Multi-Tenancy:</strong> Each seller only sees and manages their own services</p>
          <p><strong>Categories:</strong> Organize services by business area (Tax, Accounting, Poultry, etc.)</p>
          <p><strong>Types:</strong> Classify services by nature (Consultation, Documentation, Product Supply, etc.)</p>
          <p><strong>HS Codes:</strong> Automatically assigned for services involving physical products</p>
          <p><strong>Poultry Services:</strong> Special HS codes (2309.00.00 for meal, 1511.00.00 for oil)</p>
          <p><strong>Status:</strong> Track active, inactive, or discontinued services</p>
          <p><strong>Integration:</strong> Services can be linked to invoices for FBR compliance</p>
        </div>
      </div>
    </div>
  );
}

export default ServicesPage;