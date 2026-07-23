import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { serviceApi } from '../../services/serviceApi';
import { useToast } from '../../context/ToastContext';

export const CreateServiceModal = ({ isOpen, onClose, namespaces = [], onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [type, setType] = useState('ClusterIP');
  const [port, setPort] = useState('80');
  const [targetPort, setTargetPort] = useState('8080');
  const [nodePort, setNodePort] = useState('');
  const [protocol, setProtocol] = useState('TCP');
  const [externalName, setExternalName] = useState('');
  const [selectorPairs, setSelectorPairs] = useState([{ key: 'app', value: '' }]);

  if (!isOpen) return null;

  const validNamespaces = (namespaces || []).filter(ns => ns !== 'All Namespaces');
  if (!validNamespaces.includes('default')) {
    validNamespaces.unshift('default');
  }

  const handleAddSelector = () => {
    setSelectorPairs([...selectorPairs, { key: '', value: '' }]);
  };

  const handleRemoveSelector = (index) => {
    setSelectorPairs(selectorPairs.filter((_, i) => i !== index));
  };

  const handleSelectorChange = (index, field, value) => {
    const updated = [...selectorPairs];
    updated[index][field] = value;
    setSelectorPairs(updated);
  };

  const validateForm = () => {
    if (!name.trim()) {
      return 'Service Name is required.';
    }
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name.trim())) {
      return 'Service Name must consist of lower case alphanumeric characters or "-" (valid RFC 1123 label).';
    }
    if (!namespace) {
      return 'Namespace is required.';
    }
    if (type === 'ExternalName') {
      if (!externalName.trim()) {
        return 'External Name domain (e.g. my.database.example.com) is required for ExternalName services.';
      }
    } else {
      if (!port || isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
        return 'Port must be a valid port number (1-65535).';
      }
      if (!targetPort || isNaN(Number(targetPort)) || Number(targetPort) < 1 || Number(targetPort) > 65535) {
        return 'Target Port must be a valid port number (1-65535).';
      }
      if (type === 'NodePort' && nodePort) {
        if (isNaN(Number(nodePort)) || Number(nodePort) < 30000 || Number(nodePort) > 32767) {
          return 'NodePort must be between 30000 and 32767.';
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationErr = validateForm();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);

    // Convert selector pairs to object
    const selectorObj = {};
    if (type !== 'ExternalName') {
      selectorPairs.forEach(pair => {
        if (pair.key.trim()) {
          selectorObj[pair.key.trim()] = pair.value.trim();
        }
      });
    }

    const payload = {
      name: name.trim(),
      namespace,
      type,
      port: parseInt(port, 10),
      targetPort: parseInt(targetPort, 10),
      nodePort: nodePort ? parseInt(nodePort, 10) : undefined,
      protocol,
      selector: selectorObj,
      externalName: type === 'ExternalName' ? externalName.trim() : undefined,
      labels: { app: name.trim() }
    };

    try {
      await serviceApi.createService(namespace, payload);
      addToast(`Service "${name}" created successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create Service.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />

      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Kubernetes Service</h2>
            <p className="text-xs text-gray-500">Configure a network endpoint to expose application pods</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Name & Namespace */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. frontend-service"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Namespace <span className="text-red-500">*</span>
              </label>
              <select
                value={namespace}
                onChange={e => setNamespace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
              >
                {validNamespaces.map(ns => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Service Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 px-3 border rounded text-center transition-colors font-medium ${
                    type === t
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ExternalName Field */}
          {type === 'ExternalName' ? (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                External Name Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. database.example.com"
                value={externalName}
                onChange={e => setExternalName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          ) : (
            <>
              {/* Networking / Ports */}
              <div className="bg-gray-50 p-3.5 border border-gray-200 rounded space-y-3">
                <span className="block font-bold text-gray-700">Port Mapping & Protocol</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">
                      Service Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="80"
                      value={port}
                      onChange={e => setPort(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">
                      Target Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="8080"
                      value={targetPort}
                      onChange={e => setTargetPort(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">Protocol</label>
                    <select
                      value={protocol}
                      onChange={e => setProtocol(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                    </select>
                  </div>
                </div>

                {type === 'NodePort' && (
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">
                      NodePort (Optional: 30000-32767)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 31080"
                      value={nodePort}
                      onChange={e => setNodePort(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Selector Labels */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-gray-700">Selector Labels</label>
                  <button
                    type="button"
                    onClick={handleAddSelector}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Selector
                  </button>
                </div>
                <div className="space-y-2">
                  {selectorPairs.map((pair, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. app)"
                        value={pair.key}
                        onChange={e => handleSelectorChange(index, 'key', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="text-gray-400">=</span>
                      <input
                        type="text"
                        placeholder="Value (e.g. web)"
                        value={pair.value}
                        onChange={e => handleSelectorChange(index, 'value', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
                      />
                      {selectorPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSelector(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating Service...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
