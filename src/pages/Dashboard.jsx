import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalEarnings: 0,
    pendingTasks: 0,
    // New FBR-related stats
    fbrSubmissions: 0,
    fbrAccepted: 0,
    fbrPending: 0,
    fbrRejected: 0,
    // HS Code stats
    invoicesWithHSCodes: 0,
    totalHSCodes: 0,
    // Recent activity
    recentInvoices: [],
    recentFBRSubmissions: []
  });

  useEffect(() => {
    // Fetch comprehensive dashboard stats from API
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // First try to get dashboard stats from the dedicated endpoint
        try {
          const dashboardStatsResponse = await api.get('/api/dashboard/stats');
          console.log('✅ Dashboard stats response:', dashboardStatsResponse.data);
          
          // Get additional data for detailed stats
          const [clientsResponse, invoicesResponse] = await Promise.all([
            api.get('/api/clients'),
            api.get('/api/invoices')
          ]);
          
          const clients = clientsResponse.data || [];
          const invoices = invoicesResponse.data || [];
          
          // Calculate total earnings from invoices
          const totalEarnings = invoices.reduce((sum, invoice) => {
            if (invoice.items && invoice.items.length > 0) {
              return sum + invoice.items.reduce((itemSum, item) => {
                return itemSum + (parseFloat(item.finalValue) || 0);
              }, 0);
            } else {
              return sum + (parseFloat(invoice.finalValue) || parseFloat(invoice.totalAmount) || 0);
            }
          }, 0);

          // Get recent invoices (last 5)
          const recentInvoices = invoices
            .sort((a, b) => new Date(b.createdAt || b.issuedDate) - new Date(a.createdAt || a.issuedDate))
            .slice(0, 5);

          setStats({
            totalClients: clients.length,
            totalInvoices: invoices.length,
            totalEarnings: totalEarnings,
            pendingTasks: 0, // Default for now
            // FBR statistics (default values)
            fbrSubmissions: 0,
            fbrAccepted: 0,
            fbrPending: 0,
            fbrRejected: 0,
            // HS Code statistics
            invoicesWithHSCodes: 0,
            totalHSCodes: 0,
            // Recent activity
            recentInvoices: recentInvoices,
            recentFBRSubmissions: []
          });
          
        } catch (dashboardError) {
          console.log('⚠️ Dashboard stats endpoint not available, fetching individual data...');
          
          // Fallback: fetch individual endpoints
          const [
            clientsResponse, 
            invoicesResponse, 
            fbrSubmissionsResponse,
            fbrPendingResponse,
            tasksResponse
          ] = await Promise.all([
            api.get('/api/clients'),
            api.get('/api/invoices'),
            api.get('/api/fbrinvoices/submissions'),
            api.get('/api/fbrinvoices/pending'),
            api.get('/api/tasks')
          ]);
          
          const clients = clientsResponse.data || [];
          const invoices = invoicesResponse.data || [];
          const fbrSubmissions = fbrSubmissionsResponse.data || [];
          const fbrPending = fbrPendingResponse.data || [];
          const tasks = tasksResponse.data || [];
          
          // Calculate total earnings from invoices
          const totalEarnings = invoices.reduce((sum, invoice) => {
            if (invoice.items && invoice.items.length > 0) {
              return sum + invoice.items.reduce((itemSum, item) => {
                return itemSum + (parseFloat(item.finalValue) || 0);
              }, 0);
            } else {
              return sum + (parseFloat(invoice.finalValue) || parseFloat(invoice.totalAmount) || 0);
            }
          }, 0);

          // Calculate FBR statistics
          const fbrAccepted = fbrSubmissions.filter(sub => sub.status === 'accepted').length;
          const fbrRejected = fbrSubmissions.filter(sub => sub.status === 'rejected').length;
          const fbrPendingCount = fbrPending.length;

          // Calculate HS Code statistics
          const invoicesWithHSCodes = invoices.filter(invoice => {
            if (invoice.items && invoice.items.length > 0) {
              return invoice.items.some(item => item.hsCode && item.hsCode !== '9983.99.00');
            }
            return invoice.hsCode && invoice.hsCode !== '9983.99.00';
          }).length;

          const totalHSCodes = invoices.reduce((count, invoice) => {
            if (invoice.items && invoice.items.length > 0) {
              return count + invoice.items.filter(item => item.hsCode && item.hsCode !== '9983.99.00').length;
            }
            return count + (invoice.hsCode && invoice.hsCode !== '9983.99.00' ? 1 : 0);
          }, 0);

          // Get recent invoices (last 5)
          const recentInvoices = invoices
            .sort((a, b) => new Date(b.createdAt || b.issuedDate) - new Date(a.createdAt || a.issuedDate))
            .slice(0, 5);

          // Get recent FBR submissions (last 5)
          const recentFBRSubmissions = fbrSubmissions
            .sort((a, b) => new Date(b.submissionDate || b.createdAt) - new Date(a.submissionDate || a.createdAt))
            .slice(0, 5);

          // Calculate pending tasks
          const pendingTasks = tasks.filter(task => task.status === 'pending').length;

          setStats({
            totalClients: clients.length,
            totalInvoices: invoices.length,
            totalEarnings: totalEarnings,
            pendingTasks: pendingTasks,
            // FBR statistics
            fbrSubmissions: fbrSubmissions.length,
            fbrAccepted: fbrAccepted,
            fbrPending: fbrPendingCount,
            fbrRejected: fbrRejected,
            // HS Code statistics
            invoicesWithHSCodes: invoicesWithHSCodes,
            totalHSCodes: totalHSCodes,
            // Recent activity
            recentInvoices: recentInvoices,
            recentFBRSubmissions: recentFBRSubmissions
          });
        }
        
      } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        // Set default values if API fails
        setStats({
          totalClients: 0,
          totalInvoices: 0,
          totalEarnings: 0,
          pendingTasks: 0,
          fbrSubmissions: 0,
          fbrAccepted: 0,
          fbrPending: 0,
          fbrRejected: 0,
          invoicesWithHSCodes: 0,
          totalHSCodes: 0,
          recentInvoices: [],
          recentFBRSubmissions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tax Nexus Dashboard</h1>
      
      {/* Debug Info - Remove this section after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info:</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>Total Clients: {stats.totalClients}</p>
            <p>Total Invoices: {stats.totalInvoices}</p>
            <p>Total Earnings: Rs. {stats.totalEarnings}</p>
            <p>API URL: {process.env.NODE_ENV === 'production' ? 'Vercel' : 'Local (localhost:5000)'}</p>
          </div>
        </div>
      )}
      
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500 mb-2">Total Clients</span>
          <span className="text-3xl font-bold text-blue-600">{stats.totalClients}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500 mb-2">Total Invoices</span>
          <span className="text-3xl font-bold text-purple-600">{stats.totalInvoices}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500 mb-2">Total Earnings</span>
          <span className="text-3xl font-bold text-green-600">Rs. {stats.totalEarnings.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
          <span className="text-gray-500 mb-2">Pending Tasks</span>
          <span className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</span>
        </div>
      </div>

      {/* FBR Statistics Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">FBR E-Invoicing Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.fbrSubmissions}</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Accepted</p>
                <p className="text-2xl font-bold">{stats.fbrAccepted}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending</p>
                <p className="text-2xl font-bold">{stats.fbrPending}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Rejected</p>
                <p className="text-2xl font-bold">{stats.fbrRejected}</p>
              </div>
              <span className="text-3xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* HS Code Statistics Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">HS Code Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Invoices with HS Codes</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.invoicesWithHSCodes}</p>
                <p className="text-sm text-gray-500">
                  {stats.totalInvoices > 0 
                    ? `${((stats.invoicesWithHSCodes / stats.totalInvoices) * 100).toFixed(1)}% of total invoices`
                    : 'No invoices yet'
                  }
                </p>
              </div>
              <span className="text-4xl">🏷️</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total HS Codes Assigned</p>
                <p className="text-2xl font-bold text-teal-600">{stats.totalHSCodes}</p>
                <p className="text-sm text-gray-500">
                  Auto-assigned based on product descriptions
                </p>
              </div>
              <span className="text-4xl">🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Invoices */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📄</span>
            Recent Invoices
          </h3>
          {stats.recentInvoices.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent invoices</p>
          ) : (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice, index) => (
                <div key={invoice._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {invoice.invoiceNumber || `INV-${invoice._id?.slice(-6)}`}
                    </p>
                    <p className="text-xs text-gray-600">
                      {invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      Rs. {(() => {
                        if (invoice.items && invoice.items.length > 0) {
                          return invoice.items.reduce((sum, item) => sum + (parseFloat(item.finalValue) || 0), 0).toLocaleString();
                        }
                        return (parseFloat(invoice.finalValue) || parseFloat(invoice.totalAmount) || 0).toLocaleString();
                      })()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent FBR Submissions */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">🏛️</span>
            Recent FBR Submissions
          </h3>
          {stats.recentFBRSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent FBR submissions</p>
          ) : (
            <div className="space-y-3">
              {stats.recentFBRSubmissions.map((submission, index) => (
                <div key={submission._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {submission.invoiceNumber || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {submission.fbrReference ? `FBR: ${submission.fbrReference}` : 'No FBR Reference'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      Rs. {(parseFloat(submission.totalAmount) || 0).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/invoices')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">📄</span>
            Create New Invoice
          </button>
          <button 
            onClick={() => navigate('/fbr-e-invoicing')}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">🏛️</span>
            Submit to FBR
          </button>
          <button 
            onClick={() => navigate('/clients')}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <span className="mr-2">👥</span>
            Manage Clients
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm">Database Connected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm">HS Code Database Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm">FBR API Ready</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm">Export Functions Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;