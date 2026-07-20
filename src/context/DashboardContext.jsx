import React, { createContext, useContext, useState } from 'react';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const [namespace, setNamespace] = useState('All Namespaces');
  const [searchQuery, setSearchQuery] = useState('');
  
  const namespaces = ['All Namespaces', 'default', 'production', 'staging', 'kube-system'];

  const resetSearch = () => setSearchQuery('');

  return (
    <DashboardContext.Provider value={{
      namespace,
      setNamespace,
      searchQuery,
      setSearchQuery,
      namespaces,
      resetSearch
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
