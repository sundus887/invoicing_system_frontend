const InvoiceView = ({ invoiceId }) => {
    const [invoice, setInvoice] = useState(null);
    const [fbrData, setFbrData] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      loadInvoice();
    }, [invoiceId]);
  
    const loadInvoice = async () => {
      try {
        const response = await api.get(`/api/invoices/${invoiceId}`);
        setInvoice(response.data);
        
        // Load FBR data if available
        if (response.data.fbrReference) {
          const fbrResponse = await api.get(`/api/fbrinvoices/invoice/${response.data.invoiceNumber}`);
          setFbrData(fbrResponse.data.invoice);
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const downloadPDF = async () => {
      try {
        const response = await api.get(`/api/pdf/fbr-invoice/${invoice.invoiceNumber}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        toast.error('Error downloading PDF');
      }
    };
  
    if (loading) return <div>Loading...</div>;
  
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
          <div className="space-x-2">
            <button
              onClick={downloadPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Print
            </button>
          </div>
        </div>
  
        {/* FBR Status */}
        {fbrData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">FBR E-Invoice Status</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">UUID:</span> {fbrData.uuid}
              </div>
              <div>
                <span className="font-medium">IRN:</span> {fbrData.irn}
              </div>
              <div>
                <span className="font-medium">FBR Reference:</span> {fbrData.fbrReference}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  {fbrData.status?.toUpperCase()}
                </span>
              </div>
            </div>
            {fbrData.qrCode && (
              <div className="mt-4">
                <span className="font-medium">QR Code:</span>
                <div className="mt-2">
                  <img 
                    src={`data:image/png;base64,${fbrData.qrCode}`} 
                    alt="FBR QR Code"
                    className="w-32 h-32"
                    width="128"
                    height="128"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                  />
                </div>
              </div>
            )}
          </div>
        )}
  
        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Date:</span> {new Date(invoice.issuedDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Status:</span> {invoice.status}
            </div>
          </div>
        </div>
  
        {/* Buyer Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Buyer Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Name:</span> {invoice.buyerId?.companyName}
            </div>
            <div>
              <span className="font-medium">NTN:</span> {invoice.buyerId?.buyerNTN}
            </div>
            <div>
              <span className="font-medium">STRN:</span> {invoice.buyerId?.buyerSTRN}
            </div>
            <div>
              <span className="font-medium">Address:</span> {invoice.buyerId?.address}
            </div>
          </div>
        </div>
  
        {/* Invoice Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Items</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Total Value</th>
                <th className="text-right py-2">Sales Tax</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{item.description || item.product}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">₹{item.unitPrice?.toFixed(2)}</td>
                  <td className="text-right py-2">₹{item.totalValue?.toFixed(2)}</td>
                  <td className="text-right py-2">₹{item.salesTax?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Invoice Totals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span>₹{invoice.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax:</span>
              <span>₹{invoice.salesTax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>₹{invoice.discount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Final Amount:</span>
              <span>₹{invoice.finalValue?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };