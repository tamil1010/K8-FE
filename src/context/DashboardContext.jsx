import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../ApiCall/Api';
import { useToast } from './ToastContext';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const { addToast } = useToast();
  const [namespace, setNamespace] = useState('All Namespaces');
  const [searchQuery, setSearchQuery] = useState('');
  const [clusters, setClusters] = useState([]);
  const [currentCluster, setCurrentCluster] = useState('');
  const [clusterDetails, setClusterDetails] = useState(null);
  const [isSwitchingCluster, setIsSwitchingCluster] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const namespaces = ['All Namespaces', 'default', 'production', 'staging', 'kube-system'];

  const resetSearch = () => setSearchQuery('');

  const refreshAll = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch clusters and current active context
  const loadClusterData = useCallback(async (initialLoad = false) => {
    const token = localStorage.getItem('k8s_token');
    if (!token) return;

    try {
      const clustersRes = await API.get('/clusters');
      const availableClusters = clustersRes.data?.data || [];
      setClusters(availableClusters);

      const currentRes = await API.get('/clusters/current');
      const activeDetails = currentRes.data?.data;
      if (activeDetails) {
        setClusterDetails(activeDetails);
        setCurrentCluster(activeDetails.name);

        if (initialLoad) {
          const lastCluster = localStorage.getItem('k8s_last_cluster');
          if (lastCluster && lastCluster !== activeDetails.name && availableClusters?.some(c => c.name === lastCluster)) {
            await performSwitch(lastCluster, true);
          } else {
            localStorage.setItem('k8s_last_cluster', activeDetails.name);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load clusters:', err);
    }
  }, []);

  const performSwitch = async (contextName, silent = false) => {
    setIsSwitchingCluster(true);
    try {
      await API.post('/clusters/switch', { context: contextName });
      localStorage.setItem('k8s_last_cluster', contextName);
      setCurrentCluster(contextName);
      
      const currentRes = await API.get('/clusters/current');
      const activeDetails = currentRes.data?.data;
      setClusterDetails(activeDetails);

      if (!silent) {
        addToast(`Connected to ${contextName}`, 'success');
      }
      refreshAll();
    } catch (err) {
      if (!silent) {
        addToast(`Failed to switch cluster`, 'error');
      }
      console.error('Failed to switch cluster:', err);
    } finally {
      setIsSwitchingCluster(false);
    }
  };

  useEffect(() => {
    loadClusterData(true);
  }, []);

  const handleSwitchCluster = async (contextName) => {
    await performSwitch(contextName, false);
  };

  return (
    <DashboardContext.Provider value={{
      namespace,
      setNamespace,
      searchQuery,
      setSearchQuery,
      namespaces,
      resetSearch,
      clusters,
      currentCluster,
      clusterDetails,
      isSwitchingCluster,
      refreshTrigger,
      refreshAll,
      switchCluster: handleSwitchCluster
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
