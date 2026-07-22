import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const deployAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT on every request
deployAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('k8s_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Global 401 handler
deployAxios.interceptors.response.use(
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

export const deploymentApi = {
  getDeployments: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await deployAxios.get('/deployment-mgmt/deployments', { params: ns ? { namespace: ns } : {} });
    return res.data.data || [];
  },

  getDeploymentDetails: async (namespace, name) => {
    const res = await deployAxios.get(`/deployment-mgmt/${namespace}/${name}`);
    return res.data.data;
  },

  createDeployment: async (namespace, body) => {
    const res = await deployAxios.post('/deployment-mgmt/deployments', { namespace, body });
    return res.data;
  },

  scaleDeployment: async (namespace, name, replicas) => {
    const res = await deployAxios.patch(`/deployment-mgmt/${namespace}/${name}/scale`, { replicas });
    return res.data;
  },

  restartDeployment: async (namespace, name) => {
    const res = await deployAxios.post(`/deployment-mgmt/${namespace}/${name}/restart`);
    return res.data;
  },

  rollbackDeployment: async (namespace, name, revision) => {
    const res = await deployAxios.post(`/deployment-mgmt/${namespace}/${name}/rollback`, { revision });
    return res.data;
  },

  getDeploymentHistory: async (namespace, name) => {
    const res = await deployAxios.get(`/deployment-mgmt/${namespace}/${name}/history`);
    return res.data.data || [];
  },

  getDeploymentLogs: async (namespace, name) => {
    const res = await deployAxios.get(`/deployment-mgmt/${namespace}/${name}/logs`);
    return res.data.data?.logs || '';
  },

  getDeploymentYaml: async (namespace, name) => {
    const res = await deployAxios.get(`/deployment-mgmt/${namespace}/${name}/yaml`);
    return res.data.data;
  },

  deleteDeployment: async (namespace, name) => {
    const res = await deployAxios.delete(`/deployment-mgmt/${namespace}/${name}`);
    return res.data;
  }
};
