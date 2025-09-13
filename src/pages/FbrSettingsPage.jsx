import React, { useState, useEffect } from 'react';
import api from '../services/api';

// If you use a context for auth/seller info, import it here
// import { useAuth } from '../contexts/AuthContext';

function FbrSettingsPage() {
  // Replace with your actual sellerId fetching logic
  // const { user, sellerId } = useAuth();
  const sellerId = localStorage.getItem('sellerId') || 'demo-seller-1';

  const [form, setForm] = useState({
    fbrApiToken: '',
    fbrApiUrl: '',
    fbrValidateUrl: '',
    fbrScenarioId: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch current FBR settings for this seller
  useEffect(() => {
    const fetchSettings = async () => {
      setFetching(true);
      setError('');
      try {
        const res = await api.get('/api/seller-settings');
        const seller = res.data.sellerSettings.find(s => s.sellerId === sellerId);
        if (seller) {
          setForm({
            fbrApiToken: seller.fbrApiToken || '',
            fbrApiUrl: seller.fbrApiUrl || '',
            fbrValidateUrl: seller.fbrValidateUrl || '',
            fbrScenarioId: seller.fbrScenarioId || ''
          });
        }
      } catch (err) {
        setError('Failed to fetch FBR settings.');
      }
      setFetching(false);
    };
    fetchSettings();
  }, [sellerId]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.put('/api/seller-settings/fbr', {
        sellerId,
        ...form
      });
      setMessage('FBR settings updated successfully!');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to update FBR settings.'
      );
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">FBR E-Invoicing Settings</h2>
      {fetching ? (
        <div>Loading current settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">FBR API Token</label>
            <input
              type="text"
              name="fbrApiToken"
              value={form.fbrApiToken}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">FBR API URL</label>
            <input
              type="text"
              name="fbrApiUrl"
              value={form.fbrApiUrl}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">FBR Validate URL</label>
            <input
              type="text"
              name="fbrValidateUrl"
              value={form.fbrValidateUrl}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">FBR Scenario ID</label>
            <input
              type="text"
              name="fbrScenarioId"
              value={form.fbrScenarioId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="SN000"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          {message && (
            <div className="text-green-600 mt-2">{message}</div>
          )}
          {error && (
            <div className="text-red-600 mt-2">{error}</div>
          )}
        </form>
      )}
    </div>
  );
}

export default FbrSettingsPage;