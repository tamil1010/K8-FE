import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState, EmptyState } from '../components/ErrorState';
import { RefreshCw } from 'lucide-react';

export const ServicesPage = () => {
  const { namespace, searchQuery } = useDashboard();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchServices = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getServices(namespace, searchQuery);
      setServices(data);
    } catch (err) {
      setError('Failed to fetch service resources from cluster API.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices(true);
  }, [namespace, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchServices(false);
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'ClusterIP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NodePort':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LoadBalancer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchServices(true)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500">Service entrypoints expose applications inside and outside the cluster</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin text-k8s-blue' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : services.length === 0 ? (
        <EmptyState 
          title="No Services Found" 
          message="No active Services match the selected Namespace filter or search query." 
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cluster IP</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">External IP</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ports</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {services.map((svc) => (
                  <tr key={svc.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700 font-mono">
                      {svc.name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {svc.namespace}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getTypeBadgeColor(svc.type)}`}>
                        {svc.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {svc.clusterIP}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700 font-mono">
                      {svc.externalIP}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {svc.ports}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {svc.age}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
