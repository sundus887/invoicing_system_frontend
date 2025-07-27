# Consultancy Forum - Tax & Accounting Platform

A React-based business management application for tax and accounting services.

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
REACT_APP_API_URL=https://consultancy-backend-1xug.vercel.app/

# Development settings
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

## Troubleshooting

### API Connection Issues

If you're seeing 404 errors or "Failed to load services from backend" messages:

1. **Check Backend Status**: Verify that the backend API at `https://consultancy-backend-1xug.vercel.app/` is running and accessible.

2. **Verify Endpoints**: The backend should have the following endpoints:
   - `GET /clients` - Fetch all clients
   - `POST /clients` - Create a new client
   - `GET /services` - Fetch all services
   - `POST /services` - Create a new service

3. **Environment Variables**: Ensure your `.env` file is properly configured with `REACT_APP_API_URL`.

4. **CORS Issues**: If the backend is running locally, make sure CORS is properly configured.

### Common Error Solutions

- **"API URL: undefined"**: Create a `.env` file with `REACT_APP_API_URL`
- **404 Errors**: Check if the backend endpoints exist and are accessible
- **Network Errors**: Verify the backend URL is correct and the server is running

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (not recommended)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API and utility services
└── routes.js      # Application routing
```

## Features

- Client Management
- Service Management
- Invoice Generation
- Dashboard Analytics
- User Role Management
- FBR e-Invoicing Integration
