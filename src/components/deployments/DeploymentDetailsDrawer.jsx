import React, { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { X, Loader2, AlertTriangle, Calendar, Info, Shield, Layers, HelpCircle } from 'lucide-react';
import API from '../../ApiCall/Api';
=======
import { X, Loader2, AlertTriangle, Calendar, Info, Shield, Layers, HelpCircle, Activity, Cpu, HardDrive, RefreshCw, FileText, Download, Check, Clipboard } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { deploymentApi } from '../../services/deploymentApi';
import { PodDetailsModal } from '../pods/PodDetailsModal';
>>>>>>> Stashed changes

export const DeploymentDetailsDrawer = ({ isOpen, onClose, deployment }) => {
  const [details, setDetails] = useState(null);
  const [replicaSets, setReplicaSets] = useState([]);
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, pods_rs, events, describe
  const [describeText, setDescribeText] = useState('');
  const [loadingDescribe, setLoadingDescribe] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);

  useEffect(() => {
    if (isOpen && deployment) {
      fetchDetails();
    }
  }, [isOpen, deployment]);

  useEffect(() => {
    if (isOpen && deployment && activeTab === 'describe') {
      fetchDescribe();
    }
  }, [activeTab, isOpen, deployment]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
<<<<<<< Updated upstream
      const res = await API.get(`/deployment-mgmt/${deployment.namespace}/${deployment.name}`);
      setDetails(res.data?.data);
=======
      const [detailsData, podsData, rsData] = await Promise.all([
        deploymentApi.getDeploymentDetails(deployment.namespace, deployment.name),
        deploymentApi.getDeploymentPods(deployment.namespace, deployment.name),
        deploymentApi.getDeploymentReplicaSets(deployment.namespace, deployment.name)
      ]);
      setDetails(detailsData);
      setPods(podsData);
      setReplicaSets(rsData);
>>>>>>> Stashed changes
    } catch (err) {
      setError('Failed to fetch detailed deployment specifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDescribe = async () => {
    setLoadingDescribe(true);
    try {
      const desc = await deploymentApi.describeDeployment(deployment.namespace, deployment.name);
      setDescribeText(desc);
    } catch (err) {
      setDescribeText('Failed to generate description.');
    } finally {
      setLoadingDescribe(false);
    }
  };

  if (!isOpen || !deployment) return null;

  // Determine rollout status badge
  const getRolloutStatus = (details) => {
    if (!details) return { label: 'Unknown', style: 'bg-gray-100 text-gray-800' };
    const spec = details.replicas;
    const avail = details.availableReplicas;
    const ready = details.readyReplicas;

    const conditions = details.conditions || [];
    const replicaFailure = conditions.find(c => c.type === 'ReplicaFailure' && c.status === 'True');
    if (replicaFailure) {
      return { label: 'Replica Failure', style: 'bg-red-100 text-red-800 border-red-200 border' };
    }

    if (avail === spec && ready === spec) {
      return { label: 'Rollout Complete', style: 'bg-green-100 text-green-800 border-green-200 border' };
    }

    const progressing = conditions.find(c => c.type === 'Progressing');
    if (progressing && progressing.status === 'True') {
      return { label: 'Progressing', style: 'bg-blue-100 text-blue-800 border-blue-200 border animate-pulse' };
    }

    return { label: 'Available', style: 'bg-amber-100 text-amber-800 border-amber-200 border' };
  };

  const rolloutStatus = getRolloutStatus(details);

  const handleCopyDescribe = () => {
    navigator.clipboard.writeText(describeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export report helper
  const exportAsCSV = () => {
    if (!details) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Name', details.name],
      ['Namespace', details.namespace],
      ['UID', details.uid],
      ['Desired Replicas', details.replicas],
      ['Available Replicas', details.availableReplicas],
      ['Ready Replicas', details.readyReplicas],
      ['Strategy', details.strategy],
      ['Image', details.containerImage],
      ['CPU Usage', details.cpuUsage],
      ['Memory Usage', details.memUsage]
    ];
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${details.name}-deployment-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Deterministic trend data
  const trendData = [
    { name: '10:00', cpu: 32, memory: 64, restarts: 0 },
    { name: '10:10', cpu: 45, memory: 65, restarts: 0 },
    { name: '10:20', cpu: 55, memory: 68, restarts: 1 },
    { name: '10:30', cpu: 42, memory: 70, restarts: 1 },
    { name: '10:40', cpu: 62, memory: 72, restarts: 1 },
    { name: '10:50', cpu: 58, memory: 75, restarts: 1 },
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out border-l border-gray-200 select-text">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-k8s-blue" />
                <h2 className="text-lg font-bold text-gray-900">Deployment Details</h2>
                {details && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${rolloutStatus.style}`}>
                    {rolloutStatus.label}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{deployment.namespace}/{deployment.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDetails}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh Details"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 border-b border-gray-200 bg-gray-50 flex gap-4 text-xs font-semibold text-gray-500 select-none flex-shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-k8s-blue text-k8s-blue font-bold' : 'border-transparent hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('pods_rs')}
              className={`py-3 border-b-2 transition-colors ${activeTab === 'pods_rs' ? 'border-k8s-blue text-k8s-blue font-bold' : 'border-transparent hover:text-gray-700'}`}
            >
              Pods & ReplicaSets ({pods.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 border-b-2 transition-colors ${activeTab === 'events' ? 'border-k8s-blue text-k8s-blue font-bold' : 'border-transparent hover:text-gray-700'}`}
            >
              Events & Conditions
            </button>
            <button
              onClick={() => setActiveTab('describe')}
              className={`py-3 border-b-2 transition-colors ${activeTab === 'describe' ? 'border-k8s-blue text-k8s-blue font-bold' : 'border-transparent hover:text-gray-700'}`}
            >
              Describe Output
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-k8s-blue" />
                <span className="text-sm text-gray-400 font-medium">Fetching deployment information...</span>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : details ? (
              <div className="space-y-6 text-sm">
                
                {/* ── Tab 1: Overview ─────────────────────── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Live resource stats */}
                    <Section title="Resource Utilization" icon={<Activity className="w-4 h-4" />}>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aggregate CPU</span>
                          <span className="text-sm font-bold font-mono text-gray-800 mt-1 block">{details.cpuUsage}</span>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aggregate Memory</span>
                          <span className="text-sm font-bold font-mono text-gray-800 mt-1 block">{details.memUsage}</span>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Network Traffic</span>
                          <span className="text-sm font-bold font-mono text-gray-800 mt-1 block">{details.netUsage}</span>
                        </div>
                      </div>

                      {/* Mini Area Charts */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 h-44">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-blue-500" /> CPU Usage Trend
                          </span>
                          <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={trendData}>
                              <defs>
                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={8} />
                              <YAxis stroke="#9ca3af" fontSize={8} />
                              <Tooltip />
                              <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 h-44">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5 text-emerald-500" /> Memory Usage Trend
                          </span>
                          <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={trendData}>
                              <defs>
                                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={8} />
                              <YAxis stroke="#9ca3af" fontSize={8} />
                              <Tooltip />
                              <Area type="monotone" dataKey="memory" stroke="#10b981" fillOpacity={1} fill="url(#colorMem)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </Section>

                    {/* Timeline */}
                    <Section title="Events Timeline" icon={<Calendar className="w-4 h-4" />}>
                      <div className="bg-gray-50 border border-gray-200 rounded p-4">
                        <div className="relative border-l border-blue-200 pl-4 space-y-4">
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                            <div className="text-xs font-semibold text-gray-800">10:00 - Deployment Created</div>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                            <div className="text-xs font-semibold text-gray-800">10:01 - Image Pulled</div>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                            <div className="text-xs font-semibold text-gray-800">10:02 - Container Started</div>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                            <div className="text-xs font-semibold text-gray-800">10:03 - Readiness Probe Passed</div>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                            <div className="text-xs font-bold text-green-700">10:04 - Deployment Available</div>
                          </div>
                        </div>
                      </div>
                    </Section>

                    {/* Metadata & General */}
                    <Section title="General Specifications" icon={<Info className="w-4 h-4" />}>
                      <Row label="Deployment UID" value={details.uid} />
                      <Row label="Strategy Type" value={details.strategy} />
                      <Row label="Strategy Details" value={JSON.stringify(details.strategyDetails?.rollingUpdate || {})} />
                      <Row label="Match Selectors" value={Object.entries(details.selectors).map(([k, v]) => `${k}=${v}`).join(', ')} />
                      <Row label="Age" value={details.age} />
                      <Row label="Created" value={new Date(details.creationTimestamp).toLocaleString()} />
                    </Section>

                    {/* Labels & Annotations */}
                    <Section title="Labels & Annotations" icon={<HelpCircle className="w-4 h-4" />}>
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-500 block">Labels:</span>
                        <div className="flex flex-wrap gap-1 bg-gray-50 p-2 rounded border border-gray-200 max-h-36 overflow-y-auto">
                          {Object.entries(details.labels).map(([k, v]) => (
                            <span key={k} className="inline-block bg-white border border-gray-200 text-gray-700 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                              {k}={v}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 block">Annotations:</span>
                        <div className="bg-gray-50 border border-gray-200 rounded p-2.5 space-y-1 max-h-36 overflow-y-auto font-mono text-[10px] text-gray-600">
                          {Object.entries(details.annotations).map(([k, v]) => (
                            <div key={k} className="break-all">
                              <span className="font-semibold text-gray-800">{k}:</span> {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Section>

                    {/* Pod template spec */}
                    <Section title="Pod Template" icon={<Shield className="w-4 h-4" />}>
                      <Row label="Container Image" value={details.containerImage} />
                      <Row label="Image Pull Policy" value={details.imagePullPolicy} />
                      <Row label="Container Ports" value={details.ports.join(', ') || 'none'} />
                      <Row label="Node Selector" value={JSON.stringify(details.nodeSelector) || '<none>'} />
                      <Row label="Tolerations" value={JSON.stringify(details.tolerations) || '<none>'} />
                      <Row label="Affinity Rules" value={JSON.stringify(details.affinity) || '<none>'} />
                      
                      <div className="py-2">
                        <span className="block text-xs font-semibold text-gray-500 mb-1">Mounted Volumes ({details.volumes?.length || 0}):</span>
                        <div className="bg-gray-50 border border-gray-200 rounded p-2.5 space-y-1.5 max-h-36 overflow-y-auto font-mono text-[10px] text-gray-600">
                          {details.volumes && details.volumes.length > 0 ? (
                            details.volumes.map((v, i) => (
                              <div key={i} className="border-b border-gray-100 last:border-0 pb-1">
                                <span className="font-bold text-gray-800">{v.name}</span>
                                {v.configMap && ` (ConfigMap: ${v.configMap.name})`}
                                {v.secret && ` (Secret: ${v.secret.secretName})`}
                                {v.persistentVolumeClaim && ` (PVC: ${v.persistentVolumeClaim.claimName})`}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">none</span>
                          )}
                        </div>
                      </div>
                    </Section>
                  </div>
                )}

                {/* ── Tab 2: Pods & ReplicaSets ───────────── */}
                {activeTab === 'pods_rs' && (
                  <div className="space-y-6">
                    {/* ReplicaSets */}
                    <Section title="Owned ReplicaSets" icon={<Layers className="w-4 h-4" />}>
                      <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-left text-xs divide-y divide-gray-200">
                          <thead className="bg-gray-50 font-semibold text-gray-500">
                            <tr>
                              <th className="px-4 py-2.5">ReplicaSet Name</th>
                              <th className="px-4 py-2.5 text-center">Desired</th>
                              <th className="px-4 py-2.5 text-center">Current</th>
                              <th className="px-4 py-2.5 text-center">Ready</th>
                              <th className="px-4 py-2.5 text-right">Age</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700 bg-white">
                            {replicaSets.map((rs, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-semibold text-gray-800">{rs.name}</td>
                                <td className="px-4 py-2.5 text-center font-bold">{rs.desired}</td>
                                <td className="px-4 py-2.5 text-center font-bold">{rs.current}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-green-600">{rs.ready}</td>
                                <td className="px-4 py-2.5 text-right text-gray-400">{rs.age}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>

                    {/* Pods list */}
                    <Section title="Pods Workloads" icon={<Layers className="w-4 h-4" />}>
                      <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-left text-xs divide-y divide-gray-200">
                          <thead className="bg-gray-50 font-semibold text-gray-500">
                            <tr>
                              <th className="px-4 py-2.5">Pod Name</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">CPU</th>
                              <th className="px-4 py-2.5">Memory</th>
                              <th className="px-4 py-2.5 text-center">Restarts</th>
                              <th className="px-4 py-2.5 text-right">Age</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono text-[11px] text-gray-700 bg-white">
                            {pods.map((pod, i) => (
                              <tr
                                key={i}
                                onClick={() => setSelectedPod(pod)}
                                className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                              >
                                <td className="px-4 py-2.5 font-bold text-k8s-blue hover:underline break-all max-w-[200px]">{pod.name}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    pod.status === 'Running' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {pod.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-gray-800">{pod.cpu}</td>
                                <td className="px-4 py-2.5 font-semibold text-gray-800">{pod.memory}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-gray-800">{pod.restarts}</td>
                                <td className="px-4 py-2.5 text-right text-gray-400">{pod.age}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>
                  </div>
                )}

                {/* ── Tab 3: Events & Conditions ──────────── */}
                {activeTab === 'events' && (
                  <div className="space-y-6">
                    {/* Conditions */}
                    <Section title="Deployment Conditions" icon={<HelpCircle className="w-4 h-4" />}>
                      <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-left text-xs divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold text-gray-600">Condition</th>
                              <th className="px-4 py-2.5 font-semibold text-gray-600">Status</th>
                              <th className="px-4 py-2.5 font-semibold text-gray-600">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {details.conditions.map((c, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-semibold text-gray-700">{c.type}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${c.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-500 font-mono text-[10px]">{c.reason || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>

                    {/* Events Table */}
                    <Section title="Kubernetes Events Logs" icon={<Calendar className="w-4 h-4" />}>
                      {details.events?.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No events found for this resource.</p>
                      ) : (
                        <div className="border border-gray-200 rounded overflow-hidden">
                          <table className="w-full text-left text-xs divide-y divide-gray-200">
                            <thead className="bg-gray-50 font-semibold text-gray-500">
                              <tr>
                                <th className="px-4 py-2.5">Type</th>
                                <th className="px-4 py-2.5">Reason</th>
                                <th className="px-4 py-2.5">Message</th>
                                <th className="px-4 py-2.5 text-right">Age</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                              {details.events.map((e, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      e.type === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {e.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 font-bold font-mono text-gray-900">{e.reason}</td>
                                  <td className="px-4 py-2 text-gray-600 max-w-xs break-words">{e.message}</td>
                                  <td className="px-4 py-2 text-right font-mono text-gray-400 whitespace-nowrap">{e.age}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Section>
                  </div>
                )}

                {/* ── Tab 4: Describe Output ─────────────── */}
                {activeTab === 'describe' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-xs font-semibold text-gray-500">kubectl describe output:</span>
                      <button
                        onClick={handleCopyDescribe}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clipboard className="w-3.5 h-3.5 text-gray-500" />}
                        {copied ? 'Copied' : 'Copy Output'}
                      </button>
                    </div>
                    {loadingDescribe ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-k8s-blue" />
                        <span className="text-xs text-gray-400">Loading description spec...</span>
                      </div>
                    ) : (
                      <pre className="bg-gray-950 p-5 rounded font-mono text-xs text-gray-200 leading-relaxed overflow-x-auto select-text shadow-inner border border-gray-900">
                        {describeText}
                      </pre>
                    )}
                  </div>
                )}

              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50 flex-shrink-0 select-none">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportAsCSV}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                Export CSV Report
              </button>
            </div>
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
