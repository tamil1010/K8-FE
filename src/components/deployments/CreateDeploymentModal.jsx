import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Plus, FileCode, Edit3 } from 'lucide-react';
import { deploymentApi } from '../../services/deploymentApi';
import { useToast } from '../../context/ToastContext';

export const CreateDeploymentModal = ({ isOpen, onClose, namespaces, onSuccess }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'yaml'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [image, setImage] = useState('');
  const [replicas, setReplicas] = useState(1);
  const [port, setPort] = useState('');
  const [strategy, setStrategy] = useState('RollingUpdate');

  // YAML Field
  const [yamlContent, setYamlContent] = useState('');

  if (!isOpen) return null;

  const validNamespaces = namespaces.filter(ns => ns !== 'All Namespaces');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let payloadManifest;

    if (activeTab === 'yaml') {
      if (!yamlContent.trim()) {
        setError('YAML content cannot be empty.');
        setLoading(false);
        return;
      }
      payloadManifest = yamlContent;
    } else {
      if (!name.trim() || !image.trim()) {
        setError('Deployment Name and Container Image are required.');
        setLoading(false);
        return;
      }

      // Construct Deployment Manifest JSON
      payloadManifest = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: name.trim(),
          namespace,
          labels: { app: name.trim() }
        },
        spec: {
          replicas: parseInt(replicas, 10),
          strategy: { type: strategy },
          selector: {
            matchLabels: { app: name.trim() }
          },
          template: {
            metadata: {
              labels: { app: name.trim() }
            },
            spec: {
              containers: [
                {
                  name: name.trim(),
                  image: image.trim(),
                  ports: port ? [{ containerPort: parseInt(port, 10) }] : []
                }
              ]
            }
          }
        }
      };
    }

    try {
      await deploymentApi.createDeployment(namespace, payloadManifest);
      addToast(`Deployment created successfully!`, 'success');
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create deployment.';
      setError(msg);
    } finally {
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
            Create Deployment
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'form'
                ? 'border-k8s-blue text-k8s-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Form Creator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yaml')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'yaml'
                ? 'border-k8s-blue text-k8s-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Import YAML
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

          <form id="create-deploy-form" onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'form' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Deployment Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. web-app"
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
                      placeholder="e.g. nginx:alpine"
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                    />
                  </div>

                  {/* Replicas */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Desired Replicas</label>
                    <input
                      type="number"
                      min="0"
                      value={replicas}
                      onChange={e => setReplicas(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Container Port */}
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

                  {/* Strategy */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Strategy</label>
                    <select
                      value={strategy}
                      onChange={e => setStrategy(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue transition-colors"
                    >
                      <option value="RollingUpdate">RollingUpdate (Standard)</option>
                      <option value="Recreate">Recreate (Terminate then Start)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex justify-between">
                  <span>Deployment YAML Definition</span>
                  <span className="text-xs text-gray-400 font-normal">Must be valid K8s Deployment YAML</span>
                </label>
                <textarea
                  value={yamlContent}
                  onChange={e => setYamlContent(e.target.value)}
                  placeholder={`apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\n  namespace: default\nspec:\n  replicas: 2\n  ...`}
                  rows="12"
                  className="w-full font-mono bg-gray-50 border border-gray-300 rounded p-3 text-xs focus:outline-none focus:border-k8s-blue focus:bg-white transition-all"
                />
              </div>
            )}
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
            form="create-deploy-form"
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-k8s-blue rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? 'Creating...' : 'Create Deployment'}
          </button>
        </div>

      </div>
    </div>
  );
};
