import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Edit3, Plus, Trash2 } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';
import { useToast } from '../../context/ToastContext';

export const EditRbacModal = ({ isOpen, onClose, resourceType, item, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  // Editable fields depending on resourceType
  const [labelPairs, setLabelPairs] = useState([]);
  
  // Roles fields
  const [rules, setRules] = useState([]);

  // RoleBindings fields
  const [subjects, setSubjects] = useState([]);

  // ServiceAccounts fields
  const [imagePullSecrets, setImagePullSecrets] = useState([]);

  useEffect(() => {
    if (isOpen && item && resourceType) {
      fetchCurrent();
    }
  }, [isOpen, item, resourceType]);

  const fetchCurrent = async () => {
    setFetching(true);
    setError(null);
    try {
      let data;
      if (resourceType === 'roles') {
        data = await rbacApi.getRoleDetail(item.namespace, item.name);
        setRules(data.rules || []);
      } else if (resourceType === 'bindings') {
        data = await rbacApi.getRoleBindingDetail(item.namespace, item.name);
        setSubjects(data.subjects || []);
      } else if (resourceType === 'sas') {
        data = await rbacApi.getServiceAccountDetail(item.namespace, item.name);
        const secrets = (data.imagePullSecrets || []).map(s => ({ name: typeof s === 'string' ? s : s.name }));
        setImagePullSecrets(secrets);
      }

      const labels = data?.labels || {};
      const lPairs = Object.entries(labels).map(([key, value]) => ({ key, value }));
      setLabelPairs(lPairs);
    } catch (err) {
      setError('Failed to fetch existing resource state.');
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen || !item) return null;

  // Label handlers
  const handleAddLabel = () => setLabelPairs([...labelPairs, { key: '', value: '' }]);
  const handleRemoveLabel = (i) => setLabelPairs(labelPairs.filter((_, idx) => idx !== i));
  const handleLabelChange = (i, field, val) => {
    const updated = [...labelPairs];
    updated[i][field] = val;
    setLabelPairs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const labelsObj = {};
    labelPairs.forEach(p => {
      if (p.key.trim()) labelsObj[p.key.trim()] = p.value.trim();
    });

    try {
      if (resourceType === 'roles') {
        await rbacApi.updateRole(item.namespace, item.name, { rules, labels: labelsObj });
      } else if (resourceType === 'bindings') {
        await rbacApi.updateRoleBinding(item.namespace, item.name, { subjects, labels: labelsObj });
      } else if (resourceType === 'sas') {
        await rbacApi.updateServiceAccount(item.namespace, item.name, { imagePullSecrets, labels: labelsObj });
      }

      addToast(`Resource "${item.name}" updated successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update resource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />

      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit {resourceType === 'roles' ? 'Role' : resourceType === 'bindings' ? 'RoleBinding' : 'ServiceAccount'}</h2>
              <p className="text-xs text-gray-500 font-mono">{item.namespace}/{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-gray-500 text-xs">Loading configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Labels section */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-gray-800">Resource Labels</label>
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Label
                </button>
              </div>
              <div className="space-y-2">
                {labelPairs.map((pair, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={pair.key}
                      onChange={e => handleLabelChange(index, 'key', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                    />
                    <span className="text-gray-400">=</span>
                    <input
                      type="text"
                      placeholder="Value"
                      value={pair.value}
                      onChange={e => handleLabelChange(index, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
