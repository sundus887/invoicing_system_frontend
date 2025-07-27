# Backend Setup Guide

Since your frontend is trying to connect to a backend that doesn't have the required endpoints, here are your options:

## Option 1: Create a Simple Express Backend

Create a new directory for your backend and set up a simple Express server:

```bash
mkdir consultancy-backend
cd consultancy-backend
npm init -y
npm install express cors
```

Create `server.js`:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
let clients = [
  {
    id: 1,
    name: "John Doe",
    cnic: "12345-1234567-1",
    company: "ABC Corp",
    ntn: "1234567-8",
    strn: "32-77-1234",
    email: "john@example.com",
    phone: "+92-300-1234567",
    address: "123 Main St, Karachi",
    registeredDate: "2024-01-15"
  }
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
  }
];

// Routes
app.get('/clients', (req, res) => {
  res.json(clients);
});

app.post('/clients', (req, res) => {
  const newClient = {
    id: clients.length + 1,
    ...req.body
  };
  clients.push(newClient);
  res.status(201).json(newClient);
});

app.get('/services', (req, res) => {
  res.json(services);
});

app.post('/services', (req, res) => {
  const newService = {
    id: services.length + 1,
    ...req.body
  };
  services.push(newService);
  res.status(201).json(newService);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Option 2: Update Frontend to Use Local Backend

If you create the local backend above, update your `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/
```

## Option 3: Use JSON Server (Quick Mock)

Install JSON Server globally:

```bash
npm install -g json-server
```

Create `db.json`:

```json
{
  "clients": [
    {
      "id": 1,
      "name": "John Doe",
      "cnic": "12345-1234567-1",
      "company": "ABC Corp",
      "ntn": "1234567-8",
      "strn": "32-77-1234",
      "email": "john@example.com",
      "phone": "+92-300-1234567",
      "address": "123 Main St, Karachi",
      "registeredDate": "2024-01-15"
    }
  ],
  "services": [
    {
      "id": 1,
      "name": "Tax Filing",
      "type": "Taxation",
      "description": "Annual tax return filing",
      "price": "5000",
      "duration": "1 week",
      "status": "Active"
    }
  ]
}
```

Run JSON Server:

```bash
json-server --watch db.json --port 5000
```

Then update your `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/
```

## Testing the Connection

After setting up any of the above options:

1. Start your backend server
2. Create a `.env` file in your React project root with the correct API URL
3. Restart your React development server
4. Test the connection by visiting the Services or Clients page

The error messages should disappear and you should see the mock data displayed. 