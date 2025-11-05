import { useState } from 'react';
import axios from 'axios';

/**
 * ConnectionTest Component
 * Test page to verify frontend-backend connection
 */
const ConnectionTest = () => {
  const [results, setResults] = useState({
    health: null,
    login: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Test health endpoint
  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/health`);
      setResults((prev) => ({
        ...prev,
        health: { success: true, data: response.data },
        error: null,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        health: { success: false, error: error.message },
        error: error.message,
      }));
    }
    setLoading(false);
  };

  // Test login endpoint
  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: 'testuser@example.com',
        password: 'password123',
      });
      setResults((prev) => ({
        ...prev,
        login: { success: true, data: response.data },
        error: null,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        login: {
          success: false,
          error: error.response?.data || error.message,
        },
        error: error.message,
      }));
    }
    setLoading(false);
  };

  // Test proxy endpoint
  const testProxy = async () => {
    setLoading(true);
    try {
      // Using relative URL to test Vite proxy
      const response = await axios.get('/api/health');
      setResults((prev) => ({
        ...prev,
        health: { success: true, data: response.data, via: 'Proxy' },
        error: null,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        health: {
          success: false,
          error: error.message,
          via: 'Proxy (failed)',
        },
        error: error.message,
      }));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🔗 Connection Test
            </h1>
            <p className="text-gray-300">
              Test frontend-backend connectivity
            </p>
          </div>

          {/* Configuration Info */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">
              Configuration
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Frontend:</span>
                <span className="text-blue-400">
                  {window.location.origin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">API URL:</span>
                <span className="text-blue-400">{API_URL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Environment:</span>
                <span className="text-blue-400">
                  {import.meta.env.MODE}
                </span>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testHealth}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Health (Direct)'}
            </button>
            <button
              onClick={testProxy}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Health (Proxy)'}
            </button>
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Testing...' : 'Test Login'}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Health Check Result */}
            {results.health && (
              <div
                className={`p-4 rounded-lg border ${
                  results.health.success
                    ? 'bg-green-500 bg-opacity-10 border-green-500'
                    : 'bg-red-500 bg-opacity-10 border-red-500'
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    results.health.success ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  Health Check {results.health.via && `(${results.health.via})`}
                </h3>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(
                    results.health.success
                      ? results.health.data
                      : results.health.error,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Login Test Result */}
            {results.login && (
              <div
                className={`p-4 rounded-lg border ${
                  results.login.success
                    ? 'bg-green-500 bg-opacity-10 border-green-500'
                    : 'bg-red-500 bg-opacity-10 border-red-500'
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    results.login.success ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  Login Test
                </h3>
                <pre className="text-xs text-gray-300 overflow-auto max-h-64">
                  {JSON.stringify(
                    results.login.success
                      ? {
                          user: results.login.data.data?.user,
                          hasToken: !!results.login.data.data?.token,
                        }
                      : results.login.error,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {/* Error Display */}
            {results.error && (
              <div className="p-4 rounded-lg border bg-red-500 bg-opacity-10 border-red-500">
                <h3 className="font-semibold text-red-400 mb-2">Error</h3>
                <p className="text-sm text-red-300">{results.error}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">
              📋 How to Test
            </h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Click "Test Health (Direct)" to test direct API connection</li>
              <li>
                Click "Test Health (Proxy)" to test Vite proxy configuration (✅ Recommended)
              </li>
              <li>Click "Test Login" to test authentication endpoint</li>
              <li>Check results below each test</li>
              <li>Green = Success, Red = Failed</li>
            </ol>
            <div className="mt-3 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded">
              <p className="text-xs text-yellow-300">
                <strong>Note:</strong> The app now uses Vite proxy by default in development mode. 
                Direct calls may fail due to CORS, but proxy calls should work. This is normal and expected!
              </p>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
