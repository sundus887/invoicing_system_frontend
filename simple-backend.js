const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage
let clients = [];
let services = [
  {
    id: 1,
    name: "Tax Filing",
    type: "Taxation",
    description: "Annual tax return filing",
    price: "5000",
    duration: "1 week",
    status: "Active"
  }
];
let invoices = [];
let sellers = [];

// Routes
app.get('/api/clients', (req, res) => {
  console.log('GET /api/clients - Returning', clients.length, 'clients');
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const newClient = {
    id: Date.now(),
    ...req.body
  };
  clients.push(newClient);
  console.log('POST /api/clients - Added new client');
  res.status(201).json(newClient);
});

app.get('/api/services', (req, res) => {
  console.log('GET /api/services - Returning', services.length, 'services');
  res.json(services);
});

app.get('/api/invoices', (req, res) => {
  console.log('GET /api/invoices - Returning', invoices.length, 'invoices');
  res.json(invoices);
});

app.get('/api/sellers', (req, res) => {
  console.log('GET /api/sellers - Returning', sellers.length, 'sellers');
  res.json(sellers);
});

app.get('/api/fbrinvoices/pending', (req, res) => {
  console.log('GET /api/fbrinvoices/pending');
  res.json([]);
});

app.get('/api/fbrinvoices/submissions', (req, res) => {
  console.log('GET /api/fbrinvoices/submissions');
  res.json([]);
});

app.get('/api/tasks', (req, res) => {
  console.log('GET /api/tasks');
  res.json([]);
});

app.get('/api/dashboard/stats', (req, res) => {
  console.log('GET /api/dashboard/stats');
  res.json({
    totalClients: clients.length,
    totalInvoices: invoices.length,
    totalServices: services.length,
    totalSellers: sellers.length
  });
});

app.get('/api/health', (req, res) => {
  console.log('GET /api/health');
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Backend server started successfully!');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   - GET  /api/clients`);
  console.log(`   - POST /api/clients`);
  console.log(`   - GET  /api/services`);
  console.log(`   - GET  /api/invoices`);
  console.log(`   - GET  /api/sellers`);
  console.log(`   - GET  /api/fbrinvoices/pending`);
  console.log(`   - GET  /api/fbrinvoices/submissions`);
  console.log(`   - GET  /api/tasks`);
  console.log(`   - GET  /api/dashboard/stats`);
  console.log(`   - GET  /api/health`);
  console.log('');
  console.log('✅ Backend is ready to accept requests!');
}); 