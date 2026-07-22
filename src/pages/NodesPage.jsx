import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Eye, Shield, Activity, Filter, ArrowUpDown, Info, Layers, AlertTriangle,
  MoreVertical, FileCode, FileText, Clipboard
} from 'lucide-react';
import API from '../ApiCall/Api';
import { useToast } from '../context/ToastContext';
import { useDashboard } from '../context/DashboardContext';

// Import newly created Drawer and Modals
import { NodeDetailsDrawer } from '../components/nodes/NodeDetailsDrawer';
import { NodeYamlViewerModal } from '../components/nodes/NodeYamlViewerModal';
import { NodeDescribeModal } from '../components/nodes/NodeDescribeModal';
import { NodeEventsModal } from '../components/nodes/NodeEventsModal';

const ITEMS_PER_PAGE = 10;

const STATUS_STYLES = {
  Ready: 'bg-green-50 text-green-700 border-green-200',
  'Not Ready': 'bg-red-50 text-red-700 border-red-200',
  Unknown: 'bg-gray-50 text-gray-600 border-gray-200'
};

const STATUS_DOTS = {
  Ready: 'bg-green-500',
  'Not Ready': 'bg-red-500 animate-pulse',
  Unknown: 'bg-gray-400'
};

const getProgressBarColor = (percentage) => {
  if (percentage === 'N/A') return 'bg-gray-300';
  if (percentage > 85) return 'bg-red-500';
  if (percentage > 60) return 'bg-amber-500';
  return 'bg-green-500';
};

export const NodesPage = () => {
  const { addToast } = useToast();
  const { refreshTrigger } = useDashboard();

  // ── Data State ─────────────────────────────────────────────────────────────
  const [nodes, setNodes] = useState([]);
  
  // ── UI States ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Filters & Sorting ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'cpu', 'memory', 'age'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Drawers & Modals ───────────────────────────────────────────────────────
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [yamlTarget, setYamlTarget] = useState(null);
  const [describeTarget, setDescribeTarget] = useState(null);
  const [eventsTarget, setEventsTarget] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Nodes
  const fetchNodes = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const res = await API.get('/node-mgmt/nodes');
      const data = res.data?.data || [];
      setNodes(data);
      setCurrentPage(1);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch Kubernetes nodes.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes(true);
  }, [fetchNodes, refreshTrigger]);

  // Auto refresh nodes every 10s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchNodes(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchNodes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNodes(false);
  };

  // ── Summary Cards Calculations ─────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = nodes.length;
    const ready = nodes.filter(n => n.status === 'Ready').length;
    const notReady = total - ready;
    const controlPlane = nodes.filter(n => n.role === 'Control Plane').length;
    const worker = total - controlPlane;

    // Parse and sum capacity values
    let totalCores = 0;
    let totalMemoryGiB = 0;

    nodes.forEach(n => {
      // CPU parsing e.g. "4.0 Cores"
      const cores = parseFloat(n.cpuCapacity) || 0;
      totalCores += cores;

      // Memory parsing e.g. "15.9 GiB" or "512 MiB"
      const memStr = n.memoryCapacity || '';
      const memVal = parseFloat(memStr) || 0;
      if (memStr.includes('GiB')) {
        totalMemoryGiB += memVal;
      } else if (memStr.includes('MiB')) {
        totalMemoryGiB += memVal / 1024;
      } else {
        totalMemoryGiB += memVal; // assumption
      }
    });

    const readyNodes = nodes.filter(n => n.status === 'Ready' && n.cpuUsagePct !== 'N/A' && n.cpuUsagePct !== undefined);
    const avgCpu = readyNodes.length > 0 ? Math.round(readyNodes.reduce((acc, n) => acc + (parseFloat(n.cpuUsagePct) || 0), 0) / readyNodes.length) : 'N/A';
    
    const readyNodesMem = nodes.filter(n => n.status === 'Ready' && n.memUsagePct !== 'N/A' && n.memUsagePct !== undefined);
    const avgMem = readyNodesMem.length > 0 ? Math.round(readyNodesMem.reduce((acc, n) => acc + (parseFloat(n.memUsagePct) || 0), 0) / readyNodesMem.length) : 'N/A';

    const version = nodes[0]?.version || 'N/A';

    return {
      total,
      ready,
      notReady,
      controlPlane,
      worker,
      totalCpu: `${totalCores.toFixed(1)} Cores`,
      totalMemory: `${totalMemoryGiB.toFixed(1)} GiB`,
      version,
      avgCpu,
      avgMem
    };
  }, [nodes]);

  // ── Sorting & Filtering ────────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let result = [...nodes];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.name.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(n => n.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'All') {
      result = result.filter(n => n.role === roleFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'cpu') {
        const valA = a.cpuUsagePct === 'N/A' ? -1 : a.cpuUsagePct;
        const valB = b.cpuUsagePct === 'N/A' ? -1 : b.cpuUsagePct;
        comparison = valA - valB;
      } else if (sortBy === 'memory') {
        const valA = a.memUsagePct === 'N/A' ? -1 : a.memUsagePct;
        const valB = b.memUsagePct === 'N/A' ? -1 : b.memUsagePct;
        comparison = valA - valB;
      } else if (sortBy === 'age') {
        comparison = new Date(a.creationTimestamp || 0) - new Date(b.creationTimestamp || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [nodes, searchQuery, statusFilter, roleFilter, sortBy, sortOrder]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredAndSorted.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const toggleSortOrder = () => setSortOrder(o => o === 'asc' ? 'desc' : 'asc');

  return (
    <div className="space-y-6">
      
      {/* ── Title block & Refresh ────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
          <p className="text-sm text-gray-500">View cluster compute instances, live workloads, and capacity limits</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-k8s-blue border-gray-300 focus:ring-k8s-blue"
            />
            Auto-Refresh (10s)
          </label>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:outline-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-k8s-blue' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Summary Stats Grid (Node Health Card) ─────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Nodes" value={summary.total} subtitle={`${summary.ready} Ready / ${summary.notReady} NotReady`} />
          <StatCard label="Control Plane Nodes" value={summary.controlPlane} subtitle="Cluster Orchestrators" color="blue" />
          <StatCard label="Worker Nodes" value={summary.worker} subtitle="Workload Hosts" color="green" />
          <StatCard label="Average CPU Usage" value={summary.avgCpu !== 'N/A' ? `${summary.avgCpu}%` : 'N/A'} subtitle="Overall CPU load" color="emerald" />
          <StatCard label="Average Memory Usage" value={summary.avgMem !== 'N/A' ? `${summary.avgMem}%` : 'N/A'} subtitle="Overall RAM load" color="emerald" />
        </div>
      )}

      {/* ── Search, Filters & Sorting Row ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search node name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-k8s-blue transition-colors"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All Status</option>
            <option value="Ready">Ready</option>
            <option value="Not Ready">Not Ready</option>
          </select>
        </div>

        {/* Role */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All Roles</option>
            <option value="Control Plane">Control Plane</option>
            <option value="Worker">Worker</option>
          </select>
        </div>

        {/* Sorting Fields */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="name">Name</option>
            <option value="cpu">CPU Usage</option>
            <option value="memory">Memory Usage</option>
            <option value="age">Age</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="p-1.5 border border-gray-300 bg-white hover:bg-gray-100 rounded text-xs transition-colors text-gray-600 font-semibold"
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>

        {/* Count */}
        {!loading && (
          <span className="text-xs text-gray-500 font-medium ml-auto">
            {filteredAndSorted.length} matching nodes
          </span>
        )}
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Cluster Node Fetch Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchNodes(true)}
            className="flex-shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ──────────────────────────────────────────────── */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded shadow-sm p-4 space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-full" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {!loading && !error && filteredAndSorted.length === 0 && (
        <div className="bg-white border border-gray-200 rounded shadow-sm py-16 text-center">
          <div className="text-5xl mb-3">🖥️</div>
          <h3 className="text-base font-semibold text-gray-900">No Nodes Registered</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            Ensure your kubeconfig context references an active cluster configuration.
          </p>
        </div>
      )}

      {/* ── Nodes Table ───────────────────────────────────────────────────── */}
      {!loading && !error && filteredAndSorted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Node Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">K8s Version</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">OS Image</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Runtime</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CPU Allocation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Memory Allocation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pods</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginated.map((node) => (
                  <tr 
                    key={node.name} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setDetailsTarget(node)}
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-800 font-mono hover:text-k8s-blue transition-colors">
                        {node.name}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        STATUS_STYLES[node.status] || STATUS_STYLES.Unknown
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[node.status] || STATUS_DOTS.Unknown}`} />
                        {node.status}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-semibold">
                      {node.role}
                    </td>

                    {/* Version */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {node.version}
                    </td>

                    {/* OS */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 truncate max-w-[150px]" title={node.os}>
                      {node.os}
                    </td>

                    {/* Container Runtime */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {node.runtime}
                    </td>

                    {/* CPU Usage progress bar */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 border border-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${getProgressBarColor(node.cpuUsagePct)}`}
                            style={{ width: `${node.cpuUsagePct === 'N/A' ? 0 : node.cpuUsagePct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-600">{node.cpuUsagePct === 'N/A' ? 'N/A' : `${node.cpuUsagePct}%`}</span>
                      </div>
                    </td>

                    {/* Memory Usage progress bar */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 border border-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${getProgressBarColor(node.memUsagePct)}`}
                            style={{ width: `${node.memUsagePct === 'N/A' ? 0 : node.memUsagePct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-600">{node.memUsagePct === 'N/A' ? 'N/A' : `${node.memUsagePct}%`}</span>
                      </div>
                    </td>

                    {/* Pod count */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-gray-700 font-mono">
                      {node.podCount}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {node.internalIP}
                    </td>

                    {/* Age */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-semibold">
                      {node.age}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === node.name ? null : node.name)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeDropdown === node.name && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveDropdown(null)}
                          />
                          <div className="absolute right-4 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg py-1 z-20 text-gray-800 text-left font-sans select-none">
                            <button
                              onClick={() => {
                                setDetailsTarget(node);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors text-gray-700 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setYamlTarget(node);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors text-gray-700 font-semibold"
                            >
                              <FileCode className="w-3.5 h-3.5 text-amber-500" />
                              View YAML
                            </button>
                            <button
                              onClick={() => {
                                setEventsTarget(node);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors text-gray-700 font-semibold"
                            >
                              <Activity className="w-3.5 h-3.5 text-emerald-500" />
                              View Events
                            </button>
                            <button
                              onClick={() => {
                                setDescribeTarget(node);
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors text-gray-700 font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              Describe Node
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(node.name);
                                addToast('Node name copied to clipboard', 'success');
                                setActiveDropdown(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-100 text-gray-600 font-semibold"
                            >
                              <Clipboard className="w-3.5 h-3.5 text-gray-400" />
                              Copy Node Name
                            </button>
                          </div>
                        </>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">
                Page {safePage} of {totalPages} · {filteredAndSorted.length} nodes
              </span>
              <div className="flex items-center gap-1">
                <PagBtn onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </PagBtn>
                <PagBtn onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </PagBtn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals & Overlay Drawers ────────────────────────────────────────── */}
      {detailsTarget && (
        <NodeDetailsDrawer
          isOpen={!!detailsTarget}
          onClose={() => setDetailsTarget(null)}
          node={detailsTarget}
        />
      )}

      {yamlTarget && (
        <NodeYamlViewerModal
          isOpen={!!yamlTarget}
          onClose={() => setYamlTarget(null)}
          node={yamlTarget}
        />
      )}

      {describeTarget && (
        <NodeDescribeModal
          isOpen={!!describeTarget}
          onClose={() => setDescribeTarget(null)}
          node={describeTarget}
        />
      )}

      {eventsTarget && (
        <NodeEventsModal
          isOpen={!!eventsTarget}
          onClose={() => setEventsTarget(null)}
          node={eventsTarget}
        />
      )}

    </div>
  );
};

// Summary stat helper component
const StatCard = ({ label, value, subtitle, color = 'blue' }) => {
  const styles = {
    blue: 'border-blue-100 bg-blue-50/10 text-blue-700',
    green: 'border-green-100 bg-green-50/10 text-green-700',
    emerald: 'border-emerald-100 bg-emerald-50/10 text-emerald-700',
    red: 'border-red-100 bg-red-50/10 text-red-700'
  };
  return (
    <div className={`p-4 rounded-lg border bg-white flex flex-col justify-between shadow-sm min-h-[90px]`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-2xl font-bold font-mono text-gray-800 mt-1">{value}</span>
      <span className="text-[11px] text-gray-400 mt-1 font-medium">{subtitle}</span>
    </div>
  );
};

// Pagination button helper
const PagBtn = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-2.5 py-1.5 text-xs font-semibold rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);
