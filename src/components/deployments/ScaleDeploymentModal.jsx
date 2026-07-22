import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Plus, Minus } from 'lucide-react';
import API from '../../ApiCall/Api';
import { useToast } from '../../context/ToastContext';

export const ScaleDeploymentModal = ({ isOpen, onClose, deployment, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replicas, setReplicas] = useState(0);

  useEffect(() => {
    if (deployment) {
      setReplicas(deployment.desiredReplicas ?? 0);
    }
  }, [deployment]);

  if (!isOpen || !deployment) return null;

  const handleStep = (amount) => {
    setReplicas(prev => Math.max(0, prev + amount));
  };

  const handleScale = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await API.patch(`/deployment-mgmt/${deployment.namespace}/${deployment.name}/scale`, { replicas });
      addToast(`Scaled deployment "${deployment.name}" to ${replicas} replicas.`, 'success');
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to scale deployment.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loading ? onClose : undefined} />
      
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col animate-[fadeIn_0.15s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Scale Deployment</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            Scale replicas for deployment <span className="font-mono font-bold text-gray-800">{deployment.name}</span> inside <span className="font-semibold text-gray-800">{deployment.namespace}</span>.
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 py-4">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={loading || replicas <= 0}
              className="p-3 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              min="0"
              value={replicas}
              onChange={e => setReplicas(Math.max(0, parseInt(e.target.value, 10) || 0))}
              disabled={loading}
              className="w-24 text-center font-bold text-xl border border-gray-300 rounded py-2 focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-all"
            />

            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={loading}
              className="p-3 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center text-xs text-gray-400">
            Current replicas: {deployment.desiredReplicas} (Available: {deployment.availableReplicas})
          </div>
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
            type="button"
            onClick={handleScale}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-k8s-blue rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? 'Scaling...' : 'Scale Replicas'}
          </button>
        </div>
      </div>
    </div>
  );
};
