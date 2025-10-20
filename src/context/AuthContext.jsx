import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const isRefreshingRef = useRef(false);
  const failedQueueRef = useRef([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Set up axios interceptors for token refresh
  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Request interceptor - add token to requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Always include credentials for cookies (refresh token)
        config.withCredentials = true;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh on 401
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshingRef.current) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              failedQueueRef.current.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axios(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshingRef.current = true;

          try {
            // Try to refresh the token
            const response = await axios.post(
              `${API_URL}/api/auth/refresh`,
              {},
              { withCredentials: true }
            );

            const newToken = response.data.token;
            localStorage.setItem('token', newToken);
            setToken(newToken);

            // Process queued requests
            failedQueueRef.current.forEach((prom) => {
              prom.resolve(newToken);
            });
            failedQueueRef.current = [];

            // Retry original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            failedQueueRef.current.forEach((prom) => {
              prom.reject(refreshError);
            });
            failedQueueRef.current = [];
            logout();
            return Promise.reject(refreshError);
          } finally {
            isRefreshingRef.current = false;
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      const { token, ...userData } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { name, email, password, role },
        { withCredentials: true }
      );
      const { token, ...userData } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to revoke refresh token
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of backend call success
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDeveloper: user?.role === 'developer',
    isDeveloperOrAdmin: user?.role === 'admin' || user?.role === 'developer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
