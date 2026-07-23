import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Plus, Minus, Info } from 'lucide-react';
import { deploymentApi } from '../../services/deploymentApi';
import { useToast } from '../../context/ToastContext';

export const ScaleDeploymentModal = ({ isOpen, onClose, deployment, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replicas, setReplicas] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (deployment) {
      setReplicas(deployment.desiredReplicas ?? 0);
      setConfirmed(false);
    }
  }, [deployment]);

  if (!isOpen || !deployment) return null;

  const handleStep = (amount) => {
    setReplicas(prev => Math.max(0, prev + amount));
  };

  const handleScale = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please check the confirmation box before applying.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deploymentApi.scaleDeployment(deployment.namespace, deployment.name, replicas);
      addToast(`Successfully scaled deployment "${deployment.name}" to ${replicas} replicas.`, 'success');
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
          <h2 className="text-lg font-bold text-gray-900">Scale Deployment Config</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-gray-600">
          <div>
            Modify replicas for deployment <span className="font-mono font-bold text-gray-800">{deployment.name}</span> inside namespace <span className="font-semibold text-gray-800">{deployment.namespace}</span>.
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={loading || replicas <= 0}
              className="p-3 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors text-gray-700"
            >
              <Minus className="w-4 h-4" />
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
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preview Panel */}
          <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <Info className="w-3.5 h-3.5 text-k8s-blue" />
              Scale Preview
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-700">
              <div className="text-gray-400">Current Replicas:</div>
              <div className="font-bold text-right">{deployment.desiredReplicas ?? 0}</div>
              
              <div className="text-gray-400">New Replicas:</div>
              <div className="font-bold text-right text-k8s-blue">{replicas}</div>

              <div className="text-gray-400">Estimated Pods:</div>
              <div className="font-bold text-right text-gray-900">{replicas} Pods</div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              disabled={loading}
              className="mt-0.5 rounded text-k8s-blue border-gray-300 focus:ring-k8s-blue"
            />
            <span className="text-xs text-gray-600 font-medium">
              I confirm that I want to scale this deployment to {replicas} replicas.
            </span>
          </label>
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
            disabled={loading || !confirmed}
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
