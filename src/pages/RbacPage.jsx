import React, { useState, useEffect, useMemo } from 'react';
import API from '../ApiCall/Api';
import { useDashboard } from '../context/DashboardContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState, EmptyState } from '../components/ErrorState';
import { 
  ShieldAlert, 
  Users, 
  Key, 
  ExternalLink, 
  Calendar, 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  FileCode, 
  Edit3, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';

import { rbacApi } from '../services/rbacApi';
import { CreateRoleModal } from '../components/rbac/CreateRoleModal';
import { CreateRoleBindingModal } from '../components/rbac/CreateRoleBindingModal';
import { CreateServiceAccountModal } from '../components/rbac/CreateServiceAccountModal';
import { RbacDetailsDrawer } from '../components/rbac/RbacDetailsDrawer';
import { RbacYamlModal } from '../components/rbac/RbacYamlModal';
import { EditRbacModal } from '../components/rbac/EditRbacModal';
import { DeleteRbacModal } from '../components/rbac/DeleteRbacModal';

export const RbacPage = () => {
  const { namespace: dashboardNamespace, searchQuery: dashboardSearch, refreshTrigger } = useDashboard();
  
  const [rbacData, setRbacData] = useState({ roles: [], bindings: [], serviceAccounts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active resource tab / filter: 'roles' | 'bindings' | 'sas' (or 'all')
  const [activeTab, setActiveTab] = useState('roles');
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('All Namespaces');
  const [selectedResourceType, setSelectedResourceType] = useState('roles'); // 'roles', 'bindings', 'sas'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'date-newest', 'date-oldest'

  // Modal / Drawer state
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateBindingOpen, setIsCreateBindingOpen] = useState(false);
  const [isCreateSaOpen, setIsCreateSaOpen] = useState(false);

  const [selectedResourceForDetails, setSelectedResourceForDetails] = useState(null);
  const [selectedResourceForYaml, setSelectedResourceForYaml] = useState(null);
  const [selectedResourceForEdit, setSelectedResourceForEdit] = useState(null);
  const [selectedResourceForDelete, setSelectedResourceForDelete] = useState(null);
  const [activeModalType, setActiveModalType] = useState('roles'); // 'roles' | 'bindings' | 'sas'

  // Sync dashboard navbar search & namespace
  useEffect(() => {
    if (dashboardSearch !== undefined) setSearchTerm(dashboardSearch);
  }, [dashboardSearch]);

  useEffect(() => {
    if (dashboardNamespace) setSelectedNamespace(dashboardNamespace);
  }, [dashboardNamespace]);

  // Sync selectedResourceType filter with activeTab
  useEffect(() => {
    setActiveTab(selectedResourceType);
  }, [selectedResourceType]);

  const fetchRbacData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const [rolesData, bindingsData, sasData] = await Promise.all([
        rbacApi.getRoles(),
        rbacApi.getRoleBindings(),
        rbacApi.getServiceAccounts()
      ]);
      
      setRbacData({
        roles: rolesData || [],
        bindings: bindingsData || [],
        serviceAccounts: sasData || []
      });
    } catch (err) {
      setError('Failed to fetch RBAC security parameters.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and trigger on global refreshTrigger
  useEffect(() => {
    fetchRbacData(true);
  }, [refreshTrigger]);

  // Requirement #1: Auto refresh summary cards and table data every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRbacData(false);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRbacData(false);
  };

  // Distinct namespaces for dropdown filter
  const availableNamespaces = useMemo(() => {
    const set = new Set();
    [...rbacData.roles, ...rbacData.bindings, ...rbacData.serviceAccounts].forEach(i => {
      if (i.namespace) set.add(i.namespace);
    });
    ['default', 'kube-system', 'production', 'staging'].forEach(ns => set.add(ns));
    return ['All Namespaces', ...Array.from(set)];
  }, [rbacData]);

  // Generic filter & sort function
  const filterAndSort = (items) => {
    return items
      .filter(item => {
        // Namespace filter
        if (selectedNamespace !== 'All Namespaces' && item.namespace !== selectedNamespace) {
          return false;
        }
        // Search term by Name
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = item.name?.toLowerCase().includes(q);
          const matchNs = item.namespace?.toLowerCase().includes(q);
          if (!matchName && !matchNs) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        const timeA = new Date(a.createdDate || a.date || 0).getTime();
        const timeB = new Date(b.createdDate || b.date || 0).getTime();
        return sortBy === 'date-newest' ? timeB - timeA : timeA - timeB;
      });
  };

  const filteredRoles = useMemo(() => filterAndSort(rbacData.roles), [rbacData.roles, selectedNamespace, searchTerm, sortBy]);
  const filteredBindings = useMemo(() => filterAndSort(rbacData.bindings), [rbacData.bindings, selectedNamespace, searchTerm, sortBy]);
  const filteredSas = useMemo(() => filterAndSort(rbacData.serviceAccounts), [rbacData.serviceAccounts, selectedNamespace, searchTerm, sortBy]);

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchRbacData(true)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Title block & Create / Refresh Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role-Based Access Control (RBAC)</h1>
          <p className="text-sm text-gray-500">Configure cluster authorization rules, bindings, and identities</p>
        </div>

        {/* Requirement #3: Create Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreateRoleOpen(true)}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded shadow-sm text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Role
          </button>

          <button
            onClick={() => setIsCreateBindingOpen(true)}
            className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded shadow-sm text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Binding
          </button>

          <button
            onClick={() => setIsCreateSaOpen(true)}
            className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded shadow-sm text-xs font-semibold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Service Account
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white rounded border animate-pulse"></div>
            <div className="h-32 bg-white rounded border animate-pulse"></div>
            <div className="h-32 bg-white rounded border animate-pulse"></div>
          </div>
          <TableSkeleton rows={5} cols={5} />
        </>
      ) : (
        <>
          {/* Requirement #1: Summary Cards (Auto-refresh every 10s) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Roles Summary Card */}
            <div 
              onClick={() => { setActiveTab('roles'); setSelectedResourceType('roles'); }}
              className={`bg-white rounded border shadow-sm p-5 transition-all cursor-pointer flex flex-col justify-between
                ${activeTab === 'roles' ? 'ring-2 ring-k8s-blue border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Roles</h3>
                  <p className="text-3xl font-extrabold text-gray-800 mt-1">{rbacData.roles.length}</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-400 text-[10px]">Refreshes every 10s</span>
                <span className={`font-bold flex items-center gap-1 ${activeTab === 'roles' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Select Table <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* RoleBindings Summary Card */}
            <div 
              onClick={() => { setActiveTab('bindings'); setSelectedResourceType('bindings'); }}
              className={`bg-white rounded border shadow-sm p-5 transition-all cursor-pointer flex flex-col justify-between
                ${activeTab === 'bindings' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role Bindings</h3>
                  <p className="text-3xl font-extrabold text-gray-800 mt-1">{rbacData.bindings.length}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-400 text-[10px]">Refreshes every 10s</span>
                <span className={`font-bold flex items-center gap-1 ${activeTab === 'bindings' ? 'text-emerald-600' : 'text-gray-500'}`}>
                  Select Table <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Service Accounts Summary Card */}
            <div 
              onClick={() => { setActiveTab('sas'); setSelectedResourceType('sas'); }}
              className={`bg-white rounded border shadow-sm p-5 transition-all cursor-pointer flex flex-col justify-between
                ${activeTab === 'sas' ? 'ring-2 ring-purple-500 border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Accounts</h3>
                  <p className="text-3xl font-extrabold text-gray-800 mt-1">{rbacData.serviceAccounts.length}</p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                  <Key className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                <span className="text-gray-400 text-[10px]">Refreshes every 10s</span>
                <span className={`font-bold flex items-center gap-1 ${activeTab === 'sas' ? 'text-purple-600' : 'text-gray-500'}`}>
                  Select Table <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Requirement #2: Search & Filters Bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center flex-1">
              {/* Search by Name */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              {/* Namespace Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <select
                  value={selectedNamespace}
                  onChange={e => setSelectedNamespace(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white font-medium text-gray-700"
                >
                  {availableNamespaces.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>

              {/* Resource Type Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-gray-500 font-semibold flex-shrink-0">Resource Type:</span>
                <select
                  value={selectedResourceType}
                  onChange={e => setSelectedResourceType(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white font-medium text-gray-700"
                >
                  <option value="roles">Roles</option>
                  <option value="bindings">RoleBindings</option>
                  <option value="sas">Service Accounts</option>
                </select>
              </div>
            </div>

            {/* Sort By Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 font-semibold flex-shrink-0">Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white font-medium text-gray-700"
              >
                <option value="name-asc">Name (A - Z)</option>
                <option value="name-desc">Name (Z - A)</option>
                <option value="date-newest">Created Date (Newest)</option>
                <option value="date-oldest">Created Date (Oldest)</option>
              </select>
            </div>
          </div>

          {/* Requirement #4 & #5: Improved Tables with Actions */}

          {/* TABLE 1: ROLES TABLE */}
          {activeTab === 'roles' && (
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  Roles & ClusterRoles ({filteredRoles.length})
                </h2>
              </div>

              {filteredRoles.length === 0 ? (
                <EmptyState title="No Roles Found" message="No active Roles match the selected Namespace filter or search query." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Number of Rules</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredRoles.map((role) => (
                        <tr key={role.name + role.namespace} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800 font-mono">
                            <button
                              onClick={() => { setSelectedResourceForDetails(role); setActiveModalType('roles'); }}
                              className="hover:text-blue-600 hover:underline text-left"
                            >
                              {role.name}
                            </button>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${role.namespace === 'Cluster Scope' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {role.namespace}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                            {new Date(role.createdDate || role.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-700 font-mono">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200 text-[10px]">
                              {role.rules?.length || role.rulesCount || 1} Rule(s)
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedResourceForDetails(role); setActiveModalType('roles'); }}
                                className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForYaml(role); setActiveModalType('roles'); }}
                                className="p-1.5 rounded hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors"
                                title="View YAML"
                              >
                                <FileCode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForEdit(role); setActiveModalType('roles'); }}
                                className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                                title="Edit Role"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForDelete(role); setActiveModalType('roles'); }}
                                className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete Role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TABLE 2: ROLE BINDINGS TABLE */}
          {activeTab === 'bindings' && (
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Role Bindings ({filteredBindings.length})
                </h2>
              </div>

              {filteredBindings.length === 0 ? (
                <EmptyState title="No RoleBindings Found" message="No active RoleBindings match the selected Namespace filter or search query." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredBindings.map((binding) => (
                        <tr key={binding.name + binding.namespace} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800 font-mono">
                            <button
                              onClick={() => { setSelectedResourceForDetails(binding); setActiveModalType('bindings'); }}
                              className="hover:text-emerald-600 hover:underline text-left"
                            >
                              {binding.name}
                            </button>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${binding.namespace === 'Cluster Scope' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {binding.namespace}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-purple-700 font-mono font-bold">
                            {binding.roleRef?.kind ? `${binding.roleRef.kind}/${binding.roleRef.name}` : (binding.permissions || 'Role/ref')}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-600 font-mono max-w-xs truncate">
                            {binding.subjects?.map(s => `${s.kind}:${s.name}`).join(', ') || 'ServiceAccount'}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                            {new Date(binding.createdDate || binding.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedResourceForDetails(binding); setActiveModalType('bindings'); }}
                                className="p-1.5 rounded hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForYaml(binding); setActiveModalType('bindings'); }}
                                className="p-1.5 rounded hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors"
                                title="View YAML"
                              >
                                <FileCode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForEdit(binding); setActiveModalType('bindings'); }}
                                className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                                title="Edit RoleBinding"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForDelete(binding); setActiveModalType('bindings'); }}
                                className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete RoleBinding"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TABLE 3: SERVICE ACCOUNTS TABLE */}
          {activeTab === 'sas' && (
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  Service Accounts ({filteredSas.length})
                </h2>
              </div>

              {filteredSas.length === 0 ? (
                <EmptyState title="No ServiceAccounts Found" message="No active ServiceAccounts match the selected Namespace filter or search query." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Secrets</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Labels</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredSas.map((sa) => (
                        <tr key={sa.name + sa.namespace} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800 font-mono">
                            <button
                              onClick={() => { setSelectedResourceForDetails(sa); setActiveModalType('sas'); }}
                              className="hover:text-purple-600 hover:underline text-left"
                            >
                              {sa.name}
                            </button>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                            {sa.namespace}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-gray-700">
                            {sa.secrets?.length || 1} Secret(s)
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-600 font-mono max-w-xs truncate">
                            {Object.keys(sa.labels || {}).length > 0 
                              ? Object.entries(sa.labels).map(([k, v]) => `${k}=${v}`).join(', ') 
                              : 'No labels'}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                            {new Date(sa.createdDate || sa.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-xs text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedResourceForDetails(sa); setActiveModalType('sas'); }}
                                className="p-1.5 rounded hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForYaml(sa); setActiveModalType('sas'); }}
                                className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                                title="View YAML"
                              >
                                <FileCode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForEdit(sa); setActiveModalType('sas'); }}
                                className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                                title="Edit ServiceAccount"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedResourceForDelete(sa); setActiveModalType('sas'); }}
                                className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete ServiceAccount"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* Creation Modals */}
      <CreateRoleModal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        namespaces={availableNamespaces}
        onSuccess={() => fetchRbacData(false)}
      />

      <CreateRoleBindingModal
        isOpen={isCreateBindingOpen}
        onClose={() => setIsCreateBindingOpen(false)}
        namespaces={availableNamespaces}
        onSuccess={() => fetchRbacData(false)}
      />

      <CreateServiceAccountModal
        isOpen={isCreateSaOpen}
        onClose={() => setIsCreateSaOpen(false)}
        namespaces={availableNamespaces}
        onSuccess={() => fetchRbacData(false)}
      />

      {/* Resource Modals & Drawers */}
      <RbacDetailsDrawer
        isOpen={!!selectedResourceForDetails}
        onClose={() => setSelectedResourceForDetails(null)}
        resourceType={activeModalType}
        item={selectedResourceForDetails}
      />

      <RbacYamlModal
        isOpen={!!selectedResourceForYaml}
        onClose={() => setSelectedResourceForYaml(null)}
        resourceType={activeModalType}
        item={selectedResourceForYaml}
      />

      <EditRbacModal
        isOpen={!!selectedResourceForEdit}
        onClose={() => setSelectedResourceForEdit(null)}
        resourceType={activeModalType}
        item={selectedResourceForEdit}
        onSuccess={() => fetchRbacData(false)}
      />

      <DeleteRbacModal
        isOpen={!!selectedResourceForDelete}
        onClose={() => setSelectedResourceForDelete(null)}
        resourceType={activeModalType}
        item={selectedResourceForDelete}
        onSuccess={() => fetchRbacData(false)}
      />

    </div>
  );
};
