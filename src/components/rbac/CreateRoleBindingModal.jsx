import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';
import { useToast } from '../../context/ToastContext';

export const CreateRoleBindingModal = ({ isOpen, onClose, namespaces = [], onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [isClusterBinding, setIsClusterBinding] = useState(false);
  const [namespace, setNamespace] = useState('default');

  // Role Ref
  const [roleRefKind, setRoleRefKind] = useState('Role');
  const [roleRefName, setRoleRefName] = useState('pod-reader');

  // Subjects
  const [subjects, setSubjects] = useState([
    { kind: 'User', name: '', namespace: 'default' }
  ]);

  if (!isOpen) return null;

  const validNamespaces = (namespaces || []).filter(ns => ns !== 'All Namespaces');
  if (!validNamespaces.includes('default')) validNamespaces.unshift('default');

  const handleAddSubject = () => {
    setSubjects([...subjects, { kind: 'User', name: '', namespace: 'default' }]);
  };

  const handleRemoveSubject = (i) => {
    setSubjects(subjects.filter((_, idx) => idx !== i));
  };

  const handleSubjectChange = (i, field, val) => {
    const updated = [...subjects];
    updated[i][field] = val;
    setSubjects(updated);
  };

  const validateForm = () => {
    if (!name.trim()) return 'RoleBinding Name is required.';
    if (!roleRefName.trim()) return 'Role Reference Name is required.';
    if (subjects.length === 0) return 'At least one Subject is required.';
    for (let i = 0; i < subjects.length; i++) {
      if (!subjects[i].name.trim()) return `Subject #${i + 1} requires a Name.`;
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

    const payload = {
      name: name.trim(),
      isClusterRoleBinding: isClusterBinding,
      namespace: isClusterBinding ? 'Cluster Scope' : namespace,
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: roleRefKind,
        name: roleRefName.trim()
      },
      subjects: subjects.map(s => ({
        kind: s.kind,
        name: s.name.trim(),
        namespace: s.kind === 'ServiceAccount' ? (s.namespace || namespace) : undefined,
        apiGroup: s.kind === 'ServiceAccount' ? undefined : 'rbac.authorization.k8s.io'
      })),
      labels: { app: name.trim() }
    };

    try {
      await rbacApi.createRoleBinding(payload.namespace, payload);
      addToast(`${isClusterBinding ? 'ClusterRoleBinding' : 'RoleBinding'} "${name}" created successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create RoleBinding.');
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
            <h2 className="text-lg font-bold text-gray-900">Create Role Binding</h2>
            <p className="text-xs text-gray-500">Bind RBAC Roles to Users, Groups, or Service Accounts</p>
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

          {/* Binding Name & Namespace */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Binding Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. read-pods-binding"
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
                    checked={isClusterBinding}
                    onChange={e => setIsClusterBinding(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-gray-700">ClusterRoleBinding</span>
                </label>
              </div>
              {!isClusterBinding && (
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

          {/* Role Reference */}
          <div className="bg-gray-50 p-3.5 border border-gray-200 rounded space-y-2">
            <span className="block font-bold text-gray-800">Role Reference (Target Role)</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Role Kind</label>
                <select
                  value={roleRefKind}
                  onChange={e => setRoleRefKind(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                >
                  <option value="Role">Role</option>
                  <option value="ClusterRole">ClusterRole</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. pod-reader"
                  value={roleRefName}
                  onChange={e => setRoleRefName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Subjects Builder */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-bold text-gray-800 text-sm">Target Subjects (Identities)</label>
              <button
                type="button"
                onClick={handleAddSubject}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>

            <div className="space-y-2.5">
              {subjects.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 border border-gray-200 rounded">
                  <select
                    value={sub.kind}
                    onChange={e => handleSubjectChange(idx, 'kind', e.target.value)}
                    className="w-32 px-2 py-1.5 border border-gray-300 rounded bg-white font-medium"
                  >
                    <option value="User">User</option>
                    <option value="Group">Group</option>
                    <option value="ServiceAccount">ServiceAccount</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Name (e.g. john or dev-team)"
                    value={sub.name}
                    onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                    required
                  />

                  {sub.kind === 'ServiceAccount' && (
                    <select
                      value={sub.namespace}
                      onChange={e => handleSubjectChange(idx, 'namespace', e.target.value)}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded bg-white"
                    >
                      {validNamespaces.map(ns => (
                        <option key={ns} value={ns}>{ns}</option>
                      ))}
                    </select>
                  )}

                  {subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
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
              {loading ? 'Creating RoleBinding...' : 'Create RoleBinding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
