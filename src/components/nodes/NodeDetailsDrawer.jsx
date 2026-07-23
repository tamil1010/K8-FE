import React, { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { X, Loader2, AlertTriangle, Shield, Cpu, HardDrive, Layers, Activity, Search, Tag } from 'lucide-react';
import API from '../../ApiCall/Api';
import { PodDetailsModal } from '../pods/PodDetailsModal';
=======
import { useNavigate } from 'react-router-dom';
import { X, Loader2, AlertTriangle, Shield, Cpu, HardDrive, Layers, Activity, Search, Tag, Calendar } from 'lucide-react';
import { nodeApi } from '../../services/nodeApi';
>>>>>>> Stashed changes

export const NodeDetailsDrawer = ({ isOpen, onClose, node }) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [pods, setPods] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [labelSearch, setLabelSearch] = useState('');

  useEffect(() => {
    if (isOpen && node) {
      fetchNodeInfo();
    }
  }, [isOpen, node]);

  const fetchNodeInfo = async () => {
    setLoading(true);
    setError(null);
    try {
<<<<<<< Updated upstream
      const [detailsRes, podsRes] = await Promise.all([
        API.get(`/nodes/${node.name}`),
        API.get(`/node-mgmt/nodes/${node.name}/pods`)
      ]);
      setDetails(detailsRes.data?.data);
      setPods(podsRes.data?.data || []);
=======
      const [detailsData, podsData, eventsData] = await Promise.all([
        nodeApi.getNodeDetails(node.name),
        nodeApi.getNodePods(node.name),
        nodeApi.getNodeEvents(node.name)
      ]);
      setDetails(detailsData);
      setPods(podsData);
      setEvents(eventsData);
>>>>>>> Stashed changes
    } catch (err) {
      setError('Failed to fetch node specifications, pods, or events.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !node) return null;

  // Calculate CPU and Memory usage percentages for progress bars
  const cpuUsagePct = details?.cpuUsagePct !== 'N/A' && details?.cpuUsagePct !== undefined ? details.cpuUsagePct : 0;
  const memUsagePct = details?.memUsagePct !== 'N/A' && details?.memUsagePct !== undefined ? details.memUsagePct : 0;
  const podsUsagePct = details && details.maxPods ? Math.round(((details.runningPods || pods.length) / details.maxPods) * 100) : 0;

  const getConditionStatus = (type) => {
    const cond = details?.conditions?.find(c => c.type === type);
    return cond ? cond.status : 'Unknown';
  };

  const conditionList = [
    { type: 'Ready', expected: 'True', label: 'Ready' },
    { type: 'MemoryPressure', expected: 'False', label: 'MemoryPressure' },
    { type: 'DiskPressure', expected: 'False', label: 'DiskPressure' },
    { type: 'PIDPressure', expected: 'False', label: 'PIDPressure' },
    { type: 'NetworkUnavailable', expected: 'False', label: 'NetworkUnavailable' },
  ];

  // Filter labels
  const filteredLabels = details ? Object.entries(details.labels || {}).filter(([k, v]) => 
    k.toLowerCase().includes(labelSearch.toLowerCase()) || 
    v.toString().toLowerCase().includes(labelSearch.toLowerCase())
  ) : [];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out border-l border-gray-200 select-text">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-k8s-blue" />
                Node Specifications & Metrics
              </h2>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{node.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-k8s-blue" />
                <span className="text-sm text-gray-400 font-medium">Fetching node details...</span>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : details ? (
              <div className="space-y-6 text-sm">
                
                {/* ── Current Usage (Progress Bars) ──────────────── */}
                <Section title="Current Usage" icon={<Activity className="w-4 h-4" />}>
                  <div className="space-y-4">
                    {/* CPU Usage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> CPU Usage</span>
                        {details?.cpuUsagePct !== undefined && details?.cpuUsagePct !== null && details?.cpuUsagePct !== 'N/A' ? (
                          <span className="font-mono text-gray-800">{details.cpuUsagePct}% of {details.cpuAllocatable}</span>
                        ) : (
                          <span className="font-mono text-gray-400">N/A</span>
                        )}
                      </div>
                      {details?.cpuUsagePct !== undefined && details?.cpuUsagePct !== null && details?.cpuUsagePct !== 'N/A' && (
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              details.cpuUsagePct > 85 ? 'bg-red-500' : details.cpuUsagePct > 60 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${details.cpuUsagePct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Memory Usage</span>
                        {details?.memUsagePct !== undefined && details?.memUsagePct !== null && details?.memUsagePct !== 'N/A' ? (
                          <span className="font-mono text-gray-800">{details.memUsagePct}% of {details.memoryAllocatable}</span>
                        ) : (
                          <span className="font-mono text-gray-400">N/A</span>
                        )}
                      </div>
                      {details?.memUsagePct !== undefined && details?.memUsagePct !== null && details?.memUsagePct !== 'N/A' && (
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              details.memUsagePct > 85 ? 'bg-red-500' : details.memUsagePct > 60 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${details.memUsagePct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Pod Count */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Pod Count</span>
                        {details?.maxPods ? (
                          <span className="font-mono text-gray-800">{podsUsagePct}% ({details.runningPods || pods.length} / {details.maxPods} Pods)</span>
                        ) : (
                          <span className="font-mono text-gray-400">N/A</span>
                        )}
                      </div>
                      {details?.maxPods ? (
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              podsUsagePct > 85 ? 'bg-red-500' : podsUsagePct > 60 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${podsUsagePct}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Section>

                {/* ── Basic Information ───────────────── */}
                <Section title="Basic Information" icon={<Shield className="w-4 h-4" />}>
                  <Row label="Node Name" value={details.name} />
                  <Row label="Hostname" value={details.hostname} />
                  <Row label="Internal IP" value={details.internalIP} />
                  <Row label="External IP" value={details.externalIP || '<none>'} />
                  <Row label="Architecture" value={details.architecture} />
                  <Row label="OS" value={details.osImage} />
                  <Row label="Kernel Version" value={details.kernelVersion} />
                  <Row label="Container Runtime" value={details.containerRuntimeVersion} />
                  <Row label="Kubernetes Version" value={details.kubeletVersion} />
                </Section>

                {/* ── Capacity ───────────────── */}
                <Section title="Capacity" icon={<HardDrive className="w-4 h-4" />}>
                  <Row label="Total CPU" value={details.cpuCapacity} />
                  <Row label="Total Memory" value={details.memoryCapacity} />
                  <Row label="Maximum Pods" value={details.maxPods || 110} />
                </Section>

                {/* ── Node Conditions ────────────────────── */}
                <Section title="Node Conditions" icon={<Activity className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-2.5">
                    {conditionList.map((item, i) => {
                      const status = getConditionStatus(item.type);
                      const isHealthy = status === item.expected;
                      return (
                        <span 
                          key={i} 
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                            isHealthy 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {item.label} {isHealthy ? '✅' : '❌'}
                        </span>
                      );
                    })}
                  </div>
                </Section>

                {/* ── Labels ────────────────────── */}
                <Section title="Labels" icon={<Tag className="w-4 h-4" />}>
                  <div className="py-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-500">Node Labels ({Object.keys(details.labels || {}).length})</span>
                      <div className="relative w-36">
                        <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1.5" />
                        <input
                          type="text"
                          placeholder="Search labels..."
                          value={labelSearch}
                          onChange={e => setLabelSearch(e.target.value)}
                          className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:border-k8s-blue bg-gray-50"
                        />
                      </div>
                    </div>
                    {Object.keys(details.labels || {}).length === 0 ? (
                      <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        No Labels
                      </div>
                    ) : filteredLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded border border-gray-200 max-h-36 overflow-y-auto">
                        {filteredLabels.map(([k, v]) => (
                          <span key={k} className="inline-block bg-white border border-gray-200 text-gray-600 font-mono text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                            {k}={v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200 text-center">
                        No labels match search query
                      </div>
                    )}
                  </div>
                </Section>

                {/* ── Taints ────────────────────── */}
                <Section title="Taints" icon={<Tag className="w-4 h-4" />}>
                  {details.taints && details.taints.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded border border-gray-200 font-mono text-[10px]">
                      {details.taints.map((t, idx) => (
                        <span key={idx} className="inline-block bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded shadow-sm">
                          {t.key}{t.value ? `=${t.value}` : ''}:{t.effect}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      No Taints
                    </div>
                  )}
                </Section>

                {/* ── Running Pods on Node ───────────────── */}
                <Section title="Running Pods" icon={<Layers className="w-4 h-4" />}>
                  {pods.length === 0 ? (
                    <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      No Pods
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-left text-xs divide-y divide-gray-200">
                        <thead className="bg-gray-50 font-semibold text-gray-500">
                          <tr>
                            <th className="px-4 py-2.5">Pod Name</th>
                            <th className="px-4 py-2.5">Namespace</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5 text-right">Restart Count</th>
                            <th className="px-4 py-2.5 text-right">Age</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700 bg-white">
                          {pods.map((pod, i) => (
                            <tr 
                              key={i} 
                              onClick={() => {
                                onClose();
                                navigate('/pods');
                              }}
                              className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-2.5 font-semibold text-k8s-blue hover:underline break-all max-w-[180px]">{pod.name}</td>
                              <td className="px-4 py-2.5 text-gray-500">{pod.namespace}</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  pod.status === 'Running' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {pod.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-800 font-bold">{pod.restarts}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">{pod.age || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>

                {/* ── Recent Events ───────────────── */}
                <Section title="Recent Events" icon={<Calendar className="w-4 h-4" />}>
                  {events.length === 0 ? (
                    <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      No Events
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-left text-xs divide-y divide-gray-200">
                        <thead className="bg-gray-50 font-semibold text-gray-500">
                          <tr>
                            <th className="px-4 py-2.5">Type</th>
                            <th className="px-4 py-2.5">Reason</th>
                            <th className="px-4 py-2.5">Message</th>
                            <th className="px-4 py-2.5 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700 bg-white">
                          {events.map((e, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  e.type === 'Normal' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {e.type}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-semibold text-gray-800">{e.reason}</td>
                              <td className="px-4 py-2.5 text-gray-600 break-words max-w-[220px]">{e.message}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500 whitespace-nowrap">{e.lastSeen || e.age || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>

              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Close Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-gray-100 pb-1.5 select-none">
      {icon}
      {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between py-1 border-b border-b-gray-50 text-xs">
    <span className="font-semibold text-gray-500 select-none">{label}:</span>
    <span className="font-mono text-gray-800 break-all pl-4 text-right">{value ?? 'N/A'}</span>
  </div>
);
