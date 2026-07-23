import React, { useState, useEffect } from 'react';
import API from '../ApiCall/Api';
import { useDashboard } from '../context/DashboardContext';
import { useToast } from '../context/ToastContext';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Layers, 
  Send, 
  Cpu, 
  Globe, 
  Activity, 
  Clock, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';

export const OverviewPage = () => {
  const { namespace, clusterDetails, refreshTrigger } = useDashboard();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memoryHistory, setMemoryHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const [statsRes, cpuRes, memRes, eventsRes] = await Promise.all([
        API.get('/dashboard/overview'),
        API.get('/metrics/cpu'),
        API.get('/metrics/memory'),
        API.get('/events')
      ]);
      setStats(statsRes.data?.data || null);
      
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const cpuVal = cpuRes.data?.data?.value || 0;
      const memVal = memRes.data?.data?.value || 0;
      
      setCpuHistory(prev => {
        const next = [...prev, { time: timeStr, value: cpuVal }];
        return next.slice(-15);
      });
      setMemoryHistory(prev => {
        const next = [...prev, { time: timeStr, value: memVal }];
        return next.slice(-15);
      });
      
      const evList = eventsRes.data?.data || [];
      setEvents(evList.slice(0, 8)); // Top 8 events
    } catch (err) {
      setError('Failed to fetch dashboard metrics. Please check connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Poll data every 5 seconds
  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshTrigger]);

  // Sync event alerts with Toast notifications
  useEffect(() => {
    const handleK8sAlert = (e) => {
      const { message, type } = e.detail;
      const toastType = type === 'Warning' ? 'warning' : type === 'Danger' ? 'error' : 'success';
      addToast(message, toastType);
      
      // Update local events list instantly
      setEvents(prev => [e.detail, ...prev].slice(0, 8));
    };

    window.addEventListener('k8s-alert', handleK8sAlert);
    return () => window.removeEventListener('k8s-alert', handleK8sAlert);
  }, [addToast]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchData(true)} />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header with Refresh Button */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cluster Overview</h1>
          <p className="text-sm text-gray-500">Real-time status of workspace workloads in namespace: <span className="font-semibold text-k8s-blue">{namespace}</span></p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin text-k8s-blue' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Current Cluster Info Card */}
      {clusterDetails && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg shadow-md border border-slate-700 text-white p-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-green-400 bg-green-950/50 px-2 py-0.5 rounded border border-green-800/40">
                  {clusterDetails.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">Version: {clusterDetails.version}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">{clusterDetails.name}</h2>
              <p className="text-xs text-slate-400 font-medium">Active Context: <span className="font-mono text-slate-200">{clusterDetails.context}</span></p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded px-4 py-2 text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Nodes</p>
                <p className="text-lg font-bold mt-0.5 text-slate-100">{clusterDetails.nodesCount}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded px-4 py-2 text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Control Planes</p>
                <p className="text-lg font-bold mt-0.5 text-indigo-300">{clusterDetails.controlPlaneCount}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded px-4 py-2 text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Workers</p>
                <p className="text-lg font-bold mt-0.5 text-teal-300">{clusterDetails.workerCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Pods */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pods</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.pods?.running + stats?.pods?.pending + stats?.pods?.failed}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded text-emerald-500">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium">
            <span className="text-emerald-600">● {stats?.pods?.running} Running</span>
            <span className="text-yellow-600">● {stats?.pods?.pending} Pending</span>
            <span className="text-red-600">● {stats?.pods?.failed} Failed</span>
          </div>
        </div>

        {/* Card 2: Deployments */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deployments</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.deployments?.available + stats?.deployments?.unavailable}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded text-k8s-blue">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs font-medium">
            <span className="text-k8s-blue">● {stats?.deployments?.available} Available</span>
            <span className="text-red-500">● {stats?.deployments?.unavailable} Unavailable</span>
          </div>
        </div>

        {/* Card 3: Nodes */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nodes</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.nodes?.ready + stats?.nodes?.notReady}
              </h3>
            </div>
            <div className="p-2.5 bg-orange-50 rounded text-orange-500">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs font-medium">
            <span className="text-orange-600">● {stats?.nodes?.ready} Ready</span>
            <span className="text-red-500">● {stats?.nodes?.notReady} Not Ready</span>
          </div>
        </div>

        {/* Card 4: Services */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.services?.clusterIP + stats?.services?.nodePort + stats?.services?.loadBalancer}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 rounded text-purple-500">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium">
            <span className="text-purple-600">● {stats?.services?.clusterIP} ClusterIP</span>
            <span className="text-purple-400">● {stats?.services?.nodePort} NodePort</span>
            <span className="text-indigo-600">● {stats?.services?.loadBalancer} LB</span>
          </div>
        </div>
      </div>

      {/* Real-time Monitoring Section */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-k8s-blue" />
          <h2 className="text-lg font-bold text-gray-800">Cluster Resource Metrics (Live Updates)</h2>
          <span className="text-xs text-gray-400 font-mono ml-auto">Polling every 5s</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Usage Chart */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-600 flex justify-between">
              <span>CPU Utilization</span>
              <span className="text-k8s-blue font-mono font-bold">
                {cpuHistory[cpuHistory.length - 1]?.value || 0}%
              </span>
            </h3>
            <div className="h-64 border border-gray-100 rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#326CE5" 
                    strokeWidth={2} 
                    dot={false}
                    name="CPU %" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Memory Usage Chart */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-600 flex justify-between">
              <span>Memory Utilization</span>
              <span className="text-emerald-500 font-mono font-bold">
                {memoryHistory[memoryHistory.length - 1]?.value || 0}%
              </span>
            </h3>
            <div className="h-64 border border-gray-100 rounded p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memoryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    dot={false}
                    name="Memory %" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events Panel */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-bold text-gray-800">Recent Cluster Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {events.map((evt) => {
                let badgeClass = 'bg-green-50 text-green-700 border-green-200';
                if (evt.type === 'Warning') badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                if (evt.type === 'Danger' || evt.type === 'Error') badgeClass = 'bg-red-50 text-red-700 border-red-200';

                return (
                  <tr key={evt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {new Date(evt.time).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700 font-mono">
                      {evt.resource}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                        {evt.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                      {evt.status}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-600 truncate max-w-xs">
                      {evt.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
