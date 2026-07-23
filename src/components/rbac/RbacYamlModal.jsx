import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Clipboard, Download, Check, Maximize2, Minimize2, Search } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';

export const RbacYamlModal = ({ isOpen, onClose, resourceType, item }) => {
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && item && resourceType) {
      fetchYaml();
    }
  }, [isOpen, item, resourceType]);

  const fetchYaml = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (resourceType === 'roles') {
        data = await rbacApi.getRoleYaml(item.namespace, item.name);
      } else if (resourceType === 'bindings') {
        data = await rbacApi.getRoleBindingYaml(item.namespace, item.name);
      } else if (resourceType === 'sas') {
        data = await rbacApi.getServiceAccountYaml(item.namespace, item.name);
      }
      setYaml(jsonToYaml(data));
    } catch (err) {
      setError('Failed to load RBAC YAML manifest.');
    } finally {
      setLoading(false);
    }
  };

  const jsonToYaml = (obj, indent = 0) => {
    if (obj === null || obj === undefined) return '';
    let yamlStr = '';
    const spaces = ' '.repeat(indent);

    if (typeof obj !== 'object') {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return ' []\n';
      yamlStr += '\n';
      obj.forEach(item => {
        if (typeof item === 'object') {
          const itemYaml = jsonToYaml(item, indent + 2);
          yamlStr += `${spaces}- ${itemYaml.trimStart()}`;
        } else {
          yamlStr += `${spaces}- ${item}\n`;
        }
      });
      return yamlStr;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return ' {}\n';

    if (indent > 0) yamlStr += '\n';

    keys.forEach(key => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        yamlStr += `${spaces}${key}:${jsonToYaml(value, indent + 2)}`;
      } else {
        yamlStr += `${spaces}${key}: ${value}\n`;
      }
    });

    return yamlStr;
  };

  if (!isOpen || !item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([yaml], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${item.name}-rbac.yaml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderHighlightedContent = () => {
    if (!searchTerm.trim()) {
      return <pre className="whitespace-pre-wrap">{yaml}</pre>;
    }
    const escapedTerm = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const parts = yaml.split(regex);
    return (
      <pre className="whitespace-pre-wrap">
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-amber-400 text-gray-900 rounded px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />

      <div className={`relative z-10 bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 ${
        isFullscreen ? 'w-full h-full p-2' : 'w-full max-w-4xl h-[80vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-lg font-bold text-gray-900">RBAC Config (YAML)</h2>
            <p className="text-xs text-gray-500 font-mono">{item.namespace}/{item.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-48 select-none">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search in YAML..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
        <div className="flex-1 overflow-auto bg-gray-900 p-6 font-mono text-xs text-gray-100 leading-relaxed min-h-0 select-text">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-sm text-gray-400">Fetching RBAC manifest...</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/50 rounded p-4 text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : (
            renderHighlightedContent()
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
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Clipboard className="w-3.5 h-3.5 text-gray-500" />}
              {copied ? 'Copied' : 'Copy YAML'}
            </button>
            <button
              type="button"
              disabled={loading || error}
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              Download YAML
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
