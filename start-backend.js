// Simple backend starter script
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Clean data without dummy addresses
let clients = [
  // Empty array - no dummy data
];

let services = [
  {
    id: 1,
    name: "Tax Filing",
    type: "Taxation",
    description: "Annual tax return filing",
    price: "5000",
    duration: "1 week",
    status: "Active"
  },
  {
    id: 2,
    name: "Bookkeeping",
    type: "Accounting",
    description: "Monthly bookkeeping services",
    price: "3000",
    duration: "Monthly",
    status: "Active"
  }
];

let invoices = [
  // Empty array - no dummy data
];

let sellers = [
  // Empty array - no dummy data
];

// Client routes
app.get('/api/clients', (req, res) => {
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const newClient = {
    id: Date.now(),
    ...req.body
  };
  clients.push(newClient);
  res.status(201).json(newClient);
});

app.delete('/api/clients/:id', (req, res) => {
  const clientId = req.params.id;
  const index = clients.findIndex(client => client.id == clientId || client._id == clientId);
  
  if (index > -1) {
    clients.splice(index, 1);
    res.json({ message: 'Client deleted successfully' });
  } else {
    res.status(404).json({ message: 'Client not found' });
  }
});

// Seller routes
app.get('/api/sellers', (req, res) => {
  res.json(sellers);
});

app.post('/api/sellers', (req, res) => {
  const newSeller = {
    _id: Date.now().toString(),
    ...req.body
  };
  sellers.push(newSeller);
  res.status(201).json(newSeller);
});

app.delete('/api/sellers/:id', (req, res) => {
  const sellerId = req.params.id;
  const index = sellers.findIndex(seller => seller.id == sellerId || seller._id == sellerId);
  
  if (index > -1) {
    sellers.splice(index, 1);
    res.json({ message: 'Seller deleted successfully' });
  } else {
    res.status(404).json({ message: 'Seller not found' });
  }
});

// Service routes
app.get('/api/services', (req, res) => {
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const newService = {
    id: Date.now(),
    ...req.body
  };
  services.push(newService);
  res.status(201).json(newService);
});

// Invoice routes
app.get('/api/invoices', (req, res) => {
  res.json(invoices);
});

app.post('/api/invoices', (req, res) => {
  const { buyerId, sellerId, ...invoiceData } = req.body;
  
  // Validate buyer and seller if provided
  if (buyerId) {
    const buyer = clients.find(client => client.id == buyerId || client._id == buyerId);
    if (!buyer) {
      return res.status(400).json({ error: 'Invalid buyer ID' });
    }
  }
  
  if (sellerId) {
    const seller = sellers.find(seller => seller.id == sellerId || seller._id == sellerId);
    if (!seller) {
      return res.status(400).json({ error: 'Invalid seller ID' });
    }
  }
  
  const newInvoice = {
    _id: Date.now().toString(),
    buyerId,
    sellerId,
    ...invoiceData
  };
  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

app.delete('/api/invoices/:id', (req, res) => {
  const invoiceId = req.params.id;
  const index = invoices.findIndex(invoice => invoice.id == invoiceId || invoice._id == invoiceId);
  
  if (index > -1) {
    invoices.splice(index, 1);
    res.json({ message: 'Invoice deleted successfully' });
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
});

// FBR e-Invoicing routes
app.get('/api/fbrinvoices/pending', (req, res) => {
  res.json([]);
});

app.get('/api/fbrinvoices/submissions', (req, res) => {
  res.json([]);
});

// Tasks routes
app.get('/api/tasks', (req, res) => {
  res.json([]);
});

// Dashboard stats route
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalClients: clients.length,
    totalInvoices: invoices.length,
    totalServices: services.length,
    totalSellers: sellers.length
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Clients: ${clients.length}`);
  console.log(`👥 Sellers: ${sellers.length}`);
  console.log(`🔧 Services: ${services.length}`);
  console.log(`📄 Invoices: ${invoices.length}`);
  console.log(`🌐 API available at: http://localhost:${PORT}`);
}); 