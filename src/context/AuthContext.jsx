import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../ApiCall/Api';

const AuthContext = createContext(null);

// Helper to clear all auth-related localStorage keys
const clearAuthStorage = () => {
  localStorage.removeItem('k8s_authenticated');
  localStorage.removeItem('k8s_user');
  localStorage.removeItem('k8s_token');
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Only consider authenticated if BOTH the flag AND a JWT token exist
    const flag = localStorage.getItem('k8s_authenticated') === 'true';
    const token = localStorage.getItem('k8s_token');
    if (flag && !token) {
      // Stale session from old mock-only version — clear it immediately
      clearAuthStorage();
      return false;
    }
    return flag && !!token;
  });

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('k8s_user');
    const token = localStorage.getItem('k8s_token');
    // Only restore user if we also have a token
    return storedUser && token ? JSON.parse(storedUser) : null;
  });

  const login = async (username, password) => {
    const response = await API.post('/auth/login', { username, password });
    const res = response.data;
    if (res && res.success) {
      const { token, username: retUsername, role } = res.data;
      const userData = { username: retUsername, role };
      
      // Persist to storage BEFORE updating React state to avoid race conditions
      localStorage.setItem('k8s_authenticated', 'true');
      localStorage.setItem('k8s_token', token);
      localStorage.setItem('k8s_user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    } else {
      throw new Error(res?.message || 'Authentication failed');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
