import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState, EmptyState } from '../components/ErrorState';
import { RefreshCw } from 'lucide-react';

export const NodesPage = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNodes = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getNodes();
      setNodes(data);
    } catch (err) {
      setError('Failed to fetch node resources from cluster API.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNodes(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNodes(false);
  };

  const getStatusBadge = (status) => {
    return status === 'Ready'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-k8s-blue';
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
          <p className="text-sm text-gray-500">Physical/Virtual machines providing compute capacity to the cluster</p>
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
        <TableSkeleton rows={4} cols={7} />
      ) : nodes.length === 0 ? (
        <EmptyState 
          title="No Nodes Found" 
          message="No active Nodes are registered with the cluster manager." 
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Node Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">CPU Allocation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">Memory Allocation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pods Running</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">K8s Version</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Operating System</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {nodes.map((node) => (
                  <tr key={node.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700 font-mono">
                      {node.name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(node.status)}`}>
                        {node.status}
                      </span>
                    </td>
                    {/* CPU Usage progress bar */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(node.cpuPercent)}`}
                            style={{ width: `${node.cpuPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-gray-600">{node.cpuPercent}%</span>
                      </div>
                    </td>
                    {/* Memory Usage progress bar */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(node.memoryPercent)}`}
                            style={{ width: `${node.memoryPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-gray-600">{node.memoryPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                      {node.runningPods} Pods
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {node.version}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {node.os}
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
