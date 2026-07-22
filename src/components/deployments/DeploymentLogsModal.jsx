import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Clipboard, Download, RefreshCw, Search } from 'lucide-react';
import { deploymentApi } from '../../services/deploymentApi';

export const DeploymentLogsModal = ({ isOpen, onClose, deployment }) => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && deployment) {
      fetchLogs();
    }
  }, [isOpen, deployment]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentApi.getDeploymentLogs(deployment.namespace, deployment.name);
      setLogs(data);
    } catch (err) {
      setError('Failed to fetch deployment container logs.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !deployment) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([logs], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${deployment.name}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getFilteredLogs = () => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs
      .split('\n')
      .filter(line => line.toLowerCase().includes(term))
      .join('\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col animate-[fadeIn_0.15s_ease-out] h-[80vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-gray-200 gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Deployment Logs</h2>
            <p className="text-xs text-gray-500 font-mono">Aggregated pod logs for {deployment.namespace}/{deployment.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search within logs */}
            <div className="relative w-48 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full bg-gray-50 border border-gray-300 rounded py-1 pl-9 pr-3 text-xs focus:outline-none focus:border-k8s-blue focus:bg-white transition-all"
              />
            </div>
            
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
        <div className="flex-1 overflow-auto bg-gray-950 p-6 font-mono text-xs text-green-400 leading-relaxed min-h-0 select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              <span className="text-sm text-gray-500">Aggregating pod logs...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-950/40 border border-red-900/50 rounded p-4 text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : (
            <pre className="whitespace-pre">{getFilteredLogs() || 'No logs found matching your search term.'}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-lg">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || error}
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Clipboard className="w-3.5 h-3.5 text-gray-500" />
              {copied ? 'Copied!' : 'Copy Logs'}
            </button>
            <button
              type="button"
              disabled={loading || error}
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              Download Logs
            </button>
          </div>
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
