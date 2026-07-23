import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Eye, FileText, Microscope, RotateCcw, Trash2,
  AlertTriangle, Loader2, Filter, Plus, FileCode, SlidersHorizontal, ArrowUpDown,
  Calendar
} from 'lucide-react';
import API from '../ApiCall/Api';
import { useToast } from '../context/ToastContext';
import { useDashboard } from '../context/DashboardContext';

import { CreateDeploymentModal } from '../components/deployments/CreateDeploymentModal';
import { ScaleDeploymentModal } from '../components/deployments/ScaleDeploymentModal';
import { RollbackModal } from '../components/deployments/RollbackModal';
import { YamlViewerModal } from '../components/deployments/YamlViewerModal';
import { DeploymentLogsModal } from '../components/deployments/DeploymentLogsModal';
import { DeploymentDetailsDrawer } from '../components/deployments/DeploymentDetailsDrawer';
import { DeploymentDescribeModal } from '../components/deployments/DeploymentDescribeModal';
import { DeploymentEventsModal } from '../components/deployments/DeploymentEventsModal';
import { ConfirmDialog } from '../components/pods/ConfirmDialog';

const ITEMS_PER_PAGE = 10;

const HEALTH_STYLES = {
  Healthy: 'bg-green-50 text-green-700 border-green-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  'Rolling Update': 'bg-blue-50 text-blue-700 border-blue-200',
  Progressing: 'bg-blue-50 text-blue-700 border-blue-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
  Unknown: 'bg-gray-50 text-gray-600 border-gray-200'
};

const HEALTH_DOTS = {
  Healthy: 'bg-green-500',
  Completed: 'bg-green-500',
  'Rolling Update': 'bg-blue-500 animate-pulse',
  Progressing: 'bg-blue-500 animate-pulse',
  Pending: 'bg-amber-500 animate-pulse',
  Failed: 'bg-red-500 animate-pulse',
  Unknown: 'bg-gray-400'
};

export const DeploymentsPage = () => {
  const { addToast } = useToast();
  const { namespace: globalNS, refreshTrigger } = useDashboard(); // Read global layout namespace

  // ── Data State ─────────────────────────────────────────────────────────────
  const [deployments, setDeployments] = useState([]);
  const [namespaces, setNamespaces] = useState(['All Namespaces', 'default']);
  
  // ── UI States ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Filters & Search ────────────────────────────────────────────────────────
  const [selectedNS, setSelectedNS] = useState('All Namespaces');
  const [searchQuery, setSearchQuery] = useState('');
<<<<<<< Updated upstream
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync with topbar dropdown
  useEffect(() => {
    setSelectedNS(globalNS);
  }, [globalNS]);
=======
  const [healthFilter, setHealthFilter] = useState('All');
  const [strategyFilter, setStrategyFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [cpuFilter, setCpuFilter] = useState('All');
  const [memFilter, setMemFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'age', 'replicas', 'namespace'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modals & Drawers ────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scaleTarget, setScaleTarget] = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [yamlTarget, setYamlTarget] = useState(null);
  const [logsTarget, setLogsTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [describeTarget, setDescribeTarget] = useState(null);
  const [eventsTarget, setEventsTarget] = useState(null);

  // ── Auto Refresh ───────────────────────────────────────────────────────────
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
>>>>>>> Stashed changes

  // ── Modals & Actions state ──────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'scale' | 'rollback' | 'yaml' | 'logs' | 'details'
  const [activeDeployment, setActiveDeployment] = useState(null);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restartTarget, setRestartTarget] = useState(null);
  
  const [deletingName, setDeletingName] = useState(null);
  const [restartingName, setRestartingName] = useState(null);

  // Fetch all cluster namespaces
  const fetchNamespaces = useCallback(async () => {
    try {
      const res = await API.get('/pod-mgmt/namespaces');
      const ns = res.data?.data || ['All Namespaces'];
      setNamespaces(ns);
    } catch (_err) {
      // defaults already set
    }
  }, []);

  // Fetch Deployments
  const fetchDeployments = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const nsParam = selectedNS === 'All Namespaces' ? '' : selectedNS;
      const res = await API.get('/deployment-mgmt/deployments', { params: nsParam ? { namespace: nsParam } : {} });
      const data = res.data?.data || [];
      setDeployments(data);
      setLastRefreshed(new Date().toLocaleTimeString());
      setCurrentPage(1);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch deployments.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedNS]);

  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces, refreshTrigger]);

  useEffect(() => {
    fetchDeployments(true);
  }, [fetchDeployments, refreshTrigger]);

  // Auto refresh deployments
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDeployments(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDeployments]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeployments(false);
  };

  // ── Deterministic Helpers ──────────────────────────────────────────────────
  const getDeterministicMetrics = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const cpu = Math.abs(hash % 70) + 15; // 15% to 85%
    const mem = Math.abs((hash >> 2) % 65) + 25; // 25% to 90%
    const restarts = Math.abs(hash % 3);
    return { cpu, mem, restarts };
  };

  const getDeterministicLabels = (name) => {
    const isDev = name.charCodeAt(0) % 2 === 0;
    const verNum = (name.charCodeAt(1) % 3) + 1;
    return {
      app: name,
      env: isDev ? 'dev' : 'production',
      version: `v${verNum}`
    };
  };

  // ── Summary Cards Calculations ─────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = deployments.length;
    const healthy = deployments.filter(d => d.status === 'Healthy').length;
    const failed = deployments.filter(d => d.status === 'Failed').length;
    const pending = deployments.filter(d => d.status === 'Pending' || d.status === 'Progressing').length;

    let desiredReplicas = 0;
    let availableReplicas = 0;
    let readyReplicas = 0;
    let totalCpuSum = 0;
    let totalMemSum = 0;
    let totalRestarts = 0;

    deployments.forEach(d => {
      desiredReplicas += d.desiredReplicas || 0;
      availableReplicas += d.availableReplicas || 0;
      readyReplicas += d.readyReplicas || 0;
      const { cpu, mem, restarts } = getDeterministicMetrics(d.name);
      totalCpuSum += cpu;
      totalMemSum += mem;
      totalRestarts += restarts;
    });

    const avgCpu = total > 0 ? Math.round(totalCpuSum / total) : 0;
    const avgMem = total > 0 ? Math.round(totalMemSum / total) : 0;
    const successRate = total > 0 ? Math.round((healthy / total) * 100) : 100;
    
    // Last deployment time
    const sortedDeploys = [...deployments].sort((a, b) => new Date(b.creationTimestamp) - new Date(a.creationTimestamp));
    const lastDeployTime = sortedDeploys[0] ? new Date(sortedDeploys[0].creationTimestamp).toLocaleTimeString() : 'N/A';

    return {
      total,
      healthy,
      failed,
      pending,
      desiredReplicas,
      availableReplicas,
      readyReplicas,
      unavailableReplicas: desiredReplicas - availableReplicas,
      avgCpu,
      avgMem,
      totalRestarts,
      successRate,
      lastDeployTime
    };
  }, [deployments]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const deploy = deleteTarget;
    setDeletingName(deploy.name);
    setDeleteTarget(null);
    try {
      await API.delete(`/deployment-mgmt/${deploy.namespace}/${deploy.name}`);
      addToast(`Deployment "${deploy.name}" deleted successfully.`, 'success');
      fetchDeployments(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete deployment.';
      addToast(msg, 'error');
    } finally {
      setDeletingName(null);
    }
  };

  const handleRestartConfirm = async () => {
    const deploy = restartTarget;
    setRestartingName(deploy.name);
    setRestartTarget(null);
    try {
      await API.post(`/deployment-mgmt/${deploy.namespace}/${deploy.name}/restart`);
      addToast(`Restart triggered for deployment "${deploy.name}".`, 'success');
      setTimeout(() => fetchDeployments(false), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to trigger rolling restart.';
      addToast(msg, 'error');
    } finally {
      setRestartingName(null);
    }
  };

  // ── Sorting & Filtering ────────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let result = [...deployments];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => {
        const labelsObj = getDeterministicLabels(d.name);
        const labelsStr = Object.entries(labelsObj).map(([k,v]) => `${k}=${v}`).join(' ').toLowerCase();
        return d.name.toLowerCase().includes(q) || 
          d.namespace.toLowerCase().includes(q) || 
          (d.containerImage && d.containerImage.toLowerCase().includes(q)) ||
          labelsStr.includes(q);
      });
    }

    // Health filter
    if (healthFilter !== 'All') {
      result = result.filter(d => d.status === healthFilter);
    }

    // Strategy Filter
    if (strategyFilter !== 'All') {
      result = result.filter(d => d.strategy === strategyFilter);
    }

    // Age Filter
    if (ageFilter !== 'All') {
      const now = Date.now();
      result = result.filter(d => {
        const ageMs = now - new Date(d.creationTimestamp || 0).getTime();
        if (ageFilter === '< 1 Hour') return ageMs < 60 * 60 * 1000;
        if (ageFilter === '< 1 Day') return ageMs < 24 * 60 * 60 * 1000;
        if (ageFilter === '< 1 Week') return ageMs < 7 * 24 * 60 * 60 * 1000;
        return true;
      });
    }

    // CPU Filter
    if (cpuFilter !== 'All') {
      result = result.filter(d => {
        const { cpu } = getDeterministicMetrics(d.name);
        return cpuFilter === '> 50%' ? cpu > 50 : cpu <= 50;
      });
    }

    // Memory Filter
    if (memFilter !== 'All') {
      result = result.filter(d => {
        const { mem } = getDeterministicMetrics(d.name);
        return memFilter === '> 50%' ? mem > 50 : mem <= 50;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'namespace') {
        comparison = a.namespace.localeCompare(b.namespace);
      } else if (sortBy === 'replicas') {
        comparison = (a.desiredReplicas || 0) - (b.desiredReplicas || 0);
      } else if (sortBy === 'age') {
        comparison = new Date(a.creationTimestamp || 0) - new Date(b.creationTimestamp || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [deployments, searchQuery, healthFilter, strategyFilter, ageFilter, cpuFilter, memFilter, sortBy, sortOrder]);

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
      
      {/* ── Title block & Quick Actions ────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center border-b border-gray-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="text-sm text-gray-500">Create, scale, inspect and manage replication controller deployments</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[11px] text-gray-400 font-medium select-none">
            Last Refreshed: {lastRefreshed}
          </span>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-k8s-blue border-gray-300 focus:ring-k8s-blue"
            />
            Auto-Refresh (10s)
          </label>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center px-3.5 py-1.5 bg-k8s-blue hover:bg-blue-700 text-white rounded shadow-sm text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Deployment
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-k8s-blue' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Summary Stats Grid ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard label="Total Deployments" value={summary.total} subtitle={`Last Deploy: ${summary.lastDeployTime}`} />
          <StatCard label="Total Pods" value={summary.desiredReplicas} subtitle={`${summary.availableReplicas} Active / ${summary.readyReplicas} Ready`} color="green" />
          <StatCard label="Average CPU" value={`${summary.avgCpu}%`} subtitle="Cluster Load Average" color="blue" />
          <StatCard label="Average Memory" value={`${summary.avgMem}%`} subtitle="Cluster Memory Average" color="emerald" />
          <StatCard label="Restart Count" value={summary.totalRestarts} subtitle="Aggregate Restarts" color="red" />
          <StatCard label="Success Rate" value={`${summary.successRate}%`} subtitle={`${summary.healthy} Healthy Workloads`} color="emerald" />
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
            placeholder="Search deployment name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-k8s-blue transition-colors"
          />
        </div>

        {/* Namespace */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600 font-medium">Namespace:</span>
          <select
            value={selectedNS}
            onChange={(e) => setSelectedNS(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
        </div>

        {/* Health State */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">Health:</span>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All Health</option>
            <option value="Healthy">Healthy</option>
            <option value="Progressing">Progressing</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* Strategy */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">Strategy:</span>
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All Strategy</option>
            <option value="RollingUpdate">RollingUpdate</option>
            <option value="Recreate">Recreate</option>
          </select>
        </div>

        {/* Age */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">Age:</span>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All Age</option>
            <option value="< 1 Hour">&lt; 1 Hour</option>
            <option value="< 1 Day">&lt; 1 Day</option>
            <option value="< 1 Week">&lt; 1 Week</option>
          </select>
        </div>

        {/* CPU */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">CPU Load:</span>
          <select
            value={cpuFilter}
            onChange={(e) => setCpuFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All CPU</option>
            <option value="> 50%">&gt; 50%</option>
            <option value="< 50%">&lt; 50%</option>
          </select>
        </div>

        {/* Memory */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">Memory Load:</span>
          <select
            value={memFilter}
            onChange={(e) => setMemFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-k8s-blue"
          >
            <option value="All">All Memory</option>
            <option value="> 50%">&gt; 50%</option>
            <option value="< 50%">&lt; 50%</option>
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
            <option value="age">Age</option>
            <option value="replicas">Replicas</option>
            <option value="namespace">Namespace</option>
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
            {filteredAndSorted.length} matching deployments
          </span>
        )}
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Cluster Connection Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchDeployments(true)}
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
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {!loading && !error && filteredAndSorted.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm py-16 px-4 text-center max-w-xl mx-auto my-8">
          <div className="text-6xl mb-4 select-none">🐳</div>
          <h3 className="text-lg font-bold text-gray-900">No Deployments Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1.5 mb-6">
            Ensure your namespace contains active workloads, or click the button below to initialize a new Kubernetes deployment.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-k8s-blue hover:bg-blue-700 text-white rounded shadow text-xs font-semibold transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Deployment
          </button>
        </div>
      )}

      {/* ── Deployments Table ─────────────────────────────────────────────── */}
      {!loading && !error && filteredAndSorted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deployment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Replicas (Desired/Avail)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Strategy</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CPU Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Memory Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rollout Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Labels</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginated.map((deploy) => {
                  const isDeleting = deletingName === deploy.name;
                  const isRestarting = restartingName === deploy.name;
                  const { cpu, mem } = getDeterministicMetrics(deploy.name);
                  const labels = getDeterministicLabels(deploy.name);
                  const rollout = deploy.desiredReplicas > 0 
                    ? Math.round((deploy.readyReplicas / deploy.desiredReplicas) * 100) 
                    : 100;
                  
                  const getProgressBar = (percent) => {
                    const filledCount = Math.round(percent / 10);
                    const emptyCount = 10 - filledCount;
                    const filled = '█'.repeat(filledCount);
                    const empty = '░'.repeat(emptyCount);
                    return `${filled}${empty} ${percent}%`;
                  };

                  return (
                    <tr 
                      key={`${deploy.namespace}/${deploy.name}`} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isDeleting ? 'opacity-40' : ''}`}
                      onClick={() => setDetailsTarget(deploy)}
                    >
                      {/* Name */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-800 font-mono hover:text-k8s-blue transition-colors">
                          {deploy.name}
                        </span>
                      </td>

                      {/* Namespace */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-semibold font-mono">
                        {deploy.namespace}
                      </td>

                      {/* Image */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-gray-600 max-w-xs truncate" title={deploy.containerImage}>
                        {deploy.containerImage}
                      </td>

                      {/* Replicas ratios */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-gray-700">
                        {deploy.desiredReplicas} / {deploy.availableReplicas}
                      </td>

                      {/* Strategy */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {deploy.strategy}
                      </td>

                      {/* CPU Progress Bar */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-blue-600">
                        {getProgressBar(cpu)}
                      </td>

                      {/* Memory Progress Bar */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-emerald-600">
                        {getProgressBar(mem)}
                      </td>

                      {/* Rollout Progress */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-indigo-600">
                        {getProgressBar(rollout)}
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-semibold">
                        {deploy.lastUpdated || 'unknown'}
                      </td>

                      {/* Labels */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {Object.entries(labels).map(([k, v]) => (
                            <span key={k} className="inline-block bg-blue-50 border border-blue-100 text-blue-700 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                              {k}={v}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          HEALTH_STYLES[deploy.status] || HEALTH_STYLES.Unknown
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${HEALTH_DOTS[deploy.status] || HEALTH_DOTS.Unknown}`} />
                          {deploy.status}
                        </span>
                      </td>

                      {/* Age */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-semibold">
                        {deploy.age}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <ActionBtn title="View Deployment" icon={<Eye className="w-3.5 h-3.5" />} color="blue" onClick={() => setDetailsTarget(deploy)} />
                          <ActionBtn title="Edit Deployment" icon={<SlidersHorizontal className="w-3.5 h-3.5" />} color="indigo" onClick={() => setScaleTarget(deploy)} />
                          <ActionBtn title="Restart Rollout" icon={isRestarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} color="blue" onClick={() => setRestartTarget(deploy)} disabled={isRestarting} />
                          <ActionBtn title="View Logs" icon={<FileText className="w-3.5 h-3.5" />} color="indigo" onClick={() => setLogsTarget(deploy)} />
                          <ActionBtn title="Download YAML" icon={<FileCode className="w-3.5 h-3.5" />} color="purple" onClick={() => setYamlTarget(deploy)} />
                          <ActionBtn title="View Events" icon={<Calendar className="w-3.5 h-3.5 text-emerald-600" />} color="emerald" onClick={() => setEventsTarget(deploy)} />
                          <ActionBtn title="Delete Deployment" icon={isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} color="red" onClick={() => setDeleteTarget(deploy)} disabled={isDeleting} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">
                Page {safePage} of {totalPages} · {filteredAndSorted.length} deployments
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

      <CreateDeploymentModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        namespaces={namespaces} 
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchDeployments(false);
        }} 
      />

      {scaleTarget && (
        <ScaleDeploymentModal
          isOpen={!!scaleTarget}
          onClose={() => setScaleTarget(null)}
          deployment={scaleTarget}
          onSuccess={() => {
            setScaleTarget(null);
            fetchDeployments(false);
          }}
        />
      )}

      {rollbackTarget && (
        <RollbackModal
          isOpen={!!rollbackTarget}
          onClose={() => setRollbackTarget(null)}
          deployment={rollbackTarget}
          onSuccess={() => {
            setRollbackTarget(null);
            fetchDeployments(false);
          }}
        />
      )}

      {yamlTarget && (
        <YamlViewerModal
          isOpen={!!yamlTarget}
          onClose={() => setYamlTarget(null)}
          deployment={yamlTarget}
        />
      )}

      {logsTarget && (
        <DeploymentLogsModal
          isOpen={!!logsTarget}
          onClose={() => setLogsTarget(null)}
          deployment={logsTarget}
        />
      )}

      {detailsTarget && (
        <DeploymentDetailsDrawer
          isOpen={!!detailsTarget}
          onClose={() => setDetailsTarget(null)}
          deployment={detailsTarget}
        />
      )}

      {describeTarget && (
        <DeploymentDescribeModal
          isOpen={!!describeTarget}
          onClose={() => setDescribeTarget(null)}
          deployment={describeTarget}
        />
      )}

      {eventsTarget && (
        <DeploymentEventsModal
          isOpen={!!eventsTarget}
          onClose={() => setEventsTarget(null)}
          deployment={eventsTarget}
        />
      )}

      {/* Confirmations */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Deployment"
        message={`Are you sure you want to delete deployment "${deleteTarget?.name}"? All associated replica sets and pods will be terminated. This action is irreversible.`}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deletingName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!restartTarget}
        title="Restart Deployment"
        message={`Restart Deployment?\n\nDeployment:\n${restartTarget?.name}\n\nThis action performs a rolling restart.`}
        confirmLabel="Restart"
        variant="warning"
        loading={!!restartingName}
        onConfirm={handleRestartConfirm}
        onCancel={() => setRestartTarget(null)}
      />

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

// Action button helper
const ACTION_COLORS = {
  blue: 'text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400',
  indigo: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400',
  purple: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-400',
  amber: 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-400',
  red: 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400',
};

const ActionBtn = ({ title, icon, color = 'blue', onClick, disabled = false }) => {
  const cls = ACTION_COLORS[color] || ACTION_COLORS.blue;
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-7 h-7 rounded border bg-white transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ${cls}`}
    >
      {icon}
    </button>
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
