import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Calendar, Info, Shield, Layers, HelpCircle } from 'lucide-react';
import { deploymentApi } from '../../services/deploymentApi';

export const DeploymentDetailsDrawer = ({ isOpen, onClose, deployment }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && deployment) {
      fetchDetails();
    }
  }, [isOpen, deployment]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentApi.getDeploymentDetails(deployment.namespace, deployment.name);
      setDetails(data);
    } catch (err) {
      setError('Failed to fetch detailed deployment specifications.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !deployment) return null;

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
                <Layers className="w-5 h-5 text-k8s-blue" />
                Deployment Specifications
              </h2>
              <p className="text-xs font-mono text-gray-500 mt-0.5">{deployment.namespace}/{deployment.name}</p>
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
                <span className="text-sm text-gray-400 font-medium">Fetching details...</span>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : details ? (
              <div className="space-y-6 text-sm">
                
                {/* ── Metadata ─────────────────────────────── */}
                <Section title="Metadata" icon={<Info className="w-4 h-4" />}>
                  <Row label="Name" value={details.name} />
                  <Row label="Namespace" value={details.namespace} />
                  <Row label="Creation Time" value={details.creationTimestamp ? new Date(details.creationTimestamp).toLocaleString() : 'N/A'} />
                  
                  {/* Labels */}
                  <div className="py-2">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Labels:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(details.labels).length > 0 ? (
                        Object.entries(details.labels).map(([k, v]) => (
                          <span key={k} className="inline-block bg-gray-100 border border-gray-200 text-gray-600 font-mono text-[10px] px-2 py-0.5 rounded">
                            {k}: {v}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs italic">none</span>
                      )}
                    </div>
                  </div>

                  {/* Annotations */}
                  <div className="py-2">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Annotations:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5 space-y-1 max-h-36 overflow-y-auto font-mono text-[10px] text-gray-600">
                      {Object.keys(details.annotations).length > 0 ? (
                        Object.entries(details.annotations).map(([k, v]) => (
                          <div key={k} className="break-all">
                            <span className="font-semibold text-gray-800">{k}:</span> {v}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">none</span>
                      )}
                    </div>
                  </div>
                </Section>

                {/* ── Replicas Status ──────────────────────── */}
                <Section title="Replicas & Scale" icon={<Layers className="w-4 h-4" />}>
                  <div className="grid grid-cols-2 gap-4">
                    <Card label="Desired Replicas" value={details.replicas} color="blue" />
                    <Card label="Available Replicas" value={details.availableReplicas} color="green" />
                    <Card label="Ready Replicas" value={details.readyReplicas} color="emerald" />
                    <Card label="Unavailable Replicas" value={details.unavailableReplicas} color="red" />
                  </div>
                  <Row label="Deployment Strategy" value={details.strategy} />
                  <Row label="Match Selectors" value={Object.entries(details.selectors).map(([k, v]) => `${k}=${v}`).join(', ') || 'N/A'} />
                </Section>

                {/* ── Pod Spec / Container Info ───────────── */}
                <Section title="Container Specification" icon={<Shield className="w-4 h-4" />}>
                  <Row label="Container Image" value={details.containerImage} />
                  <Row label="Image Pull Policy" value={details.imagePullPolicy} />
                  <Row label="Container Ports" value={details.ports.join(', ') || 'none'} />
                  
                  {/* Resources */}
                  <div className="py-1">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Resource Requirements:</span>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded border border-gray-200 text-xs">
                      <div>
                        <span className="font-semibold block text-gray-600">Requests:</span>
                        <div className="font-mono text-gray-500 pl-2">
                          <div>CPU: {details.resources?.requests?.cpu || 'N/A'}</div>
                          <div>Memory: {details.resources?.requests?.memory || 'N/A'}</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold block text-gray-600">Limits:</span>
                        <div className="font-mono text-gray-500 pl-2">
                          <div>CPU: {details.resources?.limits?.cpu || 'N/A'}</div>
                          <div>Memory: {details.resources?.limits?.memory || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Env vars */}
                  <div className="py-1">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Environment Variables:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1.5 font-mono text-[11px] text-gray-600">
                      {details.env.length > 0 ? (
                        details.env.map((e, idx) => <div key={idx}>{e}</div>)
                      ) : (
                        <span className="text-gray-400 italic">none</span>
                      )}
                    </div>
                  </div>
                </Section>

                {/* ── Conditions ───────────────────────────── */}
                <Section title="Conditions" icon={<HelpCircle className="w-4 h-4" />}>
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-600">Condition</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {details.conditions.map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-semibold text-gray-700">{c.type}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${c.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-500 font-mono text-[10px]">{c.reason || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                {/* ── Events Timeline ──────────────────────── */}
                <Section title="Deployment Events" icon={<Calendar className="w-4 h-4" />}>
                  {details.events?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No events found for this resource.</p>
                  ) : (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {details.events.map((event, eventIdx) => (
                          <li key={eventIdx}>
                            <div className="relative pb-8">
                              {eventIdx !== details.events.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                    event.type === 'Warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    <Info className="w-4 h-4" />
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-xs font-bold text-gray-900">{event.reason}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{event.message}</p>
                                  </div>
                                  <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-semibold font-mono">
                                    {event.age}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
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

// Sub-components
const Section = ({ title, icon, children }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
      {icon}
      {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between py-1 border-b border-gray-50 text-xs">
    <span className="font-semibold text-gray-500">{label}:</span>
    <span className="font-mono text-gray-800 break-all pl-4 text-right">{value ?? 'N/A'}</span>
  </div>
);

const Card = ({ label, value, color = 'blue' }) => {
  const styles = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    red: 'bg-red-50 border-red-100 text-red-700'
  };
  return (
    <div className={`p-3 rounded border flex flex-col items-center justify-center text-center ${styles[color] || styles.blue}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</span>
      <span className="text-2xl font-bold mt-1 font-mono">{value}</span>
    </div>
  );
};
