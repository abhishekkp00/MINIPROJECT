import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute Component
 * Wrapper component for protecting routes that require authentication
 * Supports role-based access control
 * 
 * @param {Object} props
 * @param {JSX.Element} props.element - The component to render if authenticated
 * @param {string|string[]} props.requiredRole - Required role(s) to access the route
 * @param {JSX.Element} props.fallback - Custom component to show during loading
 * 
 * @example
 * // Basic usage - just authentication required
 * <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
 * 
 * @example
 * // With role requirement
 * <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />} />
 * 
 * @example
 * // With multiple allowed roles
 * <Route path="/manage" element={<ProtectedRoute element={<ManagePage />} requiredRole={["mentor", "team-lead"]} />} />
 */
const ProtectedRoute = ({ element, requiredRole, fallback }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // Save the location user was trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole) {
    const hasRequiredRole = checkRole(user.role, requiredRole);
    
    if (!hasRequiredRole) {
      return <AccessDenied userRole={user.role} requiredRole={requiredRole} />;
    }
  }

  // User is authenticated and has required role (if specified)
  return element;
};

/**
 * Check if user has the required role
 * @param {string} userRole - User's current role
 * @param {string|string[]} requiredRole - Required role(s)
 * @returns {boolean}
 */
const checkRole = (userRole, requiredRole) => {
  if (!userRole) return false;

  // If requiredRole is an array, check if user role is in the array
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole.toLowerCase());
  }

  // If requiredRole is a string, check exact match
  return userRole.toLowerCase() === requiredRole.toLowerCase();
};

/**
 * LoadingSpinner Component
 * Displayed while checking authentication status
 */
const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative inline-flex">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Verifying Access
          </h2>
          <p className="text-gray-400 animate-pulse">
            Please wait while we check your credentials...
          </p>
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center items-center space-x-2 mt-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

/**
 * AccessDenied Component
 * Displayed when user doesn't have the required role
 */
const AccessDenied = ({ userRole, requiredRole }) => {
  const requiredRoleText = Array.isArray(requiredRole) 
    ? requiredRole.join(', ') 
    : requiredRole;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center border-4 border-red-500 animate-pulse">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Access Denied
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            You don't have permission to view this page.
          </p>

          {/* Role Information */}
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-red-500 border-opacity-30 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Your Role:</span>
                <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded-full text-sm font-medium border border-blue-500 border-opacity-30">
                  {userRole || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Required Role:</span>
                <span className="px-3 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded-full text-sm font-medium border border-red-500 border-opacity-30">
                  {requiredRoleText}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 text-base font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Dashboard
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-gray-400">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;

/**
 * Helper function to create protected routes easily
 * 
 * @example
 * import { createProtectedRoute } from './components/Common/ProtectedRoute';
 * 
 * const routes = [
 *   createProtectedRoute('/dashboard', Dashboard),
 *   createProtectedRoute('/admin', AdminPanel, 'admin'),
 *   createProtectedRoute('/manage', ManagePage, ['mentor', 'team-lead'])
 * ];
 */
export const createProtectedRoute = (path, Component, requiredRole = null) => ({
  path,
  element: <ProtectedRoute element={<Component />} requiredRole={requiredRole} />,
});
