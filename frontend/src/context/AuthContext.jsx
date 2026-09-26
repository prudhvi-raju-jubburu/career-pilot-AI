import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginUser as apiLogin, registerUser as apiRegister } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      if (response?.success && response?.data?.user) {
        setUser(response.data.user);
      } else {
        // Invalid or expired token
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    const response = await apiLogin({ email, password });
    if (response?.success && response?.data?.token) {
      const authToken = response.data.token;
      const authUser = response.data.user;
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(authUser);
      return authUser;
    }
    throw new Error(response?.message || 'Login failed');
  };

  // Register handler
  const register = async (name, email, password) => {
    const response = await apiRegister({ name, email, password });
    if (response?.success && response?.data?.token) {
      const authToken = response.data.token;
      const authUser = response.data.user;
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(authUser);
      return authUser;
    }
    throw new Error(response?.message || 'Registration failed');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
