import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('k8s_authenticated') === 'true';
  });
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('k8s_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (username, password) => {
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      const userData = { username, role: 'ClusterAdmin' };
      setUser(userData);
      localStorage.setItem('k8s_authenticated', 'true');
      localStorage.setItem('k8s_user', JSON.stringify(userData));
      return true;
    } else {
      throw new Error('Invalid username or password');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('k8s_authenticated');
    localStorage.removeItem('k8s_user');
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
