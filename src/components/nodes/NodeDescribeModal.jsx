import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Clipboard, Check } from 'lucide-react';
import API from '../../ApiCall/Api';

export const NodeDescribeModal = ({ isOpen, onClose, node }) => {
  const [describeText, setDescribeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && node) {
      fetchDescribe();
    }
  }, [isOpen, node]);

  const fetchDescribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/nodes/${node.name}/describe`);
      setDescribeText(res.data?.data);
    } catch (err) {
      setError('Failed to describe node resource.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !node) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(describeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Node Describe Details</h2>
            <p className="text-xs text-gray-500 font-mono">{node.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-950 p-6 font-mono text-xs text-gray-200 leading-relaxed min-h-0 select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-k8s-blue" />
              <span className="text-sm text-gray-400">Loading describe output...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded p-4 text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : (
            <pre className="whitespace-pre">{describeText}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-lg">
          <button
            type="button"
            disabled={loading || error}
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clipboard className="w-3.5 h-3.5 text-gray-500" />}
            {copied ? 'Copied' : 'Copy Output'}
          </button>
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
