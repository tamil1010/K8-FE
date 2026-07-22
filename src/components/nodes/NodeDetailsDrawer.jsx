import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Shield, Cpu, HardDrive, Layers, Activity, Search, Tag } from 'lucide-react';
import { nodeApi } from '../../services/nodeApi';
import { PodDetailsModal } from '../pods/PodDetailsModal';

export const NodeDetailsDrawer = ({ isOpen, onClose, node }) => {
  const [details, setDetails] = useState(null);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [labelSearch, setLabelSearch] = useState('');
  
  // Selected Pod details state (to show nested details modal)
  const [selectedPod, setSelectedPod] = useState(null);

  useEffect(() => {
    if (isOpen && node) {
      fetchNodeInfo();
    }
  }, [isOpen, node]);

  const fetchNodeInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailsData, podsData] = await Promise.all([
        nodeApi.getNodeDetails(node.name),
        nodeApi.getNodePods(node.name)
      ]);
      setDetails(detailsData);
      setPods(podsData);
    } catch (err) {
      setError('Failed to fetch node specifications or running pods.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !node) return null;

  // Calculate CPU and Memory usage percentages for progress bars
  const cpuUsagePct = details?.cpuUsagePct !== 'N/A' && details?.cpuUsagePct !== undefined ? details.cpuUsagePct : 0;
  const memUsagePct = details?.memUsagePct !== 'N/A' && details?.memUsagePct !== undefined ? details.memUsagePct : 0;

  const getConditionColor = (type, status) => {
    if (type === 'Ready') {
      return status === 'True' 
        ? 'bg-green-50 text-green-700 border-green-200' 
        : 'bg-red-50 text-red-700 border-red-200';
    }
    // Pressure conditions (MemoryPressure, DiskPressure, PIDPressure)
    // and NetworkUnavailable are bad if "True"
    if (type.includes('Pressure') || type === 'NetworkUnavailable') {
      return status === 'True'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-green-50 text-green-700 border-green-200';
    }
    return status === 'True'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-gray-50 text-gray-700 border-gray-200';
  };

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
                
                {/* ── Resource Usage Charts ──────────────── */}
                <Section title="Resource Utilization" icon={<Activity className="w-4 h-4" />}>
                  <div className="space-y-4">
                    {/* CPU Usage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> CPU Usage</span>
                        <span className="font-mono text-gray-800">{cpuUsagePct}% of {details.cpuAllocatable}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            cpuUsagePct > 85 ? 'bg-red-500' : cpuUsagePct > 60 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${cpuUsagePct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 flex justify-between font-mono">
                        <span>Capacity: {details.cpuCapacity}</span>
                        <span>Allocatable: {details.cpuAllocatable}</span>
                      </div>
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Memory Usage</span>
                        <span className="font-mono text-gray-800">{memUsagePct}% of {details.memoryAllocatable}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden border border-gray-200">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            memUsagePct > 85 ? 'bg-red-500' : memUsagePct > 60 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${memUsagePct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 flex justify-between font-mono">
                        <span>Capacity: {details.memoryCapacity}</span>
                        <span>Allocatable: {details.memoryAllocatable}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
                      <div>
                        <span className="font-semibold text-gray-500 block">Pods Capacity:</span>
                        <span className="font-mono font-bold text-gray-900">{details.runningPods || pods.length} / {details.maxPods || 110} Pods</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-500 block">Ephemeral Storage:</span>
                        <span className="font-mono font-bold text-gray-900">{details.ephemeralStorage || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </Section>

                {/* ── Metadata & Node Info ───────────────── */}
                <Section title="General Information" icon={<Shield className="w-4 h-4" />}>
                  <Row label="Node Name" value={details.name} />
                  <Row label="Role" value={details.role} />
                  <Row label="Status" value={details.status} />
                  <Row label="Internal IP" value={details.internalIP} />
                  <Row label="External IP" value={details.externalIP || '<none>'} />
                  <Row label="Hostname" value={details.hostname} />
                  <Row label="OS Image" value={details.osImage} />
                  <Row label="Architecture" value={details.architecture} />
                  <Row label="Created" value={new Date(details.creationTimestamp).toLocaleString()} />
                </Section>

                {/* ── Node Conditions ────────────────────── */}
                <Section title="Node Conditions" icon={<Activity className="w-4 h-4" />}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {details.conditions.map((c, i) => (
                      <div key={i} className={`p-3 rounded border text-center flex flex-col justify-center items-center ${getConditionColor(c.type, c.status)}`}>
                        <span className="text-xs font-bold uppercase tracking-wider">{c.type}</span>
                        <span className="text-[10px] font-mono mt-1 opacity-80">{c.reason || 'N/A'}</span>
                        <span className="text-[9px] font-semibold mt-1 bg-white/60 px-1.5 py-0.5 rounded">Status: {c.status}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* ── Labels & Taints ────────────────────── */}
                <Section title="Labels & Taints" icon={<Tag className="w-4 h-4" />}>
                  {/* Labels Section */}
                  <div className="py-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-500">Labels ({Object.keys(details.labels).length})</span>
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
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1.5 bg-gray-50 rounded border border-gray-200">
                      {filteredLabels.length > 0 ? (
                        filteredLabels.map(([k, v]) => (
                          <span key={k} className="inline-block bg-white border border-gray-200 text-gray-600 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                            {k}: <span className="text-gray-900 font-semibold">{v}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No labels match filter</span>
                      )}
                    </div>
                  </div>

                  {/* Taints Section */}
                  <div className="py-1">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Taints:</span>
                    {details.taints && details.taints.length > 0 ? (
                      <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 rounded border border-gray-200 font-mono text-[9px]">
                        {details.taints.map((t, idx) => (
                          <span key={idx} className="inline-block bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded shadow-sm">
                            {t.key}{t.value ? `=${t.value}` : ''}:{t.effect}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No taints applied</p>
                    )}
                  </div>
                </Section>

                {/* ── System Information ─────────────────── */}
                <Section title="System Information" icon={<Shield className="w-4 h-4" />}>
                  <Row label="Kernel Version" value={details.kernelVersion} />
                  <Row label="OS Image" value={details.osImage} />
                  <Row label="Container Runtime Version" value={details.containerRuntimeVersion} />
                  <Row label="Kubelet Version" value={details.kubeletVersion} />
                  <Row label="Kube-Proxy Version" value={details.kubeProxyVersion} />
                  <Row label="Machine ID" value={details.systemInfo?.machineID} />
                  <Row label="Boot ID" value={details.systemInfo?.bootID} />
                  <Row label="System UUID" value={details.systemInfo?.systemUUID} />
                </Section>

                {/* ── Running Pods on Node ───────────────── */}
                <Section title="Pods Running On Node" icon={<Layers className="w-4 h-4" />}>
                  {pods.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No pods running on this node.</p>
                  ) : (
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-left text-xs divide-y divide-gray-200">
                        <thead className="bg-gray-50 font-semibold text-gray-500">
                          <tr>
                            <th className="px-4 py-2">Pod Name</th>
                            <th className="px-4 py-2">Namespace</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2 text-right">Restarts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700 bg-white">
                          {pods.map((pod, i) => (
                            <tr 
                              key={i} 
                              onClick={() => setSelectedPod(pod)}
                              className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-2 font-semibold text-k8s-blue hover:underline break-all max-w-[200px]">{pod.name}</td>
                              <td className="px-4 py-2 text-gray-500">{pod.namespace}</td>
                              <td className="px-4 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  pod.status === 'Running' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {pod.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-800 font-bold">{pod.restarts}</td>
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

      {/* Render nested PodDetailsModal if a pod is clicked in the table */}
      {selectedPod && (
        <PodDetailsModal
          pod={selectedPod}
          onClose={() => setSelectedPod(null)}
        />
      )}
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
  <div className="flex justify-between py-1 border-b border-gray-50 text-xs">
    <span className="font-semibold text-gray-500 select-none">{label}:</span>
    <span className="font-mono text-gray-800 break-all pl-4 text-right">{value ?? 'N/A'}</span>
  </div>
);
