/**
 * Main Entry Point
 * React application initialization with providers and global setup
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

// ==================== QUERY CLIENT SETUP ====================
// Configure React Query for server state management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Retry failed requests
      retry: 1,
      // Cache time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data for 10 minutes
      cacheTime: 10 * 60 * 1000,
    },
  },
});

// ==================== RENDER APPLICATION ====================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Router Provider */}
    <BrowserRouter>
      {/* Authentication Provider */}
      <AuthProvider>
        {/* React Query Provider */}
        <QueryClientProvider client={queryClient}>
          {/* Main Application */}
          <App />
        
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Default options
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
            // Success toast
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            // Error toast
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
            // Loading toast
            loading: {
              iconTheme: {
                primary: '#3B82F6',
                secondary: '#fff',
              },
            },
          }}
        />
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
