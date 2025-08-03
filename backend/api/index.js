// Simple Backend for Tax Nexus
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/consultancy';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Define Schemas and Models
const clientSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  buyerSTRN: { type: String, required: true },
  buyerNTN: { type: String, required: true },
  address: { type: String, required: true },
  truckNo: { type: String },
  sellerId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const sellerSettingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  sellerSTRN: { type: String, required: true },
  sellerNTN: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  posId: { type: String },
  businessType: { type: String },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerSettings' },
  product: { type: String },
  units: { type: Number },
  unitPrice: { type: Number },
  totalValue: { type: Number },
  salesTax: { type: Number },
  extraTax: { type: Number },
  finalValue: { type: Number },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});

const fbrInvoiceSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoiceNumber: { type: String, required: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  irn: { type: String },
  qrCode: { type: String },
  uuid: { type: String },
  status: { type: String, default: 'pending' },
  fbrStatus: { type: String, default: 'pending' },
  amount: { type: Number },
  submittedAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  dueDate: { type: Date },
  sellerId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const fbrApiSettingsSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  apiKey: { type: String },
  secretKey: { type: String },
  posId: { type: String },
  businessName: { type: String },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'consultant', 'client'], default: 'client' },
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 },
  duration: { type: String },
  status: { type: String, default: 'active' },
  isProduct: { type: Boolean, default: false },
  hsCode: { type: String },
  sellerId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Register Models
const Client = mongoose.model('Client', clientSchema);
const SellerSettings = mongoose.model('SellerSettings', sellerSettingsSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const FbrInvoice = mongoose.model('FbrInvoice', fbrInvoiceSchema);
const Task = mongoose.model('Task', taskSchema);
const FbrApiSettings = mongoose.model('FbrApiSettings', fbrApiSettingsSchema);
const User = mongoose.model('User', userSchema);
const Service = mongoose.model('Service', serviceSchema);

// Connect to MongoDB
connectDB();

// Client routes
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find({});
    res.json({ success: true, clients, count: clients.length });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clients', error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = new Client(req.body);
    const savedClient = await newClient.save();
    res.status(201).json({ success: true, client: savedClient });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ success: false, message: 'Failed to create client', error: error.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedClient) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json({ success: true, client: updatedClient });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ success: false, message: 'Failed to update client', error: error.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, message: 'Failed to delete client', error: error.message });
  }
});

// Services routes
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find({});
    res.json({ success: true, services, count: services.length });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json({ success: true, service: savedService });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service', error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service', error: error.message });
  }
});

// Seller settings routes
app.get('/api/seller-settings', async (req, res) => {
  try {
    const sellerSettings = await SellerSettings.find({});
    res.json({ success: true, sellerSettings, count: sellerSettings.length });
  } catch (error) {
    console.error('Error fetching seller settings:', error);
    res.status(500).json({ success: false, message: 'Failed to get seller settings', error: error.message });
  }
});

// FBR API settings routes
app.get('/api/fbr-api-settings', async (req, res) => {
  try {
    const fbrSettings = await FbrApiSettings.find({});
    res.json({ success: true, fbrSettings, count: fbrSettings.length });
  } catch (error) {
    console.error('Error fetching FBR API settings:', error);
    res.status(500).json({ success: false, message: 'Failed to get FBR API settings', error: error.message });
  }
});

// FBR Auth routes
app.get('/api/fbr-auth/status', async (req, res) => {
  try {
    // Simple status check
    res.json({ 
      success: true, 
      isAuthenticated: false, 
      sellerInfo: null, 
      message: 'Seller is not authenticated with FBR' 
    });
  } catch (error) {
    console.error('Error checking FBR auth status:', error);
    res.status(500).json({ success: false, message: 'Failed to check FBR auth status', error: error.message });
  }
});

// Invoice routes
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({}).populate('buyerId');
    res.json({ success: true, invoices, count: invoices.length });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices', error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const newInvoice = new Invoice(req.body);
    const savedInvoice = await newInvoice.save();
    res.status(201).json({ success: true, invoice: savedInvoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to create invoice', error: error.message });
  }
});

// FBR e-Invoicing routes
app.get('/api/fbrinvoices/pending', async (req, res) => {
  try {
    const pendingInvoices = await FbrInvoice.find({ status: 'pending' }).populate('invoiceId');
    res.json({ success: true, pendingInvoices, count: pendingInvoices.length });
  } catch (error) {
    console.error('Error fetching pending FBR invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending invoices', error: error.message });
  }
});

app.get('/api/fbrinvoices/submissions', async (req, res) => {
  try {
    const submittedInvoices = await FbrInvoice.find({ status: 'submitted' }).populate('invoiceId');
    res.json({ success: true, submittedInvoices, count: submittedInvoices.length });
  } catch (error) {
    console.error('Error fetching submitted FBR invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to get submitted invoices', error: error.message });
  }
});

// Tasks routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json({ success: true, tasks, count: tasks.length });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();
    res.status(201).json({ success: true, task: savedTask });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
});

// Users routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json({ success: true, user: savedUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
});

// Role templates endpoint
app.get('/api/users/meta/role-templates', async (req, res) => {
  try {
    const roleTemplates = {
      admin: {
        label: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: ['manage_users', 'system_settings', 'view_clients', 'manage_clients', 'view_invoices', 'manage_invoices', 'view_services', 'manage_services', 'fbr_submission', 'view_dashboard']
      },
      consultant: {
        label: 'Consultant',
        description: 'Limited access for tax consultancy work',
        permissions: ['view_clients', 'manage_clients', 'view_invoices', 'manage_invoices', 'view_services', 'fbr_submission', 'view_dashboard']
      },
      client: {
        label: 'Client',
        description: 'Basic access for viewing own data',
        permissions: ['view_own_invoices', 'view_own_data', 'download_documents']
      }
    };
    res.json({ success: true, roleTemplates });
  } catch (error) {
    console.error('Error fetching role templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch role templates', error: error.message });
  }
});

// Dashboard stats route
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [clients, invoices, tasks, pendingFbr] = await Promise.all([
      Client.countDocuments(),
      Invoice.countDocuments(),
      Task.countDocuments(),
      FbrInvoice.countDocuments({ status: 'pending' })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalClients: clients,
        totalInvoices: invoices,
        totalTasks: tasks,
        pendingFbrInvoices: pendingFbr
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
});

// Export routes
app.get('/api/export/excel', async (req, res) => {
  try {
    // Fetch actual data from database
    const invoices = await Invoice.find({}).populate('buyerId');
    const clients = await Client.find({});
    const fbrInvoices = await FbrInvoice.find({}).populate('invoiceId');
    
    // Create CSV headers
    const headers = [
      'Invoice #',
      'Product',
      'Units/Quantity',
      'Unit Price',
      'Total Value',
      'Sales Tax',
      'Extra Tax',
      'Final Value',
      'Date',
      'Client Name',
      'Client NTN',
      'Client STRN',
      'FBR Status',
      'FBR Reference'
    ];
    
    // Convert data to CSV rows
    const csvRows = invoices.map(invoice => {
      const client = clients.find(c => c._id.toString() === invoice.buyerId?._id?.toString());
      const fbrInvoice = fbrInvoices.find(f => f.invoiceId?.toString() === invoice._id.toString());
      
      return [
        invoice.invoiceNumber || invoice.invoiceNo || '',
        invoice.product || '',
        invoice.units || '',
        invoice.unitPrice || '',
        invoice.totalValue || '',
        invoice.salesTax || '',
        invoice.extraTax || '',
        invoice.finalValue || '',
        invoice.date ? new Date(invoice.date).toLocaleDateString() : '',
        client?.companyName || '',
        client?.buyerNTN || '',
        client?.buyerSTRN || '',
        fbrInvoice?.status || 'Not Submitted',
        fbrInvoice?.fbrReference || ''
      ].map(field => `"${field}"`).join(',');
    });
    
    // Combine headers and data
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error generating CSV export:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate CSV export', 
      error: error.message 
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tax Nexus Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

module.exports = app; 