import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { podApi } from '../../services/podApi';

/**
 * PodDescribeModal — kubectl describe pod equivalent
 * Props:
 *   pod     { name, namespace }
 *   onClose () => void
 */
export const PodDescribeModal = ({ pod, onClose }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDescribe = useCallback(() => {
    if (!pod) return;
    setLoading(true);
    setError(null);
    podApi.describePod(pod.namespace, pod.name)
      .then(setData)
      .catch(() => setError('Failed to load pod description.'))
      .finally(() => setLoading(false));
  }, [pod]);

  useEffect(() => {
    fetchDescribe();
  }, [fetchDescribe]);

  if (!pod) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-gray-950 rounded-lg shadow-2xl w-full max-w-4xl mx-4 flex flex-col animate-[fadeIn_0.15s_ease-out] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">kubectl describe pod</span>
              <span className="text-xs font-semibold text-white font-mono">{pod.name}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">namespace: {pod.namespace}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDescribe}
              disabled={loading}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-red-700 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-950 space-y-5 min-h-0" style={{ maxHeight: 'calc(90vh - 110px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2 text-sm text-gray-400">Loading description…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded p-4">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-5 text-xs font-mono">

              {/* ── Metadata ─────────────────────────────── */}
              <DescSection title="Metadata" color="blue">
                <KVRow k="Name"        v={data.name} />
                <KVRow k="Namespace"   v={data.namespace} />
                <KVRow k="Node"        v={data.node} />
                <KVRow k="Priority"    v={data.priority ?? 0} />
                <KVRow k="Start Time"  v={data.startTime ? new Date(data.startTime).toLocaleString() : '<none>'} />
                <KVRow k="Created"     v={data.creationTimestamp ? new Date(data.creationTimestamp).toLocaleString() : '<none>'} />
                <KVRow k="Age"         v={data.age} />
                <KVRow k="Service Account" v={data.serviceAccountName} />
              </DescSection>

              {/* ── Status ───────────────────────────────── */}
              <DescSection title="Status" color="green">
                <KVRow k="Phase"    v={data.status} highlight />
                <KVRow k="Pod IP"   v={data.podIP} />
                <KVRow k="Host IP"  v={data.hostIP} />
                <KVRow k="QoS"      v={data.qosClass} />
              </DescSection>

              {/* ── Labels & Annotations ─────────────────── */}
              {Object.keys(data.labels).length > 0 && (
                <DescSection title="Labels" color="purple">
                  {Object.entries(data.labels).map(([k, v]) => (
                    <KVRow key={k} k={k} v={v} />
                  ))}
                </DescSection>
              )}

              {/* ── Owner References ─────────────────────── */}
              {data.ownerReferences?.length > 0 && (
                <DescSection title="Controlled By" color="yellow">
                  {data.ownerReferences.map((o, i) => (
                    <KVRow key={i} k={o.kind} v={o.name} />
                  ))}
                </DescSection>
              )}

              {/* ── Containers ───────────────────────────── */}
              <DescSection title="Containers" color="cyan">
                {data.containers?.map((c) => (
                  <div key={c.name} className="mb-4 pl-3 border-l border-gray-700">
                    <p className="text-cyan-300 font-bold mb-1">{c.name}:</p>
                    <KVRow k="  Image"         v={c.image} />
                    <KVRow k="  Image Policy"  v={c.imagePullPolicy} />
                    <KVRow k="  State"         v={`${c.state}${c.stateReason ? ' (' + c.stateReason + ')' : ''}`} highlight />
                    <KVRow k="  Ready"         v={c.ready ? 'True' : 'False'} />
                    <KVRow k="  Restart Count" v={c.restartCount} />
                    {c.ports?.length > 0 && <KVRow k="  Ports" v={c.ports.join(', ')} />}
                    {c.resources?.requests && Object.keys(c.resources.requests).length > 0 && (
                      <KVRow k="  Requests" v={Object.entries(c.resources.requests).map(([k, v]) => `${k}: ${v}`).join(', ')} />
                    )}
                    {c.resources?.limits && Object.keys(c.resources.limits).length > 0 && (
                      <KVRow k="  Limits"   v={Object.entries(c.resources.limits).map(([k, v]) => `${k}: ${v}`).join(', ')} />
                    )}
                    {c.env?.length > 0 && (
                      <div className="mt-1">
                        <span className="text-gray-500">  Environment:</span>
                        {c.env.map((e, i) => (
                          <p key={i} className="pl-6 text-gray-300">{e}</p>
                        ))}
                      </div>
                    )}
                    {c.volumeMounts?.length > 0 && (
                      <KVRow k="  Mounts" v={c.volumeMounts.join(', ')} />
                    )}
                  </div>
                ))}
              </DescSection>

              {/* ── Conditions ───────────────────────────── */}
              {data.conditions?.length > 0 && (
                <DescSection title="Conditions" color="gray">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-800 text-left">
                          <th className="pb-1.5 pr-6 font-medium">Type</th>
                          <th className="pb-1.5 pr-6 font-medium">Status</th>
                          <th className="pb-1.5 pr-6 font-medium">Reason</th>
                          <th className="pb-1.5 font-medium">Last Transition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.conditions.map((c, i) => (
                          <tr key={i} className="border-b border-gray-800/50">
                            <td className="py-1.5 pr-6 text-white">{c.type}</td>
                            <td className="py-1.5 pr-6">
                              <span className={c.status === 'True' ? 'text-green-400' : 'text-red-400'}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-1.5 pr-6 text-gray-400">{c.reason || '—'}</td>
                            <td className="py-1.5 text-gray-500">
                              {c.lastTransitionTime ? new Date(c.lastTransitionTime).toLocaleString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DescSection>
              )}

              {/* ── Volumes ──────────────────────────────── */}
              {data.volumes?.length > 0 && (
                <DescSection title="Volumes" color="orange">
                  {data.volumes.map((v, i) => (
                    <KVRow key={i} k={v.name} v={v.type} />
                  ))}
                </DescSection>
              )}

              {/* ── Tolerations ──────────────────────────── */}
              {data.tolerations?.length > 0 && (
                <DescSection title="Tolerations" color="gray">
                  {data.tolerations.map((t, i) => (
                    <p key={i} className="text-gray-300 pl-2">{t}</p>
                  ))}
                </DescSection>
              )}

              {/* ── Events ───────────────────────────────── */}
              <DescSection title="Events" color="red">
                {data.events?.length === 0 ? (
                  <p className="text-gray-500">  &lt;none&gt;</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-800 text-left">
                          <th className="pb-1.5 pr-4 font-medium">Type</th>
                          <th className="pb-1.5 pr-4 font-medium">Reason</th>
                          <th className="pb-1.5 pr-4 font-medium">Age</th>
                          <th className="pb-1.5 pr-4 font-medium">From</th>
                          <th className="pb-1.5 font-medium">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.events?.map((e, i) => (
                          <tr key={i} className="border-b border-gray-800/50">
                            <td className={`py-1.5 pr-4 ${e.type === 'Warning' ? 'text-amber-400' : 'text-green-400'}`}>
                              {e.type}
                            </td>
                            <td className="py-1.5 pr-4 text-white">{e.reason}</td>
                            <td className="py-1.5 pr-4 text-gray-400">{e.age}</td>
                            <td className="py-1.5 pr-4 text-gray-400">{e.from}</td>
                            <td className="py-1.5 text-gray-300 break-words max-w-xs">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DescSection>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-gray-800 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SECTION_COLORS = {
  blue:   'text-blue-400   border-blue-700',
  green:  'text-green-400  border-green-700',
  purple: 'text-purple-400 border-purple-700',
  yellow: 'text-yellow-400 border-yellow-700',
  cyan:   'text-cyan-400   border-cyan-700',
  orange: 'text-orange-400 border-orange-700',
  red:    'text-red-400    border-red-700',
  gray:   'text-gray-400   border-gray-700'
};

const DescSection = ({ title, color = 'gray', children }) => {
  const cls = SECTION_COLORS[color] || SECTION_COLORS.gray;
  return (
    <div className={`border-l-2 pl-4 ${cls.split(' ')[1]}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${cls.split(' ')[0]}`}>
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};

const KVRow = ({ k, v, highlight }) => (
  <div className="flex gap-2 text-[11px] leading-5">
    <span className="text-gray-500 min-w-[140px] flex-shrink-0">{k}:</span>
    <span className={highlight ? 'text-amber-300 font-semibold' : 'text-gray-200'}>
      {v ?? '<none>'}
    </span>
  </div>
);
