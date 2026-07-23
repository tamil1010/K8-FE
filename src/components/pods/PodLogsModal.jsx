import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RefreshCw, Copy, Check, ArrowDownToLine, Loader2, AlertTriangle } from 'lucide-react';
import API from '../../ApiCall/Api';

/**
 * PodLogsModal — kubectl logs equivalent
 * Props:
 *   pod     { name, namespace }
 *   onClose () => void
 */
export const PodLogsModal = ({ pod, onClose }) => {
  const [logs, setLogs]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied]       = useState(false);
  const [tail, setTail]           = useState(200);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    if (!pod) return;
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/pod-mgmt/${pod.namespace}/${pod.name}/logs`, { params: { tail } });
      const text = res.data?.data?.logs || '(no logs)';
      setLogs(text);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch logs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pod, tail]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = logs;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!pod) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-gray-950 rounded-lg shadow-2xl w-full max-w-4xl mx-4 flex flex-col animate-[fadeIn_0.15s_ease-out] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white font-mono">{pod.name}</h2>
              <span className="text-xs text-gray-400">— Logs</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">namespace: {pod.namespace}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tail selector */}
            <select
              value={tail}
              onChange={(e) => setTail(Number(e.target.value))}
              className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"
            >
              <option value={50}>Last 50 lines</option>
              <option value={100}>Last 100 lines</option>
              <option value={200}>Last 200 lines</option>
              <option value={500}>Last 500 lines</option>
              <option value={1000}>Last 1000 lines</option>
            </select>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(p => !p)}
              title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
              className={`p-1.5 rounded text-xs transition-colors ${
                autoScroll
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              disabled={!logs || loading}
              title="Copy logs"
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchLogs}
              disabled={loading}
              title="Refresh logs"
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-red-700 hover:text-white transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-950 min-h-0"
          style={{ minHeight: '300px', maxHeight: 'calc(90vh - 120px)' }}
        >
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2 text-sm text-gray-400">Fetching logs…</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded p-4">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <pre className="text-xs text-green-300 font-mono leading-5 whitespace-pre-wrap break-words">
              {logs}
              <div ref={bottomRef} />
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-gray-600">
            {logs ? `${logs.split('\n').length} lines` : ''}
          </span>
          <div className="flex items-center gap-2">
            {!autoScroll && (
              <button
                onClick={scrollToBottom}
                className="text-[10px] text-blue-400 hover:text-blue-300 underline"
              >
                Jump to bottom
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
