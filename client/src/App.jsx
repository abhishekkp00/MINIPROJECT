/**
 * Main Application Component
 * Root component with routing and layout
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import ConnectionTest from './pages/ConnectionTest';

function App() {
  useEffect(() => {
    // Log environment info on mount
    console.log('🚀 App Mode:', import.meta.env.MODE);
    console.log('📡 API URL:', import.meta.env.VITE_API_URL || 'Using proxy');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Application Routes */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test-connection" element={<ConnectionTest />} />
        
        {/* Protected Routes - Require Authentication */}
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/projects/:projectId" element={<ProtectedRoute element={<ProjectDetails />} />} />
        
        {/* Protected Routes with Role Requirements */}
        {/* <Route 
          path="/admin" 
          element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />} 
        /> */}
        
        {/* <Route 
          path="/mentor-panel" 
          element={<ProtectedRoute element={<MentorPanel />} requiredRole="mentor" />} 
        /> */}
        
        {/* <Route 
          path="/manage" 
          element={<ProtectedRoute element={<ManagePage />} requiredRole={["mentor", "team-lead"]} />} 
        /> */}
        
        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

/**
 * NotFound Component
 * 404 Page displayed for invalid routes
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            404
          </h1>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default App;
