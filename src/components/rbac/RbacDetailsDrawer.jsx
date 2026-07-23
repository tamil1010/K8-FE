import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, ShieldAlert, Users, Key, Calendar, Tag, ShieldCheck, UserCheck } from 'lucide-react';
import { rbacApi } from '../../services/rbacApi';

export const RbacDetailsDrawer = ({ isOpen, onClose, resourceType, item }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item && resourceType) {
      fetchDetails();
    }
  }, [isOpen, item, resourceType]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (resourceType === 'roles') {
        data = await rbacApi.getRoleDetail(item.namespace, item.name);
      } else if (resourceType === 'bindings') {
        data = await rbacApi.getRoleBindingDetail(item.namespace, item.name);
      } else if (resourceType === 'sas') {
        data = await rbacApi.getServiceAccountDetail(item.namespace, item.name);
      }
      setDetails(data || item);
    } catch (err) {
      setDetails(item); // fallback to item if details endpoint errors out
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2.5">
              {resourceType === 'roles' && <ShieldAlert className="w-5 h-5 text-blue-600" />}
              {resourceType === 'bindings' && <Users className="w-5 h-5 text-emerald-600" />}
              {resourceType === 'sas' && <Key className="w-5 h-5 text-purple-600" />}
              <div>
                <h2 className="text-base font-bold text-gray-900">{item.name}</h2>
                <p className="text-xs text-gray-500 font-mono">
                  {resourceType === 'roles' ? 'Role' : resourceType === 'bindings' ? 'RoleBinding' : 'ServiceAccount'} • {item.namespace}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-gray-500">Fetching RBAC resource details...</span>
              </div>
            ) : error ? (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : details ? (
              <>
                {/* 1. ROLES DETAILS */}
                {resourceType === 'roles' && (
                  <div className="space-y-5">
                    <div className="bg-gray-50 rounded border border-gray-200 divide-y divide-gray-200">
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Role Name</span>
                        <span className="font-mono font-bold text-gray-800">{details.name}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Namespace</span>
                        <span className="font-semibold text-gray-700">{details.namespace}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Created Date</span>
                        <span className="text-gray-600">{new Date(details.createdDate || details.date).toLocaleString()}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Rules Count</span>
                        <span className="font-bold text-blue-600">{details.rules?.length || details.rulesCount || 0} Rule(s)</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" /> Rule Permissions Matrix
                      </h4>
                      {(!details.rules || details.rules.length === 0) ? (
                        <p className="text-gray-400 italic bg-gray-50 p-3 rounded border">No rules attached.</p>
                      ) : (
                        <div className="space-y-3">
                          {details.rules.map((r, i) => (
                            <div key={i} className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-gray-700">Rule #{i + 1}</span>
                                <span className="font-mono text-gray-500">API Groups: [{r.apiGroups?.join(', ') || '""'}]</span>
                              </div>
                              <div>
                                <span className="block text-gray-500 font-semibold mb-1">Resources:</span>
                                <div className="flex flex-wrap gap-1">
                                  {r.resources?.map(res => (
                                    <span key={res} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono rounded border border-blue-200 text-[10px]">
                                      {res}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="block text-gray-500 font-semibold mb-1">Verbs:</span>
                                <div className="flex flex-wrap gap-1">
                                  {r.verbs?.map(v => (
                                    <span key={v} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono rounded border border-emerald-200 text-[10px]">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. ROLE BINDINGS DETAILS */}
                {resourceType === 'bindings' && (
                  <div className="space-y-5">
                    <div className="bg-gray-50 rounded border border-gray-200 divide-y divide-gray-200">
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Binding Name</span>
                        <span className="font-mono font-bold text-gray-800">{details.name}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Namespace</span>
                        <span className="font-semibold text-gray-700">{details.namespace}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Role Reference</span>
                        <span className="font-mono font-bold text-purple-700">
                          {details.roleRef?.kind || 'Role'}/{details.roleRef?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Created Date</span>
                        <span className="text-gray-600">{new Date(details.createdDate || details.date).toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" /> Bound Subjects
                      </h4>
                      {(!details.subjects || details.subjects.length === 0) ? (
                        <p className="text-gray-400 italic bg-gray-50 p-3 rounded border">No subjects configured.</p>
                      ) : (
                        <div className="space-y-2">
                          {details.subjects.map((sub, i) => (
                            <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 border border-gray-200 rounded font-mono">
                              <span className="font-bold text-gray-700">{sub.kind}: {sub.name}</span>
                              <span className="text-gray-500 text-[11px]">{sub.namespace || details.namespace}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. SERVICE ACCOUNTS DETAILS */}
                {resourceType === 'sas' && (
                  <div className="space-y-5">
                    <div className="bg-gray-50 rounded border border-gray-200 divide-y divide-gray-200">
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">ServiceAccount Name</span>
                        <span className="font-mono font-bold text-gray-800">{details.name}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Namespace</span>
                        <span className="font-semibold text-gray-700">{details.namespace}</span>
                      </div>
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-gray-500 font-medium">Created Date</span>
                        <span className="text-gray-600">{new Date(details.createdDate || details.date).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Associated Secrets */}
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">Secrets ({details.secrets?.length || 0})</h4>
                      {(!details.secrets || details.secrets.length === 0) ? (
                        <p className="text-gray-400 italic bg-gray-50 p-2.5 rounded border">No token secrets linked.</p>
                      ) : (
                        <div className="space-y-1.5 font-mono">
                          {details.secrets.map((sec, i) => (
                            <div key={i} className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 font-semibold">
                              🔑 {sec.name || sec}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Image Pull Secrets */}
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">Image Pull Secrets ({details.imagePullSecrets?.length || 0})</h4>
                      {(!details.imagePullSecrets || details.imagePullSecrets.length === 0) ? (
                        <p className="text-gray-400 italic bg-gray-50 p-2.5 rounded border">None specified</p>
                      ) : (
                        <div className="space-y-1.5 font-mono">
                          {details.imagePullSecrets.map((sec, i) => (
                            <div key={i} className="p-2 bg-purple-50 border border-purple-200 text-purple-700 rounded font-semibold">
                              📦 {sec.name || sec}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Labels */}
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">Labels</h4>
                      {Object.keys(details.labels || {}).length === 0 ? (
                        <p className="text-gray-400 italic bg-gray-50 p-2.5 rounded border">No labels</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(details.labels).map(([k, v]) => (
                            <span key={k} className="px-2 py-1 bg-gray-100 border text-gray-700 rounded font-mono">
                              {k}={v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
