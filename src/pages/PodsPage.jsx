import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Eye, FileText, Microscope, RotateCcw, Trash2,
  AlertTriangle, Loader2, Filter
} from 'lucide-react';
import { podApi } from '../services/podApi';
import { useToast } from '../context/ToastContext';
import { PodDetailsModal }  from '../components/pods/PodDetailsModal';
import { PodLogsModal }     from '../components/pods/PodLogsModal';
import { PodDescribeModal } from '../components/pods/PodDescribeModal';
import { ConfirmDialog }    from '../components/pods/ConfirmDialog';

// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE = 10;

/** Status → Tailwind badge classes */
const STATUS_STYLES = {
  Running:          'bg-green-50  text-green-700  border-green-200',
  Pending:          'bg-yellow-50 text-yellow-700 border-yellow-200',
  Succeeded:        'bg-blue-50   text-blue-700   border-blue-200',
  Failed:           'bg-red-50    text-red-700    border-red-200',
  CrashLoopBackOff: 'bg-orange-50 text-orange-700 border-orange-200',
  OOMKilled:        'bg-red-50    text-red-700    border-red-200',
  ImagePullBackOff: 'bg-orange-50 text-orange-700 border-orange-200',
  Unknown:          'bg-gray-50   text-gray-600   border-gray-200',
};

/** Dot-indicator color per status */
const STATUS_DOT = {
  Running:          'bg-green-500',
  Pending:          'bg-yellow-500 animate-pulse',
  Succeeded:        'bg-blue-500',
  Failed:           'bg-red-600',
  CrashLoopBackOff: 'bg-orange-500 animate-pulse',
  OOMKilled:        'bg-red-600',
  ImagePullBackOff: 'bg-orange-500 animate-pulse',
  Unknown:          'bg-gray-400',
};

const getStatusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.Unknown;
const getStatusDot   = (status) => STATUS_DOT[status]   || STATUS_DOT.Unknown;

/** True when the pod is owned by a ReplicaSet (→ Deployment) or StatefulSet */
const isRestartable = (pod) =>
  pod.ownerKind === 'ReplicaSet' || pod.ownerKind === 'StatefulSet';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const PodsPage = () => {
  const { addToast } = useToast();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [pods,           setPods]           = useState([]);
  const [namespaces,     setNamespaces]     = useState(['All Namespaces', 'default', 'kube-system', 'kube-public', 'kube-node-lease']);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [loading,        setLoading]        = useState(true);
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [error,          setError]          = useState(null);

  // ── Filters (local to this page, do NOT touch global context) ────────────────
  const [selectedNS,     setSelectedNS]     = useState('default');
  const [searchQuery,    setSearchQuery]    = useState('');

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [currentPage,    setCurrentPage]    = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [detailsPod,     setDetailsPod]     = useState(null); // PodDetailsModal
  const [logsPod,        setLogsPod]        = useState(null); // PodLogsModal
  const [describePod,    setDescribePod]    = useState(null); // PodDescribeModal

  // ── Confirm dialogs ──────────────────────────────────────────────────────────
  const [deleteTarget,   setDeleteTarget]   = useState(null); // pod to delete
  const [restartTarget,  setRestartTarget]  = useState(null); // pod to restart

  // ── Action loading states ─────────────────────────────────────────────────────
  const [deletingPod,    setDeletingPod]    = useState(null);
  const [restartingPod,  setRestartingPod]  = useState(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchNamespaces = useCallback(async () => {
    try {
      const ns = await podApi.getNamespaces();
      setNamespaces(ns);
    } catch (_err) {
      // Use the defaults already set in state
    }
  }, []);

  const fetchPods = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const data = await podApi.getPods(selectedNS);
      setPods(data);
      setCurrentPage(1);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch pods from the cluster API.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedNS]);

  // Initial load: namespaces + pods together
  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces]);

  useEffect(() => {
    fetchPods(true);
  }, [fetchPods]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPods(false);
  };

  // ============================================================================
  // CLIENT-SIDE FILTERING & PAGINATION
  // ============================================================================

  const filteredPods = useMemo(() => {
    if (!searchQuery.trim()) return pods;
    const q = searchQuery.toLowerCase();
    return pods.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.namespace.toLowerCase().includes(q)
    );
  }, [pods, searchQuery]);

  const totalPages    = Math.max(1, Math.ceil(filteredPods.length / ITEMS_PER_PAGE));
  const safePage      = Math.min(currentPage, totalPages);
  const paginatedPods = filteredPods.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // Page number array for pagination bar (max 7 visible buttons)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, safePage]);
    if (safePage > 1) pages.add(safePage - 1);
    if (safePage < totalPages) pages.add(safePage + 1);
    return [...pages].sort((a, b) => a - b);
  }, [totalPages, safePage]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleDeleteConfirm = async () => {
    const pod = deleteTarget;
    setDeletingPod(pod.name);
    setDeleteTarget(null);
    try {
      await podApi.deletePod(pod.namespace, pod.name);
      addToast(`Pod "${pod.name}" deleted successfully.`, 'success');
      fetchPods(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete pod.';
      addToast(msg, 'error');
    } finally {
      setDeletingPod(null);
    }
  };

  const handleRestartConfirm = async () => {
    const pod = restartTarget;
    setRestartingPod(pod.name);
    setRestartTarget(null);
    try {
      await podApi.restartPod(pod.namespace, pod.name);
      addToast(`Pod "${pod.name}" restart triggered. Controller will recreate it.`, 'success');
      // Wait a moment then refresh
      setTimeout(() => fetchPods(false), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to restart pod.';
      addToast(msg, 'error');
    } finally {
      setRestartingPod(null);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* ── Page wrapper ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* ── Title + Refresh ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pods</h1>
            <p className="text-sm text-gray-500">Running workloads across namespaces</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin text-k8s-blue' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Filters row ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by pod name or namespace…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded py-1.5 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-k8s-blue transition-colors shadow-sm"
            />
          </div>

          {/* Namespace Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Namespace:</label>
            <select
              value={selectedNS}
              onChange={(e) => setSelectedNS(e.target.value)}
              className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors shadow-sm"
            >
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          {/* Pod count badge */}
          {!loading && !error && (
            <span className="text-xs text-gray-500 ml-auto">
              {filteredPods.length} pod{filteredPods.length !== 1 ? 's' : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </span>
          )}
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">Failed to load pods</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => fetchPods(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* ── Loading Skeleton ──────────────────────────────────────────────── */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Pod Name','Namespace','Status','Node','Restarts','CPU','Memory','Age','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-40" /></td>
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                      <td className="px-4 py-3.5"><div className="h-5 bg-gray-200 rounded w-16" /></td>
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-8"  /></td>
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-12" /></td>
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-14" /></td>
                      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 rounded w-10" /></td>
                      <td className="px-4 py-3.5"><div className="h-7 bg-gray-200 rounded w-36" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center py-3 border-t border-gray-100">
              <Loader2 className="w-4 h-4 animate-spin text-k8s-blue mr-2" />
              <span className="text-xs text-gray-400">Fetching pods from cluster…</span>
            </div>
          </div>
        )}

        {/* ── Empty State ───────────────────────────────────────────────────── */}
        {!loading && !error && filteredPods.length === 0 && (
          <div className="bg-white border border-gray-200 rounded shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Pods Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchQuery
                ? `No pods match "${searchQuery}" in the selected namespace.`
                : 'No active pods exist in the selected namespace.'}
            </p>
          </div>
        )}

        {/* ── Pods Table ────────────────────────────────────────────────────── */}
        {!loading && !error && filteredPods.length > 0 && (
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pod Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Namespace</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Node</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Restarts</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CPU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Memory</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedPods.map((pod) => {
                    const isDeleting  = deletingPod  === pod.name;
                    const isRestarting = restartingPod === pod.name;
                    const restartable = isRestartable(pod);

                    return (
                      <tr
                        key={`${pod.namespace}/${pod.name}`}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${isDeleting ? 'opacity-40' : ''}`}
                        onClick={() => setDetailsPod(pod)}
                      >
                        {/* Pod Name */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-bold text-gray-800 font-mono hover:text-k8s-blue transition-colors">
                            {pod.name}
                          </span>
                        </td>

                        {/* Namespace */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
                            {pod.namespace}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(pod.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(pod.status)}`} />
                            {pod.status}
                          </span>
                        </td>

                        {/* Node */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                          {pod.node}
                        </td>

                        {/* Restarts */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-xs font-bold ${pod.restarts > 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                            {pod.restarts}
                          </span>
                        </td>

                        {/* CPU */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-gray-600">
                          {pod.cpu}
                        </td>

                        {/* Memory */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-gray-600">
                          {pod.memory}
                        </td>

                        {/* Age */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                          {pod.age}
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3.5 whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()} // don't trigger row click
                        >
                          <div className="flex items-center justify-end gap-1">

                            {/* Details */}
                            <ActionBtn
                              title="Details"
                              icon={<Eye className="w-3 h-3" />}
                              color="blue"
                              onClick={() => setDetailsPod(pod)}
                            />

                            {/* Logs */}
                            <ActionBtn
                              title="Logs"
                              icon={<FileText className="w-3 h-3" />}
                              color="indigo"
                              onClick={() => setLogsPod(pod)}
                            />

                            {/* Describe */}
                            <ActionBtn
                              title="Describe"
                              icon={<Microscope className="w-3 h-3" />}
                              color="purple"
                              onClick={() => setDescribePod(pod)}
                            />

                            {/* Restart */}
                            <ActionBtn
                              title={restartable ? 'Restart' : 'Restart (not managed by controller)'}
                              icon={isRestarting
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <RotateCcw className="w-3 h-3" />
                              }
                              color="amber"
                              disabled={!restartable || isRestarting}
                              onClick={() => setRestartTarget(pod)}
                            />

                            {/* Delete */}
                            <ActionBtn
                              title="Delete"
                              icon={isDeleting
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Trash2 className="w-3 h-3" />
                              }
                              color="red"
                              disabled={isDeleting}
                              onClick={() => setDeleteTarget(pod)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Page <span className="font-semibold text-gray-700">{safePage}</span> of{' '}
                  <span className="font-semibold text-gray-700">{totalPages}</span>
                  {' '}· {filteredPods.length} pods
                </span>

                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <PagBtn
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={safePage === 1}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </PagBtn>

                  {/* Page numbers */}
                  {pageNumbers.map((num, idx) => {
                    // Ellipsis
                    const prev = pageNumbers[idx - 1];
                    const showEllipsisBefore = prev && num - prev > 1;
                    return (
                      <React.Fragment key={num}>
                        {showEllipsisBefore && (
                          <span className="px-1.5 text-xs text-gray-400">…</span>
                        )}
                        <PagBtn
                          onClick={() => setCurrentPage(num)}
                          active={num === safePage}
                        >
                          {num}
                        </PagBtn>
                      </React.Fragment>
                    );
                  })}

                  {/* Next */}
                  <PagBtn
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={safePage === totalPages}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </PagBtn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}

      {/* Pod Details */}
      {detailsPod && (
        <PodDetailsModal
          pod={detailsPod}
          onClose={() => setDetailsPod(null)}
        />
      )}

      {/* Pod Logs */}
      {logsPod && (
        <PodLogsModal
          pod={logsPod}
          onClose={() => setLogsPod(null)}
        />
      )}

      {/* Pod Describe */}
      {describePod && (
        <PodDescribeModal
          pod={describePod}
          onClose={() => setDescribePod(null)}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Pod"
        message={`Are you sure you want to delete pod "${deleteTarget?.name}"? This action cannot be undone. If managed by a controller, it will be recreated automatically.`}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deletingPod}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Restart Confirm */}
      <ConfirmDialog
        isOpen={!!restartTarget}
        title="Restart Pod"
        message={`Restart pod "${restartTarget?.name}"? The pod will be deleted and its controller (Deployment / StatefulSet) will recreate it automatically.`}
        confirmLabel="Restart"
        variant="warning"
        loading={!!restartingPod}
        onConfirm={handleRestartConfirm}
        onCancel={() => setRestartTarget(null)}
      />
    </>
  );
};

// ============================================================================
// SMALL REUSABLE UI PRIMITIVES
// ============================================================================

const ACTION_COLORS = {
  blue:   'text-blue-600   border-blue-200   hover:bg-blue-50   hover:border-blue-400',
  indigo: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400',
  purple: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-400',
  amber:  'text-amber-600  border-amber-200  hover:bg-amber-50  hover:border-amber-400',
  red:    'text-red-600    border-red-200    hover:bg-red-50    hover:border-red-400',
};

const ActionBtn = ({ title, icon, color = 'blue', onClick, disabled = false }) => {
  const cls = ACTION_COLORS[color] || ACTION_COLORS.blue;
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center w-7 h-7 rounded border bg-white
        transition-colors focus:outline-none
        disabled:opacity-30 disabled:cursor-not-allowed
        ${cls}
      `}
    >
      {icon}
    </button>
  );
};

const PagBtn = ({ children, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      min-w-[28px] h-7 px-1.5 text-xs rounded border transition-colors
      focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed
      ${active
        ? 'bg-k8s-blue text-white border-k8s-blue font-semibold'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
    `}
  >
    {children}
  </button>
);
