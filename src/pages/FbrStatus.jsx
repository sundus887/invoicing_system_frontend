const FbrStatus = () => {
    const [authStatus, setAuthStatus] = useState(null);
    const [sellerInfo, setSellerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      loadFbrStatus();
    }, []);
  
    const loadFbrStatus = async () => {
      try {
        const [authResponse, sellerResponse] = await Promise.all([
          api.get('/api/fbr-auth/status'),
          api.get('/api/fbr-auth/seller-info')
        ]);
        
        setAuthStatus(authResponse.data);
        setSellerInfo(sellerResponse.data.sellerInfo);
      } catch (error) {
        console.error('Error loading FBR status:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const handleLogout = async () => {
      try {
        await api.post('/api/fbr-auth/logout');
        loadFbrStatus();
        toast.success('Logged out from FBR');
      } catch (error) {
        toast.error('Error logging out');
      }
    };
  
    if (loading) return <div>Loading...</div>;
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">FBR Integration Status</h1>
        
        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status: 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  authStatus?.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {authStatus?.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </p>
            </div>
            {authStatus?.isAuthenticated && (
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Logout from FBR
              </button>
            )}
          </div>
        </div>
  
        {/* Seller Information */}
        {sellerInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Seller Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Business Name:</span> {sellerInfo.businessName}
              </div>
              <div>
                <span className="font-medium">NTN:</span> {sellerInfo.sellerNTN}
              </div>
              <div>
                <span className="font-medium">STRN:</span> {sellerInfo.sellerSTRN}
              </div>
              <div>
                <span className="font-medium">Environment:</span> {sellerInfo.environment}
              </div>
            </div>
          </div>
        )}
  
        {/* Connection Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Connection Test</h2>
          <button
            onClick={async () => {
              try {
                const response = await api.get('/api/fbr-auth/test-connection');
                if (response.data.success) {
                  toast.success('FBR connection successful!');
                } else {
                  toast.error('FBR connection failed');
                }
              } catch (error) {
                toast.error('Error testing connection');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test FBR Connection
          </button>
        </div>
      </div>
    );
  };