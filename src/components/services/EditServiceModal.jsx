import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, Plus, Trash2, Edit3 } from 'lucide-react';
import { serviceApi } from '../../services/serviceApi';
import { useToast } from '../../context/ToastContext';

export const EditServiceModal = ({ isOpen, onClose, service, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  // Editable fields
  const [labelPairs, setLabelPairs] = useState([]);
  const [selectorPairs, setSelectorPairs] = useState([]);
  const [port, setPort] = useState('80');
  const [targetPort, setTargetPort] = useState('8080');
  const [protocol, setProtocol] = useState('TCP');

  useEffect(() => {
    if (isOpen && service) {
      fetchCurrentService();
    }
  }, [isOpen, service]);

  const fetchCurrentService = async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await serviceApi.getServiceDetail(service.namespace, service.name);
      
      // Parse labels
      const labels = data.labels || {};
      const lPairs = Object.entries(labels).map(([key, value]) => ({ key, value }));
      setLabelPairs(lPairs.length ? lPairs : [{ key: '', value: '' }]);

      // Parse selectors
      const selectors = data.selector || {};
      const sPairs = Object.entries(selectors).map(([key, value]) => ({ key, value }));
      setSelectorPairs(sPairs.length ? sPairs : [{ key: '', value: '' }]);

      // Ports
      if (data.ports && data.ports.length > 0) {
        setPort(String(data.ports[0].port || 80));
        setTargetPort(String(data.ports[0].targetPort || 8080));
        setProtocol(data.ports[0].protocol || 'TCP');
      } else if (service.ports) {
        // fallback parse "80:8080/TCP"
        const parts = service.ports.split('/');
        const proto = parts[1] || 'TCP';
        const nums = (parts[0] || '').split(':');
        setPort(nums[0] || '80');
        setTargetPort(nums[1] || nums[0] || '8080');
        setProtocol(proto);
      }
    } catch (err) {
      setError('Failed to fetch existing service configuration.');
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen || !service) return null;

  // Label handlers
  const handleAddLabel = () => setLabelPairs([...labelPairs, { key: '', value: '' }]);
  const handleRemoveLabel = (i) => setLabelPairs(labelPairs.filter((_, idx) => idx !== i));
  const handleLabelChange = (i, field, val) => {
    const updated = [...labelPairs];
    updated[i][field] = val;
    setLabelPairs(updated);
  };

  // Selector handlers
  const handleAddSelector = () => setSelectorPairs([...selectorPairs, { key: '', value: '' }]);
  const handleRemoveSelector = (i) => setSelectorPairs(selectorPairs.filter((_, idx) => idx !== i));
  const handleSelectorChange = (i, field, val) => {
    const updated = [...selectorPairs];
    updated[i][field] = val;
    setSelectorPairs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Build labels object
    const labelsObj = {};
    labelPairs.forEach(p => {
      if (p.key.trim()) labelsObj[p.key.trim()] = p.value.trim();
    });

    // Build selector object
    const selectorObj = {};
    selectorPairs.forEach(p => {
      if (p.key.trim()) selectorObj[p.key.trim()] = p.value.trim();
    });

    const updatePayload = {
      labels: labelsObj,
      selector: selectorObj,
      ports: [
        {
          port: parseInt(port, 10),
          targetPort: parseInt(targetPort, 10),
          protocol
        }
      ]
    };

    try {
      await serviceApi.updateService(service.namespace, service.name, updatePayload);
      addToast(`Service "${service.name}" updated successfully!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update service.');
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
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Service</h2>
              <p className="text-xs text-gray-500 font-mono">{service.namespace}/{service.name}</p>
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

        {/* Content */}
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

            {/* Ports Section */}
            <div className="bg-gray-50 p-3.5 border border-gray-200 rounded space-y-2.5">
              <span className="block font-bold text-gray-800">Edit Ports & Protocol</span>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Target Port</label>
                  <input
                    type="number"
                    value={targetPort}
                    onChange={e => setTargetPort(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-600 mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={e => setProtocol(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selector Labels */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-gray-800">Selector Labels</label>
                <button
                  type="button"
                  onClick={handleAddSelector}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {selectorPairs.map((pair, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={pair.key}
                      onChange={e => handleSelectorChange(index, 'key', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-gray-400">=</span>
                    <input
                      type="text"
                      placeholder="Value"
                      value={pair.value}
                      onChange={e => handleSelectorChange(index, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelector(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata Labels */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-gray-800">Resource Labels</label>
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
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
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-gray-400">=</span>
                    <input
                      type="text"
                      placeholder="Value"
                      value={pair.value}
                      onChange={e => handleLabelChange(index, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded font-mono focus:outline-none focus:border-blue-500"
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

            {/* Submit Buttons */}
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
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
