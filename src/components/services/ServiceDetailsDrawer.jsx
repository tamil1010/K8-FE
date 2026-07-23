import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Globe, Network, Server, Tag, Clock, Layers, CheckCircle, Copy } from 'lucide-react';
import { serviceApi } from '../../services/serviceApi';

export const ServiceDetailsDrawer = ({ isOpen, onClose, service }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedIp, setCopiedIp] = useState(null);

  useEffect(() => {
    if (isOpen && service) {
      fetchDetails();
    }
  }, [isOpen, service]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceApi.getServiceDetail(service.namespace, service.name);
      setDetails(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch Service details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !service) return null;

  const handleCopyIp = (ipStr) => {
    navigator.clipboard.writeText(ipStr);
    setCopiedIp(ipStr);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'ClusterIP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NodePort':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LoadBalancer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ExternalName':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-gray-900">{service.name}</h2>
                <p className="text-xs text-gray-500 font-mono">Namespace: {service.namespace}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-gray-500">Loading service details...</span>
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : details ? (
              <>
                {/* 1. Basic Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b pb-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>Basic Information</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded border border-gray-200 divide-y divide-gray-200">
                    <div className="px-3.5 py-2.5 flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Service Name</span>
                      <span className="font-mono font-bold text-gray-800">{details.name}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Namespace</span>
                      <span className="font-medium text-gray-700">{details.namespace}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Type</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeColor(details.type)}`}>
                        {details.type}
                      </span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Cluster IP</span>
                      <span className="font-mono text-gray-700">{details.clusterIP}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between items-center">
                      <span className="text-gray-500 font-medium">External IP</span>
                      <span className="font-mono font-semibold text-gray-700">{details.externalIP}</span>
                    </div>
                    {details.externalName && (
                      <div className="px-3.5 py-2.5 flex justify-between items-center">
                        <span className="text-gray-500 font-medium">External Name</span>
                        <span className="font-mono text-blue-600">{details.externalName}</span>
                      </div>
                    )}
                    <div className="px-3.5 py-2.5 flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Creation Time</span>
                      <span className="text-gray-600">
                        {details.creationTimestamp ? new Date(details.creationTimestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selectors & Labels */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b pb-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span>Selector & Labels</span>
                  </div>

                  <div>
                    <span className="block text-gray-500 font-semibold mb-1.5">Selector:</span>
                    {Object.keys(details.selector || {}).length === 0 ? (
                      <span className="text-gray-400 italic">No selector defined</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(details.selector).map(([k, v]) => (
                          <span key={k} className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono text-[11px]">
                            {k}={v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="block text-gray-500 font-semibold mb-1.5">Labels:</span>
                    {Object.keys(details.labels || {}).length === 0 ? (
                      <span className="text-gray-400 italic">No labels</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(details.labels).map(([k, v]) => (
                          <span key={k} className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded font-mono text-[11px]">
                            {k}={v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Networking */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b pb-2">
                    <Network className="w-4 h-4 text-indigo-600" />
                    <span>Networking</span>
                  </div>

                  <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="px-3 py-2">Port</th>
                          <th className="px-3 py-2">Target Port</th>
                          <th className="px-3 py-2">Protocol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 font-mono">
                        {(details.ports || []).map((p, i) => (
                          <tr key={i} className="hover:bg-white">
                            <td className="px-3 py-2 text-gray-800 font-bold">{p.port}</td>
                            <td className="px-3 py-2 text-gray-700">{p.targetPort || p.port}</td>
                            <td className="px-3 py-2 text-blue-600 font-bold">{p.protocol || 'TCP'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Endpoints */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b pb-2">
                    <Layers className="w-4 h-4 text-green-600" />
                    <span>Connected Pod Endpoints ({details.endpoints?.length || 0})</span>
                  </div>

                  {(!details.endpoints || details.endpoints.length === 0) ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-500 text-center italic">
                      No active endpoints connected
                    </div>
                  ) : (
                    <div className="bg-gray-900 text-gray-100 font-mono p-3 rounded-lg border border-gray-800 space-y-1.5 max-h-48 overflow-y-auto">
                      {details.endpoints.map((ep, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-none">
                          <span className="text-green-400 font-bold">{ep}</span>
                          <button
                            onClick={() => handleCopyIp(ep)}
                            className="p-1 hover:text-blue-400 text-gray-400 transition-colors"
                            title="Copy Endpoint"
                          >
                            {copiedIp === ep ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
