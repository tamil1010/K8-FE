import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';
import { useToast } from '../../context/ToastContext';

export const CreateRoleModal = ({ isOpen, onClose, namespaces = [], onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [isClusterRole, setIsClusterRole] = useState(false);
  const [namespace, setNamespace] = useState('default');
  
  // Rules array
  const [rules, setRules] = useState([
    { apiGroups: '', resources: 'pods, services', verbs: ['get', 'list', 'watch'] }
  ]);

  if (!isOpen) return null;

  const validNamespaces = (namespaces || []).filter(ns => ns !== 'All Namespaces');
  if (!validNamespaces.includes('default')) validNamespaces.unshift('default');

  const handleAddRule = () => {
    setRules([...rules, { apiGroups: '', resources: '', verbs: ['get'] }]);
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const handleVerbToggle = (ruleIndex, verb) => {
    const updated = [...rules];
    const currentVerbs = updated[ruleIndex].verbs || [];
    if (currentVerbs.includes(verb)) {
      updated[ruleIndex].verbs = currentVerbs.filter(v => v !== verb);
    } else {
      updated[ruleIndex].verbs = [...currentVerbs, verb];
    }
    setRules(updated);
  };

  const validateForm = () => {
    if (!name.trim()) return 'Role Name is required.';
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name.trim())) {
      return 'Role Name must be valid lowercase RFC 1123 label.';
    }
    if (rules.length === 0) return 'At least one permission rule is required.';
    for (let i = 0; i < rules.length; i++) {
      if (!rules[i].resources.trim()) return `Rule #${i + 1} requires at least one resource (e.g. pods, services).`;
      if (!rules[i].verbs || rules[i].verbs.length === 0) return `Rule #${i + 1} requires at least one verb selection.`;
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

    const formattedRules = rules.map(r => ({
      apiGroups: r.apiGroups.split(',').map(s => s.trim()),
      resources: r.resources.split(',').map(s => s.trim()),
      verbs: r.verbs
    }));

    const payload = {
      name: name.trim(),
      isClusterRole,
      namespace: isClusterRole ? 'Cluster Scope' : namespace,
      rules: formattedRules,
      labels: { app: name.trim() }
    };

    try {
      await rbacApi.createRole(payload.namespace, payload);
      addToast(`${isClusterRole ? 'ClusterRole' : 'Role'} "${name}" created successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create Role.');
    } finally {
      setLoading(false);
    }
  };

  const availableVerbs = ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete', '*'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />

      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Kubernetes Role</h2>
            <p className="text-xs text-gray-500">Define access permissions and RBAC rules</p>
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

          {/* Name & Scope */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. pod-reader-role"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Namespace Scope</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isClusterRole}
                    onChange={e => setIsClusterRole(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-gray-700">ClusterRole (Cluster-wide)</span>
                </label>
              </div>
              {!isClusterRole && (
                <select
                  value={namespace}
                  onChange={e => setNamespace(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 border border-gray-300 rounded bg-white"
                >
                  {validNamespaces.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Rules Builder */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-gray-800 text-sm">Permission Rules</label>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>

            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div key={idx} className="bg-gray-50 p-3.5 border border-gray-200 rounded space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Rule #{idx + 1}</span>
                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 font-medium mb-1">
                        API Groups <span className="text-gray-400 font-normal">(empty for core "")</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. apps, batch, "
                        value={rule.apiGroups}
                        onChange={e => handleRuleChange(idx, 'apiGroups', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-medium mb-1">
                        Resources <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. pods, deployments, services"
                        value={rule.resources}
                        onChange={e => handleRuleChange(idx, 'resources', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 font-medium mb-1">Verbs <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableVerbs.map(v => {
                        const isSelected = rule.verbs.includes(v);
                        return (
                          <button
                            type="button"
                            key={v}
                            onClick={() => handleVerbToggle(idx, v)}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
              {loading ? 'Creating Role...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
