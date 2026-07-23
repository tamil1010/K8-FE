import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import API from '../../ApiCall/Api';
import { useToast } from '../../context/ToastContext';

export const CreatePodModal = ({ isOpen, onClose, namespaces, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [image, setImage] = useState('');
  const [port, setPort] = useState('');
  const [labels, setLabels] = useState([{ key: '', value: '' }]);
  const [env, setEnv] = useState([{ name: '', value: '' }]);

  if (!isOpen) return null;

  const validNamespaces = namespaces.filter(ns => ns !== 'All Namespaces');

  // Helpers for dynamic arrays
  const handleAddLabel = () => setLabels([...labels, { key: '', value: '' }]);
  const handleRemoveLabel = (index) => setLabels(labels.filter((_, i) => i !== index));
  const handleLabelChange = (index, field, val) => {
    const newLabels = [...labels];
    newLabels[index][field] = val;
    setLabels(newLabels);
  };

  const handleAddEnv = () => setEnv([...env, { name: '', value: '' }]);
  const handleRemoveEnv = (index) => setEnv(env.filter((_, i) => i !== index));
  const handleEnvChange = (index, field, val) => {
    const newEnv = [...env];
    newEnv[index][field] = val;
    setEnv(newEnv);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !image) {
      setError('Pod Name and Image are required.');
      return;
    }

    setLoading(true);
    setError(null);

    // Clean up labels array into an object
    const labelsObj = {};
    labels.forEach(l => {
      if (l.key.trim()) labelsObj[l.key.trim()] = l.value.trim();
    });

    // Clean up env array
    const envArr = env
      .filter(e => e.name.trim())
      .map(e => ({ name: e.name.trim(), value: e.value.trim() }));

    const payload = {
      name: name.trim(),
      namespace,
      image: image.trim(),
      port: port.trim(),
      labels: Object.keys(labelsObj).length > 0 ? labelsObj : undefined,
      env: envArr.length > 0 ? envArr : undefined
    };

    try {
      await API.post('/pod-mgmt/pods', payload);
      addToast(`Pod "${payload.name}" created successfully!`, 'success');
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create pod.';
      setError(msg);
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />
      
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col animate-[fadeIn_0.15s_ease-out] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-k8s-blue" />
            Create Pod
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form id="create-pod-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Pod Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. my-nginx-pod"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                />
              </div>

              {/* Namespace */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Namespace <span className="text-red-500">*</span></label>
                <select
                  value={namespace}
                  onChange={e => setNamespace(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                >
                  {validNamespaces.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                  {!validNamespaces.includes('default') && <option value="default">default</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Image */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Container Image <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  placeholder="e.g. nginx:latest"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                />
              </div>

              {/* Port */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Container Port (Optional)</label>
                <input
                  type="number"
                  value={port}
                  onChange={e => setPort(e.target.value)}
                  placeholder="e.g. 80"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Labels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Labels (Optional)</label>
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="text-xs font-semibold text-k8s-blue hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Label
                </button>
              </div>
              {labels.map((lbl, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={lbl.key}
                    onChange={e => handleLabelChange(idx, 'key', e.target.value)}
                    placeholder="Key (e.g. app)"
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-k8s-blue transition-colors"
                  />
                  <input
                    type="text"
                    value={lbl.value}
                    onChange={e => handleLabelChange(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. frontend)"
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-k8s-blue transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <hr className="border-gray-200" />

            {/* Environment Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Environment Variables (Optional)</label>
                <button
                  type="button"
                  onClick={handleAddEnv}
                  className="text-xs font-semibold text-k8s-blue hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Env Var
                </button>
              </div>
              {env.map((e, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={e.name}
                    onChange={ev => handleEnvChange(idx, 'name', ev.target.value)}
                    placeholder="Name (e.g. NODE_ENV)"
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-k8s-blue transition-colors"
                  />
                  <input
                    type="text"
                    value={e.value}
                    onChange={ev => handleEnvChange(idx, 'value', ev.target.value)}
                    placeholder="Value (e.g. production)"
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-k8s-blue transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-pod-form"
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-k8s-blue rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? 'Creating...' : 'Create Pod'}
          </button>
        </div>

      </div>
    </div>
  );
};
