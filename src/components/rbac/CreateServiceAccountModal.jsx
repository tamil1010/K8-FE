import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';
import { useToast } from '../../context/ToastContext';

export const CreateServiceAccountModal = ({ isOpen, onClose, namespaces = [], onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [imagePullSecrets, setImagePullSecrets] = useState([{ name: '' }]);
  const [labelPairs, setLabelPairs] = useState([{ key: 'app', value: '' }]);

  if (!isOpen) return null;

  const validNamespaces = (namespaces || []).filter(ns => ns !== 'All Namespaces');
  if (!validNamespaces.includes('default')) validNamespaces.unshift('default');

  const handleAddSecret = () => setImagePullSecrets([...imagePullSecrets, { name: '' }]);
  const handleRemoveSecret = (i) => setImagePullSecrets(imagePullSecrets.filter((_, idx) => idx !== i));
  const handleSecretChange = (i, val) => {
    const updated = [...imagePullSecrets];
    updated[i].name = val;
    setImagePullSecrets(updated);
  };

  const handleAddLabel = () => setLabelPairs([...labelPairs, { key: '', value: '' }]);
  const handleRemoveLabel = (i) => setLabelPairs(labelPairs.filter((_, idx) => idx !== i));
  const handleLabelChange = (i, field, val) => {
    const updated = [...labelPairs];
    updated[i][field] = val;
    setLabelPairs(updated);
  };

  const validateForm = () => {
    if (!name.trim()) return 'ServiceAccount Name is required.';
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name.trim())) {
      return 'Name must consist of lower case alphanumeric characters or "-" (valid RFC 1123 label).';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const valErr = validateForm();
    if (valErr) {
      setError(valErr);
      return;
    }

    setLoading(true);

    const secrets = imagePullSecrets.filter(s => s.name.trim()).map(s => ({ name: s.name.trim() }));
    const labelsObj = {};
    labelPairs.forEach(p => {
      if (p.key.trim()) labelsObj[p.key.trim()] = p.value.trim();
    });

    const payload = {
      name: name.trim(),
      namespace,
      imagePullSecrets: secrets,
      labels: labelsObj
    };

    try {
      await rbacApi.createServiceAccount(namespace, payload);
      addToast(`ServiceAccount "${name}" created successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create ServiceAccount.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />

      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Service Account</h2>
            <p className="text-xs text-gray-500">Provide an identity for workloads inside the cluster</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Namespace */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                ServiceAccount Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. build-robot-sa"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Namespace <span className="text-red-500">*</span></label>
              <select
                value={namespace}
                onChange={e => setNamespace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
              >
                {validNamespaces.map(ns => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Pull Secrets */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-gray-700">Image Pull Secrets (Optional)</label>
              <button
                type="button"
                onClick={handleAddSecret}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Secret
              </button>
            </div>
            <div className="space-y-2">
              {imagePullSecrets.map((sec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Secret Name (e.g. docker-key)"
                    value={sec.name}
                    onChange={e => handleSecretChange(idx, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                  />
                  {imagePullSecrets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSecret(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-gray-700">Labels</label>
              <button
                type="button"
                onClick={handleAddLabel}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Label
              </button>
            </div>
            <div className="space-y-2">
              {labelPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={pair.key}
                    onChange={e => handleLabelChange(idx, 'key', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                  />
                  <span className="text-gray-400">=</span>
                  <input
                    type="text"
                    placeholder="Value"
                    value={pair.value}
                    onChange={e => handleLabelChange(idx, 'value', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                  />
                  {labelPairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              {loading ? 'Creating ServiceAccount...' : 'Create ServiceAccount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
