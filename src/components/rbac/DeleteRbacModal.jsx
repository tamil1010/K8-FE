import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';
import { useToast } from '../../context/ToastContext';

export const DeleteRbacModal = ({ isOpen, onClose, resourceType, item, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      if (resourceType === 'roles') {
        await rbacApi.deleteRole(item.namespace, item.name);
      } else if (resourceType === 'bindings') {
        await rbacApi.deleteRoleBinding(item.namespace, item.name);
      } else if (resourceType === 'sas') {
        await rbacApi.deleteServiceAccount(item.namespace, item.name);
      }

      addToast(`Resource "${item.name}" deleted successfully.`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete RBAC resource.');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (resourceType === 'roles') return 'Role';
    if (resourceType === 'bindings') return 'RoleBinding';
    return 'ServiceAccount';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />

      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full text-red-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Delete {getLabel()}</h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you sure you want to delete {getLabel().toLowerCase()} <span className="font-mono font-bold text-gray-800">{item.name}</span> in namespace <span className="font-semibold text-gray-700">{item.namespace}</span>?
            </p>
            <p className="text-xs text-red-600 font-semibold mt-1">
              This action will revoke associated permissions and cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2.5 text-xs">
            {error}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Deleting...' : `Delete ${getLabel()}`}
          </button>
        </div>
      </div>
    </div>
  );
};
