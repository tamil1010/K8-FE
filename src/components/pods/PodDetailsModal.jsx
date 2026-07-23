import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import API from '../../ApiCall/Api';

/**
 * PodDetailsModal
 * Props:
 *   pod       { name, namespace } — the pod to load
 *   onClose   () => void
 */
export const PodDetailsModal = ({ pod, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!pod) return;
    setLoading(true);
    setError(null);
    API.get(`/pod-mgmt/${pod.namespace}/${pod.name}/details`)
      .then((res) => setDetails(res.data?.data))
      .catch(() => setError('Failed to load pod details.'))
      .finally(() => setLoading(false));
  }, [pod]);

  if (!pod) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 animate-[fadeIn_0.15s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900 font-mono">{pod.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Pod Details</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-k8s-blue" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {details && !loading && (
            <>
              {/* Core Info */}
              <Section title="Overview">
                <InfoGrid items={[
                  { label: 'Pod Name',   value: details.name,      mono: true },
                  { label: 'Namespace',  value: details.namespace              },
                  { label: 'Node',       value: details.node,      mono: true },
                  { label: 'Pod IP',     value: details.podIP,     mono: true },
                  { label: 'Host IP',    value: details.hostIP,    mono: true },
                  { label: 'Status',     value: <StatusBadge status={details.status} /> },
                  { label: 'Restarts',   value: details.restarts                },
                  { label: 'QoS Class',  value: details.qosClass                },
                  { label: 'Age',        value: details.age                     },
                  { label: 'Created',    value: details.creationTimestamp
                      ? new Date(details.creationTimestamp).toLocaleString()
                      : 'N/A'
                  }
                ]} />
              </Section>

              {/* Labels */}
              <Section title="Labels">
                {Object.keys(details.labels).length === 0 ? (
                  <p className="text-xs text-gray-400">No labels</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(details.labels).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {k}={v}
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              {/* Container Images */}
              <Section title="Containers">
                <div className="space-y-3">
                  {details.containerImages.map((c) => (
                    <div key={c.name} className="bg-gray-50 rounded border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-800 mb-1">{c.name}</p>
                      <p className="text-xs font-mono text-gray-600 break-all">{c.image}</p>
                      {(c.resources.requests || c.resources.limits) && (
                        <div className="mt-2 flex gap-4 text-[10px] text-gray-500">
                          {c.resources.requests && (
                            <span>Req: cpu={c.resources.requests.cpu || '—'} mem={c.resources.requests.memory || '—'}</span>
                          )}
                          {c.resources.limits && (
                            <span>Lim: cpu={c.resources.limits.cpu || '—'} mem={c.resources.limits.memory || '—'}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Conditions */}
              <Section title="Conditions">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200">
                        <th className="pb-2 pr-4 font-medium">Type</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 pr-4 font-medium">Reason</th>
                        <th className="pb-2 font-medium">Last Transition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {details.conditions.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 font-mono text-gray-800">{c.type}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'True' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>{c.status}</span>
                          </td>
                          <td className="py-2 pr-4 text-gray-500">{c.reason || '—'}</td>
                          <td className="py-2 text-gray-500 font-mono">
                            {c.lastTransitionTime ? new Date(c.lastTransitionTime).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">
      {title}
    </h3>
    {children}
  </div>
);

const InfoGrid = ({ items }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
    {items.map(({ label, value, mono }) => (
      <div key={label}>
        <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</dt>
        <dd className={`text-sm text-gray-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>
          {value ?? '—'}
        </dd>
      </div>
    ))}
  </dl>
);

const STATUS_COLORS = {
  Running:          'bg-green-100 text-green-800 border-green-200',
  Pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  Succeeded:        'bg-blue-100 text-blue-800 border-blue-200',
  Failed:           'bg-red-100 text-red-800 border-red-200',
  CrashLoopBackOff: 'bg-orange-100 text-orange-800 border-orange-200',
  Unknown:          'bg-gray-100 text-gray-700 border-gray-200'
};

const StatusBadge = ({ status }) => {
  const cls = STATUS_COLORS[status] || STATUS_COLORS.Unknown;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
};
