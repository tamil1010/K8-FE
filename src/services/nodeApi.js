import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const nodeAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT on every request
nodeAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('k8s_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Global 401 handler
nodeAxios.interceptors.response.use(
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

export const nodeApi = {
  getNodes: async () => {
    const res = await nodeAxios.get('/node-mgmt/nodes');
    return res.data.data || [];
  },

  getNodeDetails: async (name) => {
    const res = await nodeAxios.get(`/nodes/${name}`);
    return res.data.data;
  },

  getNodePods: async (name) => {
    const res = await nodeAxios.get(`/node-mgmt/nodes/${name}/pods`);
    return res.data.data || [];
  },

  getNodeYaml: async (name) => {
    const res = await nodeAxios.get(`/nodes/${name}/yaml`);
    return res.data.data;
  },

  getNodeEvents: async (name) => {
    const res = await nodeAxios.get(`/nodes/${name}/events`);
    return res.data.data || [];
  },

  describeNode: async (name) => {
    const res = await nodeAxios.get(`/nodes/${name}/describe`);
    return res.data.data;
  },

  getNodeMetrics: async (name) => {
    const res = await nodeAxios.get(`/nodes/${name}/metrics`);
    return res.data.data;
  }
};
