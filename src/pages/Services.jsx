import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function ServicesPage() {
  const { user, sellerId, isSeller, isAdmin } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: 'Consultation',
    category: 'Tax Consultancy',
    description: '',
    price: 0,
    duration: '',
    status: 'active',
    isProduct: false,
    hsCode: ''
  });

  // Fetch services with retry logic
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check permissions
      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to view services.');
        return;
      }

      console.log('🌐 Fetching services for seller:', sellerId);
      
      const response = await api.get('/api/services');

      console.log('✅ Backend services response:', response.data);
      
      if (response.data?.success && Array.isArray(response.data.services)) {
        setServices(response.data.services);
        setRetryCount(0); // Reset retry count on success
      } else {
        setError('Invalid response format from server.');
      }
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < 2) { // Auto-retry logic
        setTimeout(() => {
          console.log(`🔄 Auto-retrying services fetch (attempt ${retryCount + 1})...`);
          fetchServices();
        }, 2000);
      } else {
        setError('Failed to load services after multiple attempts. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add new service
  const handleAddService = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Check permissions
      if (!isSeller() && !isAdmin()) {
        setError('You do not have permission to create services.');
        return;
      }

      console.log('📝 Creating service with data:', form);
      
      const response = await api.post('/api/services', form);

      console.log('✅ Service created successfully:', response.data);
      
      setSuccess('Service created successfully!');
      setShowForm(false);
      resetForm();
      await fetchServices();
    } catch (err) {
      console.error('❌ Error creating service:', err);
      setError('Failed to create service. Please try again.');
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      setError(null);
      
      await api.delete(`/api/services/${serviceId}`);

      setSuccess('Service deleted successfully!');
      await fetchServices();
    } catch (err) {
      console.error('❌ Error deleting service:', err);
      setError('Failed to delete service. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      name: '',
      type: 'Consultation',
      category: 'Tax Consultancy',
      description: '',
      price: 0,
      duration: '',
      status: 'active',
      isProduct: false,
      hsCode: ''
    });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading services...</p>
        {retryCount > 0 && (
          <p className="text-sm text-yellow-600 mt-1">
            Retry attempt {retryCount}/2
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Seller Context Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Seller Context Information</h3>
        <div className="text-sm text-blue-700">
          <p><strong>User:</strong> {user?.name || 'N/A'} ({user?.role || 'N/A'})</p>
          <p><strong>Seller ID:</strong> {sellerId || 'N/A'}</p>
          <p><strong>Permissions:</strong> {isSeller() ? 'Seller' : isAdmin() ? 'Admin' : 'Limited'}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Services</h2>
        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          onClick={() => setShowForm(true)}
          disabled={!isSeller() && !isAdmin()}
        >
          <span className="text-xl">+</span> Add Service
        </button>
      </div>
      
      {/* Service Creation Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
          
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Filing">Filing</option>
                  <option value="Registration">Registration</option>
                  <option value="Audit">Audit</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Processing">Processing</option>
                  <option value="Training">Training</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="Tax Consultancy">Tax Consultancy</option>
                  <option value="Accounting Services">Accounting Services</option>
                  <option value="Audit Services">Audit Services</option>
                  <option value="Business Registration">Business Registration</option>
                  <option value="FBR Services">FBR Services</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Financial Advisory">Financial Advisory</option>
                  <option value="Import/Export Services">Import/Export Services</option>
                  <option value="Manufacturing Services">Manufacturing Services</option>
                  <option value="Trading Services">Trading Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full border p-2 rounded"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border p-2 rounded"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full border p-2 rounded"
                  placeholder="e.g., 1 day, 1 week"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border p-2 rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.isProduct}
                  onChange={(e) => setForm(prev => ({ ...prev, isProduct: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Is Product (for HS Code assignment)</span>
              </label>
            </div>

            {form.isProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HS Code
                </label>
                <input
                  type="text"
                  value={form.hsCode}
                  onChange={(e) => setForm(prev => ({ ...prev, hsCode: e.target.value }))}
                  className="w-full border p-2 rounded"
                  placeholder="e.g., 9983.99.00"
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded"
              >
                Create Service
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Category</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Price</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Duration</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">HS Code</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 px-4 text-center text-gray-500">
                  No services found. Create your first service!
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{service.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{service.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{service.category}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {service.price ? `$${service.price.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{service.duration || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      service.status === 'active' ? 'bg-green-100 text-green-800' :
                      service.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {service.hsCode || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteService(service._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      disabled={!isSeller() && !isAdmin()}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ServicesPage;