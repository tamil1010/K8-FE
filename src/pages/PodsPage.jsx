import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState, EmptyState } from '../components/ErrorState';
import { RefreshCw, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export const PodsPage = () => {
  const { namespace, searchQuery } = useDashboard();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchPods = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPods(namespace, searchQuery);
      setPods(data);
      setCurrentPage(1); // reset to first page on query/namespace change
    } catch (err) {
      setError('Failed to fetch pod resources from cluster API.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPods(true);
  }, [namespace, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPods(false);
  };

  // Pagination details
  const totalPages = Math.ceil(pods.length / itemsPerPage);
  const paginatedPods = pods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CrashLoopBackOff':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchPods(true)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pods</h1>
          <p className="text-sm text-gray-500">Pods running workloads inside namespaces</p>
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
        <TableSkeleton rows={8} cols={8} />
      ) : pods.length === 0 ? (
        <EmptyState 
          title="No Pods Found" 
          message="No active Pods match the selected Namespace filter or search query." 
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pod Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Node</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Restarts</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CPU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Memory</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedPods.map((pod) => (
                  <tr key={pod.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700 font-mono">
                      {pod.name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {pod.namespace}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(pod.status)}`}>
                        {pod.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {pod.node}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                      {pod.restarts}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium font-mono text-gray-600">
                      {pod.cpu}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium font-mono text-gray-600">
                      {pod.memory}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {pod.age}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing Page <span className="font-semibold text-gray-700">{currentPage}</span> of <span className="font-semibold text-gray-700">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
