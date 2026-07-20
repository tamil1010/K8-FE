import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState, EmptyState } from '../components/ErrorState';
import { RefreshCw } from 'lucide-react';

export const DeploymentsPage = () => {
  const { namespace, searchQuery } = useDashboard();
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDeployments = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getDeployments(namespace, searchQuery);
      setDeployments(data);
    } catch (err) {
      setError('Failed to fetch deployment resources from cluster API.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeployments(true);
  }, [namespace, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeployments(false);
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'Healthy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Degraded':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Unhealthy':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchDeployments(true)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="text-sm text-gray-500">Deployments managed in the cluster workspace</p>
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
      ) : deployments.length === 0 ? (
        <EmptyState 
          title="No Deployments Found" 
          message="No active Deployments match the selected Namespace filter or search query." 
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deployment Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Replicas</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Health Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {deployments.map((deploy) => (
                  <tr key={deploy.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700 font-mono">
                      {deploy.name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {deploy.namespace}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                      {deploy.replicas}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                      {deploy.available}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                      {deploy.updated}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {deploy.age}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getHealthBadge(deploy.health)}`}>
                        {deploy.health}
                      </span>
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
