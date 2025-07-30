import { useEffect, useState } from 'react';
import api from '../services/api';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    companyName: "",
    buyerSTRN: "",
    buyerNTN: "",
    address: "",
    truckNo: "",
  });

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/clients');
      console.log('✅ Backend clients response:', response.data);
      setClients(response.data);
    } catch (err) {
      console.error('❌ Error fetching clients:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 Submitting client data:', form);
      
      // Validate required fields
      if (!form.companyName || !form.buyerSTRN || !form.buyerNTN || !form.address) {
        setError('Please fill in all required fields (Company Name, STRN, NTN, Address)');
        return;
      }
      
      const response = await api.post('/api/clients', form);
      console.log('✅ Client added successfully:', response.data);
      
      setShowForm(false);
      setForm({
        companyName: "",
        buyerSTRN: "",
        buyerNTN: "",
        address: "",
        truckNo: "",
      });
      setError(null); // Clear any previous errors
      await fetchClients(); // Refresh the list
    } catch (err) {
      console.error('❌ Error adding client:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to add client. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading clients...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchClients}
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
        <h2 className="text-2xl font-bold">Buyer Management</h2>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <span className="text-xl">+</span> Add Buyer
        </button>
      </div>
      
      {showForm && (
        <form
          onSubmit={handleAddClient}
          className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input 
            name="companyName" 
            value={form.companyName} 
            onChange={handleChange} 
            placeholder="Company Name *" 
            className="border p-2 rounded" 
            required 
          />
          <input 
            name="buyerSTRN" 
            value={form.buyerSTRN} 
            onChange={handleChange} 
            placeholder="Buyer STRN *" 
            className="border p-2 rounded" 
            required 
          />
          <input 
            name="buyerNTN" 
            value={form.buyerNTN} 
            onChange={handleChange} 
            placeholder="Buyer NTN *" 
            className="border p-2 rounded" 
            required 
          />
          <input 
            name="truckNo" 
            value={form.truckNo} 
            onChange={handleChange} 
            placeholder="Truck No." 
            className="border p-2 rounded" 
          />
          <input 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
            placeholder="Address *" 
            className="border p-2 rounded md:col-span-2" 
            required 
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">
            Add Buyer
          </button>
          <button 
            type="button" 
            onClick={() => {
              setShowForm(false);
              setError(null); // Clear error when canceling
            }} 
            className="col-span-1 md:col-span-2 text-gray-500 mt-2"
          >
            Cancel
          </button>
        </form>
      )}
      
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Company Name</th>
            <th className="py-2 px-4 border">Buyer STRN</th>
            <th className="py-2 px-4 border">Buyer NTN</th>
            <th className="py-2 px-4 border">Truck No.</th>
            <th className="py-2 px-4 border">Address</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan="5" className="py-4 px-4 border text-center text-gray-500">
                No buyers found. Add your first buyer!
              </td>
            </tr>
          ) : (
            clients.map((client, idx) => (
              <tr key={client._id || idx}>
                <td className="py-2 px-4 border">{client.companyName}</td>
                <td className="py-2 px-4 border">{client.buyerSTRN}</td>
                <td className="py-2 px-4 border">{client.buyerNTN}</td>
                <td className="py-2 px-4 border">{client.truckNo}</td>
                <td className="py-2 px-4 border">{client.address}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ClientsPage;