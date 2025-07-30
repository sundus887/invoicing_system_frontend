import { useEffect, useState } from 'react';
import api from '../services/api';

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalEarnings: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    // Fetch dashboard stats from API
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Fetch clients and invoices from API
        const [clientsResponse, invoicesResponse] = await Promise.all([
          api.get('/api/clients'),
          api.get('/api/invoices')
        ]);
        
        const clients = clientsResponse.data || [];
        const invoices = invoicesResponse.data || [];
        
        // Calculate total earnings from invoices
        const totalEarnings = invoices.reduce((sum, invoice) => {
          return sum + (parseFloat(invoice.finalAmount) || parseFloat(invoice.totalAmount) || 0);
        }, 0);

        setStats({
          totalClients: clients.length,
          totalInvoices: invoices.length,
          totalEarnings: totalEarnings,
          pendingTasks: 0 // You can add logic for pending tasks later
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default values if API fails
        setStats({
          totalClients: 0,
          totalInvoices: 0,
          totalEarnings: 0,
          pendingTasks: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Welcome to HS Softworks</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500">Total Clients</span>
          <span className="text-2xl font-bold">{stats.totalClients}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500">Total Invoices</span>
          <span className="text-2xl font-bold">{stats.totalInvoices}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500">Total Earnings</span>
          <span className="text-2xl font-bold text-green-600">{stats.totalEarnings.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500">Pending Tasks</span>
          <span className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;