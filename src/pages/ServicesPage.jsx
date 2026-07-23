import React, { useState, useEffect, useMemo } from 'react';
import API from '../ApiCall/Api';
import { useDashboard } from '../context/DashboardContext';
import { TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState, EmptyState } from '../components/ErrorState';
import { 
  RefreshCw, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Globe, 
  Server, 
  Network, 
  Share2, 
  Link2, 
  Eye, 
  FileCode, 
  Edit3, 
  Trash2, 
  MoreVertical 
} from 'lucide-react';

import { serviceApi } from '../services/serviceApi';
import { CreateServiceModal } from '../components/services/CreateServiceModal';
import { ServiceDetailsDrawer } from '../components/services/ServiceDetailsDrawer';
import { ServiceYamlModal } from '../components/services/ServiceYamlModal';
import { EditServiceModal } from '../components/services/EditServiceModal';
import { DeleteServiceModal } from '../components/services/DeleteServiceModal';

export const ServicesPage = () => {
  const { namespace: dashboardNamespace, searchQuery: dashboardSearch, refreshTrigger } = useDashboard();
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('All Namespaces');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc', 'name-desc', 'age-newest', 'age-oldest'

  // Modal / Drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState(null);
  const [selectedServiceForYaml, setSelectedServiceForYaml] = useState(null);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null);
  const [selectedServiceForDelete, setSelectedServiceForDelete] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Sync dashboard search & namespace when they change from global navbar
  useEffect(() => {
    if (dashboardSearch !== undefined) setSearchTerm(dashboardSearch);
  }, [dashboardSearch]);

  useEffect(() => {
    if (dashboardNamespace) setSelectedNamespace(dashboardNamespace);
  }, [dashboardNamespace]);

  const fetchServices = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await serviceApi.getServices();
      setServices(data || []);
    } catch (err) {
      setError('Failed to fetch service resources from cluster API.');
    } fontally: {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and trigger on global refreshTrigger
  useEffect(() => {
    fetchServices(true);
  }, [refreshTrigger]);

  // Requirement #1 & #10: Auto-refresh every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchServices(false);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchServices(false);
  };

  // Compute summary stats dynamically from all services
  const summaryStats = useMemo(() => {
    const total = services.length;
    const clusterIP = services.filter(s => (s.type || 'ClusterIP') === 'ClusterIP').length;
    const nodePort = services.filter(s => s.type === 'NodePort').length;
    const loadBalancer = services.filter(s => s.type === 'LoadBalancer').length;
    const externalName = services.filter(s => s.type === 'ExternalName').length;

    return { total, clusterIP, nodePort, loadBalancer, externalName };
  }, [services]);

  // Extract all distinct namespaces for the filter dropdown
  const availableNamespaces = useMemo(() => {
    const set = new Set(services.map(s => s.namespace).filter(Boolean));
    ['default', 'kube-system', 'production', 'staging'].forEach(ns => set.add(ns));
    return ['All Namespaces', ...Array.from(set)];
  }, [services]);

  // Filter & Sort Services
  const filteredAndSortedServices = useMemo(() => {
    return services
      .filter(svc => {
        // Namespace filter
        if (selectedNamespace !== 'All Namespaces' && svc.namespace !== selectedNamespace) {
          return false;
        }
        // Type filter
        if (selectedType !== 'All' && svc.type !== selectedType) {
          return false;
        }
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = svc.name?.toLowerCase().includes(q);
          const matchIP = svc.clusterIP?.toLowerCase().includes(q) || svc.externalIP?.toLowerCase().includes(q);
          const matchNs = svc.namespace?.toLowerCase().includes(q);
          const matchPorts = svc.ports?.toLowerCase().includes(q);
          if (!matchName && !matchIP && !matchNs && !matchPorts) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'age-newest' || sortBy === 'age-oldest') {
          const timeA = a.creationTimestamp ? new Date(a.creationTimestamp).getTime() : 0;
          const timeB = b.creationTimestamp ? new Date(b.creationTimestamp).getTime() : 0;
          return sortBy === 'age-newest' ? timeB - timeA : timeA - timeB;
        }
        return 0;
      });
  }, [services, selectedNamespace, selectedType, searchTerm, sortBy]);

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'ClusterIP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NodePort':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LoadBalancer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ExternalName':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchServices(true)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Title block & Create / Refresh Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500">Service entrypoints expose applications inside and outside the cluster</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center px-4 py-1.5 bg-blue-600 text-white rounded shadow-sm text-xs font-semibold hover:bg-blue-700 focus:outline-none transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Service
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Requirement #1: Summary Cards (Auto-refresh every 10 seconds) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Services */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Services</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.total}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Refreshes every 10s</p>
        </div>

        {/* ClusterIP Services */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">ClusterIP Services</p>
              <h3 className="text-2xl font-bold text-purple-700 mt-1">{summaryStats.clusterIP}</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-purple-500/80 mt-2 font-medium">Internal Cluster Access</p>
        </div>

        {/* NodePort Services */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">NodePort Services</p>
              <h3 className="text-2xl font-bold text-indigo-700 mt-1">{summaryStats.nodePort}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-indigo-500/80 mt-2 font-medium">Static Node Port Expose</p>
        </div>

        {/* LoadBalancer Services */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LoadBalancer Services</p>
              <h3 className="text-2xl font-bold text-blue-700 mt-1">{summaryStats.loadBalancer}</h3>
            </div>
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-sky-600/80 mt-2 font-medium">External LB Provisioned</p>
        </div>

        {/* ExternalName Services */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">ExternalName Services</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{summaryStats.externalName}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] text-amber-600/80 mt-2 font-medium">CNAME Domain Mapping</p>
        </div>
      </div>

      {/* Requirement #3: Search & Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center flex-1">
          {/* Search by Service Name */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Service Name..."
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

          {/* Service Type Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-gray-500 font-semibold flex-shrink-0">Type:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white font-medium text-gray-700"
            >
              <option value="All">All Types</option>
              <option value="ClusterIP">ClusterIP</option>
              <option value="NodePort">NodePort</option>
              <option value="LoadBalancer">LoadBalancer</option>
              <option value="ExternalName">ExternalName</option>
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
            <option value="age-newest">Age (Newest first)</option>
            <option value="age-oldest">Age (Oldest first)</option>
          </select>
        </div>
      </div>

      {/* Requirement #4: Improved Service Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : filteredAndSortedServices.length === 0 ? (
        <EmptyState 
          title="No Services Found" 
          message="No active Services match the selected Namespace filter, Service Type, or search query." 
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
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAndSortedServices.map((svc) => (
                  <tr key={`${svc.namespace}-${svc.name}`} className="hover:bg-gray-50 transition-colors">
                    {/* Service Name */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-gray-800 font-mono">
                      <button
                        onClick={() => setSelectedServiceForDetails(svc)}
                        className="hover:text-blue-600 hover:underline text-left"
                      >
                        {svc.name}
                      </button>
                    </td>

                    {/* Namespace */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {svc.namespace}
                    </td>

                    {/* Type */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getTypeBadgeColor(svc.type)}`}>
                        {svc.type}
                      </span>
                    </td>

                    {/* Cluster IP */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {svc.clusterIP}
                    </td>

                    {/* External IP */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700 font-mono">
                      {svc.externalIP}
                    </td>

                    {/* Ports */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {svc.ports}
                    </td>

                    {/* Age */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {svc.age}
                    </td>

                    {/* Requirement #5: Actions */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedServiceForDetails(svc)}
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedServiceForYaml(svc)}
                          className="p-1.5 rounded hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition-colors"
                          title="View YAML"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedServiceForEdit(svc)}
                          className="p-1.5 rounded hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                          title="Edit Service"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedServiceForDelete(svc)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete Service"
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
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateServiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        namespaces={availableNamespaces}
        onSuccess={() => fetchServices(false)}
      />

      <ServiceDetailsDrawer
        isOpen={!!selectedServiceForDetails}
        onClose={() => setSelectedServiceForDetails(null)}
        service={selectedServiceForDetails}
      />

      <ServiceYamlModal
        isOpen={!!selectedServiceForYaml}
        onClose={() => setSelectedServiceForYaml(null)}
        service={selectedServiceForYaml}
      />

      <EditServiceModal
        isOpen={!!selectedServiceForEdit}
        onClose={() => setSelectedServiceForEdit(null)}
        service={selectedServiceForEdit}
        onSuccess={() => fetchServices(false)}
      />

      <DeleteServiceModal
        isOpen={!!selectedServiceForDelete}
        onClose={() => setSelectedServiceForDelete(null)}
        service={selectedServiceForDelete}
        onSuccess={() => fetchServices(false)}
      />
    </div>
  );
};
