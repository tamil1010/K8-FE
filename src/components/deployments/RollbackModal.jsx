import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, RotateCcw, Calendar, HardDrive } from 'lucide-react';
import API from '../../ApiCall/Api';
import { useToast } from '../../context/ToastContext';

export const RollbackModal = ({ isOpen, onClose, deployment, onSuccess }) => {
  const { addToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingRollback, setLoadingRollback] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [confirmingRollback, setConfirmingRollback] = useState(false);

  useEffect(() => {
    if (isOpen && deployment) {
      fetchHistory();
    }
  }, [isOpen, deployment]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await API.get(`/deployment-mgmt/${deployment.namespace}/${deployment.name}/history`);
      const data = res.data?.data || [];
      setHistory(data);
      if (data.length > 1) {
        // Default to second newest revision (previous one)
        setSelectedRevision(data[1].revision);
      }
    } catch (err) {
      setError('Failed to fetch deployment revision history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !deployment) return null;

  const handleRollback = async () => {
    if (!selectedRevision) return;
    setLoadingRollback(true);
    setConfirmingRollback(false);
    setError(null);
    try {
      await API.post(`/deployment-mgmt/${deployment.namespace}/${deployment.name}/rollback`, { revision: selectedRevision });
      addToast(`Successfully rolled back to revision ${selectedRevision}!`, 'success');
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to rollback deployment.';
      setError(msg);
    } finally {
      setLoadingRollback(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={!loadingRollback ? onClose : undefined} />
      
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-xl flex flex-col animate-[fadeIn_0.15s_ease-out] max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-500" />
            Rollback Deployment
          </h2>
          <button
            onClick={onClose}
            disabled={loadingRollback}
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-sm text-gray-600">
            Select a revision to roll back deployment <span className="font-mono font-bold text-gray-800">{deployment.name}</span>.
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-k8s-blue" />
              <span className="text-sm text-gray-500">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No revision history found.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((rev, idx) => {
                const isActive = idx === 0; // index 0 is currently active deployment configuration
                const isSelected = selectedRevision === rev.revision;
                return (
                  <div
                    key={rev.revision}
                    onClick={() => !isActive && setSelectedRevision(rev.revision)}
                    className={`border rounded p-4 flex items-center justify-between transition-all ${
                      isActive
                        ? 'border-green-200 bg-green-50/40 cursor-not-allowed'
                        : isSelected
                        ? 'border-k8s-blue bg-blue-50/30 ring-1 ring-k8s-blue cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          Revision {rev.revision}
                        </span>
                        {isActive && <span className="text-[10px] uppercase font-bold text-green-700">Active</span>}
                      </div>
                      
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created: {new Date(rev.creationTimestamp).toLocaleString()}</span>
                      </div>

                      <div className="text-xs font-mono text-gray-600 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Image: {rev.containerImage}</span>
                      </div>
                    </div>

                    {!isActive && (
                      <input
                        type="radio"
                        name="revision-select"
                        checked={isSelected}
                        onChange={() => setSelectedRevision(rev.revision)}
                        className="h-4 w-4 text-k8s-blue border-gray-300 focus:ring-k8s-blue"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {confirmingRollback && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-start gap-3 mt-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-800">Confirm Rollback</p>
                <p className="text-xs text-amber-700">
                  Are you sure you want to roll back deployment <span className="font-semibold">{deployment.name}</span> to Revision {selectedRevision}? This will trigger a rolling pod update.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRollback}
                    disabled={loadingRollback}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Yes, Rollback
                  </button>
                  <button
                    onClick={() => setConfirmingRollback(false)}
                    className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded transition-colors"
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingRollback}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Close
          </button>
          {!confirmingRollback && (
            <button
              type="button"
              disabled={loadingHistory || !selectedRevision || loadingRollback}
              onClick={() => setConfirmingRollback(true)}
              className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {loadingRollback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Rollback to Selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
