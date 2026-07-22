import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';
import { ShieldAlert, Users, Key, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

export const RbacPage = () => {
  const { namespace, refreshTrigger } = useDashboard();
  
  const [rbacData, setRbacData] = useState({ roles: [], bindings: [], serviceAccounts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'bindings' | 'sas'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRbacData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await apiService.getRbacData(namespace);
      setRbacData({
        roles: data.roles || [],
        bindings: data.bindings || [],
        serviceAccounts: data.serviceAccounts || []
      });
    } catch (err) {
      setError('Failed to fetch RBAC security parameters.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRbacData(true);
  }, [namespace, refreshTrigger]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRbacData(false);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchRbacData(true)} />;
  }

  // Pick data and details based on active tab
  const getActiveTableData = () => {
    switch (activeTab) {
      case 'bindings':
        return {
          title: 'Role Bindings',
          headers: ['RoleBinding Name', 'Namespace', 'Created Date', 'Subject & Role Ref'],
          rows: rbacData.bindings.map(b => ({
            name: b.name,
            namespace: b.namespace,
            date: b.createdDate,
            perms: b.permissions
          }))
        };
      case 'sas':
        return {
          title: 'Service Accounts',
          headers: ['ServiceAccount Name', 'Namespace', 'Created Date', 'Associated Secrets'],
          rows: rbacData.serviceAccounts.map(sa => ({
            name: sa.name,
            namespace: sa.namespace,
            date: sa.createdDate,
            perms: sa.permissions
          }))
        };
      case 'roles':
      default:
        return {
          title: 'Cluster Roles',
          headers: ['Role Name', 'Namespace', 'Created Date', 'Permissions (Rules)'],
          rows: rbacData.roles.map(r => ({
            name: r.name,
            namespace: r.namespace,
            date: r.createdDate,
            perms: r.permissions
          }))
        };
    }
  };

  const activeTable = getActiveTableData();

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role-Based Access Control (RBAC)</h1>
          <p className="text-sm text-gray-500">Configure cluster authorization rules, bindings, and identities</p>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white rounded border animate-pulse"></div>
            <div className="h-32 bg-white rounded border animate-pulse"></div>
            <div className="h-32 bg-white rounded border animate-pulse"></div>
          </div>
          <TableSkeleton rows={5} cols={4} />
        </>
      ) : (
        <>
          {/* RBAC Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Roles Card */}
            <div className={`bg-white rounded border shadow-sm p-5 transition-all flex flex-col justify-between
              ${activeTab === 'roles' ? 'ring-2 ring-k8s-blue border-transparent' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Roles</h3>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{rbacData.roles.length}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded text-k8s-blue">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full py-1.5 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1.5
                  ${activeTab === 'roles' 
                    ? 'bg-k8s-blue text-white border-transparent' 
                    : 'bg-white text-k8s-blue border-gray-300 hover:bg-gray-50'}`}
              >
                <ExternalLink className="w-3 h-3" />
                View Details
              </button>
            </div>

            {/* RoleBindings Card */}
            <div className={`bg-white rounded border shadow-sm p-5 transition-all flex flex-col justify-between
              ${activeTab === 'bindings' ? 'ring-2 ring-k8s-blue border-transparent' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Role Bindings</h3>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{rbacData.bindings.length}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded text-emerald-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab('bindings')}
                className={`w-full py-1.5 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1.5
                  ${activeTab === 'bindings' 
                    ? 'bg-k8s-blue text-white border-transparent' 
                    : 'bg-white text-k8s-blue border-gray-300 hover:bg-gray-50'}`}
              >
                <ExternalLink className="w-3 h-3" />
                View Details
              </button>
            </div>

            {/* Service Accounts Card */}
            <div className={`bg-white rounded border shadow-sm p-5 transition-all flex flex-col justify-between
              ${activeTab === 'sas' ? 'ring-2 ring-k8s-blue border-transparent' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Service Accounts</h3>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{rbacData.serviceAccounts.length}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded text-purple-500">
                  <Key className="w-5 h-5" />
                </div>
              </div>
              <button
                onClick={() => setActiveTab('sas')}
                className={`w-full py-1.5 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1.5
                  ${activeTab === 'sas' 
                    ? 'bg-k8s-blue text-white border-transparent' 
                    : 'bg-white text-k8s-blue border-gray-300 hover:bg-gray-50'}`}
              >
                <ExternalLink className="w-3 h-3" />
                View Details
              </button>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-700 tracking-wide uppercase">
                Detailed View: {activeTable.title}
              </h2>
            </div>
            {activeTable.rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-medium">
                No RBAC assets found for this namespace filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                        {activeTable.headers[0]}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">
                        {activeTable.headers[1]}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">
                        {activeTable.headers[2]}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                        {activeTable.headers[3]}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activeTable.rows.map((row, idx) => (
                      <tr key={row.name + idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700 font-mono">
                          {row.name}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                          {row.namespace}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(row.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-600 font-mono truncate max-w-xs">
                          {row.perms}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
