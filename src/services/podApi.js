import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const podAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT on every request
podAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('k8s_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Global 401 handler
podAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('k8s_authenticated');
      localStorage.removeItem('k8s_token');
      localStorage.removeItem('k8s_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── All pod-management calls use /pod-mgmt/* prefix ─────────────────────────
// This avoids any conflict with the existing /pods route in k8sRoutes.js

export const podApi = {
  /**
   * Fetch all pods, optionally filtered by namespace.
   * @param {string} namespace - '' or 'All Namespaces' for all, or a specific namespace
   */
  getPods: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await podAxios.get('/pod-mgmt/pods', { params: ns ? { namespace: ns } : {} });
    return res.data.data || [];
  },

  /**
   * Fetch all namespaces from the cluster.
   */
  getNamespaces: async () => {
    const res = await podAxios.get('/pod-mgmt/namespaces');
    return res.data.data || ['All Namespaces'];
  },

  /**
   * Fetch full details for a specific pod.
   */
  getPodDetails: async (namespace, name) => {
    const res = await podAxios.get(`/pod-mgmt/${namespace}/${name}/details`);
    return res.data.data;
  },

  /**
   * Fetch kubectl-logs-equivalent for a pod.
   * @param {string} container - optional container name
   * @param {number} tail - number of lines to tail (default 200)
   */
  getPodLogs: async (namespace, name, container = '', tail = 200) => {
    const params = { tail };
    if (container) params.container = container;
    const res = await podAxios.get(`/pod-mgmt/${namespace}/${name}/logs`, { params });
    return res.data.data?.logs || '';
  },

  /**
   * Fetch kubectl-describe-equivalent for a pod.
   */
  describePod: async (namespace, name) => {
    const res = await podAxios.get(`/pod-mgmt/${namespace}/${name}/describe`);
    return res.data.data;
  },

  /**
   * Delete a pod.
   */
  deletePod: async (namespace, name) => {
    const res = await podAxios.delete(`/pod-mgmt/${namespace}/${name}`);
    return res.data;
  },

  /**
   * Restart a pod (only allowed if managed by a controller).
   */
  restartPod: async (namespace, name) => {
    const res = await podAxios.post(`/pod-mgmt/${namespace}/${name}/restart`);
    return res.data;
  },

  /**
   * Fetch pod-level Metrics Server data.
   */
  getPodMetrics: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await podAxios.get('/pod-mgmt/metrics', { params: ns ? { namespace: ns } : {} });
    return res.data.data;
  }
};
