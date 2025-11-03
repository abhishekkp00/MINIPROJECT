import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // API base URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Axios interceptor for handling token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Load user on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        await loadUser(storedToken);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Load user data from token
  const loadUser = async (authToken) => {
    try {
      setLoading(true);
      const token = authToken || localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch current user
      const response = await axios.get(`${API_URL}/auth/me`);

      if (response.data.success) {
        setUser(response.data.user);
        setToken(token);
        localStorage.setItem('token', token);
      }
    } catch (error) {
      console.error('Load user error:', error.response?.data?.message || error.message);
      // If token is invalid, clear it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data.data;

        // Save token to localStorage
        localStorage.setItem('token', token);
        setToken(token);

        // Save user to state
        setUser(user);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return { success: true, user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      console.error('Login error:', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (name, email, password, role = 'student') => {
    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role,
      });

      if (response.data.success) {
        const { token, user } = response.data.data;

        // Save token to localStorage
        localStorage.setItem('token', token);
        setToken(token);

        // Save user to state
        setUser(user);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return { success: true, user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      console.error('Signup error:', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API (optional - to invalidate token on server)
      if (token) {
        await axios.post(`${API_URL}/auth/logout`).catch(() => {
          // Ignore logout API errors
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Clear state
      setUser(null);
      setToken(null);

      // Remove axios default header
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Update user profile
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Context value
  const value = {
    user,
    loading,
    token,
    login,
    signup,
    logout,
    loadUser,
    updateUser,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
