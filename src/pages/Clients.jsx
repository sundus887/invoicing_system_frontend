import { useEffect, useState } from 'react';
import api from '../services/api';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    cnic: "",
    company: "",
    ntn: "",
    strn: "",
    email: "",
    phone: "",
    address: "",
    registeredDate: "",
  });

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/clients'); // ✅ Added /api/ prefix
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
      await api.post('/api/clients', form); // ✅ Added /api/ prefix
      setShowForm(false);
      setForm({
        name: "",
        cnic: "",
        company: "",
        ntn: "",
        strn: "",
        email: "",
        phone: "",
        address: "",
        registeredDate: "",
      });
      await fetchClients(); // Refresh the list
    } catch (err) {
      console.error('❌ Error adding client:', err);
      setError('Failed to add client. Please try again.');
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
        <h2 className="text-2xl font-bold">Clients</h2>
        <button
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <span className="text-xl">+</span> Add Client
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={handleAddClient}
          className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
          <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="CNIC" className="border p-2 rounded" required />
          <input name="company" value={form.company} onChange={handleChange} placeholder="Company" className="border p-2 rounded" />
          <input name="ntn" value={form.ntn} onChange={handleChange} placeholder="NTN" className="border p-2 rounded" />
          <input name="strn" value={form.strn} onChange={handleChange} placeholder="STRN" className="border p-2 rounded" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded" type="email" />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="border p-2 rounded" />
          <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="border p-2 rounded" />
          <input name="registeredDate" value={form.registeredDate} onChange={handleChange} placeholder="Registered Date" className="border p-2 rounded" type="date" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded col-span-1 md:col-span-2">Add Client</button>
          <button type="button" onClick={() => setShowForm(false)} className="col-span-1 md:col-span-2 text-gray-500 mt-2">Cancel</button>
        </form>
      )}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Name</th>
            <th className="py-2 px-4 border">CNIC</th>
            <th className="py-2 px-4 border">Company</th>
            <th className="py-2 px-4 border">NTN</th>
            <th className="py-2 px-4 border">STRN</th>
            <th className="py-2 px-4 border">Email</th>
            <th className="py-2 px-4 border">Phone</th>
            <th className="py-2 px-4 border">Address</th>
            <th className="py-2 px-4 border">Registered Date</th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan="9" className="py-4 px-4 border text-center text-gray-500">
                No clients found. Add your first client!
              </td>
            </tr>
          ) : (
            clients.map((client, idx) => (
              <tr key={client._id || idx}>
                <td className="py-2 px-4 border">{client.name}</td>
                <td className="py-2 px-4 border">{client.cnic}</td>
                <td className="py-2 px-4 border">{client.company}</td>
                <td className="py-2 px-4 border">{client.ntn}</td>
                <td className="py-2 px-4 border">{client.strn}</td>
                <td className="py-2 px-4 border">{client.email}</td>
                <td className="py-2 px-4 border">{client.phone}</td>
                <td className="py-2 px-4 border">{client.address}</td>
                <td className="py-2 px-4 border">
                  {client.registeredDate ? new Date(client.registeredDate).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ClientsPage;