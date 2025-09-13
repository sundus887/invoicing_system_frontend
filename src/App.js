import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from "./routes";

function App() {
  useEffect(() => {
    const prefetch = () => {
      // Prefetch commonly visited pages in the background
      // These match the lazy import paths in src/routes/index.js
      import(/* webpackPrefetch: true, webpackChunkName: "page-dashboard" */ './pages/Dashboard');
      import(/* webpackPrefetch: true, webpackChunkName: "page-invoices" */ './pages/Invoices');
      import(/* webpackPrefetch: true, webpackChunkName: "page-clients" */ './pages/Clients');
      import(/* webpackPrefetch: true, webpackChunkName: "page-settings" */ './pages/Settings');
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(prefetch, 2000);
      return () => window.clearTimeout(id);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;