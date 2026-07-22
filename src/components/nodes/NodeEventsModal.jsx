import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import API from '../../ApiCall/Api';

export const NodeEventsModal = ({ isOpen, onClose, node }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && node) {
      fetchEvents();
    }
  }, [isOpen, node]);

  const fetchEvents = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/nodes/${node.name}/events`);
      setEvents(res.data?.data || []);
    } catch (err) {
      setError('Failed to fetch events for this node.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Node Events</h2>
            <p className="text-xs text-gray-500 font-mono">{node.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchEvents(false);
              }}
              disabled={isRefreshing || loading}
              className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors"
              title="Refresh Events"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 min-h-0 select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-k8s-blue" />
              <span className="text-sm text-gray-400">Fetching events...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
              No recent events found for this node.
            </div>
          ) : (
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-gray-50 font-semibold text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Message</th>
                    <th className="px-4 py-2.5 text-center">Count</th>
                    <th className="px-4 py-2.5 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                  {events.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          e.type === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold font-mono text-gray-900">{e.reason}</td>
                      <td className="px-4 py-2 text-gray-600 font-sans max-w-sm break-words">{e.message}</td>
                      <td className="px-4 py-2 text-center font-mono font-semibold">{e.count}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-500 whitespace-nowrap">{e.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
