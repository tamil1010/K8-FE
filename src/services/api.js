import axios from 'axios';

// Get base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token from localStorage
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('k8s_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized globally
// If any API returns 401 (expired/missing token), clear session and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stale auth data
      localStorage.removeItem('k8s_authenticated');
      localStorage.removeItem('k8s_token');
      localStorage.removeItem('k8s_user');
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Login Request to Backend Auth API
  login: async (username, password) => {
    const res = await axiosInstance.post('/auth/login', { username, password });
    return res.data; // returns { success: true, data: { token, username, role } }
  },
  
  // Dashboard Overview Summary Counts
  getOverview: async () => {
    const res = await axiosInstance.get('/dashboard/overview');
    return res.data.data;
  },

  // Pod workloads query
  getPods: async (namespace = 'All Namespaces', search = '') => {
    const nsParam = namespace === 'All Namespaces' ? '' : namespace;
    const res = await axiosInstance.get(`/pods?namespace=${nsParam}`);
    let list = res.data.data || [];
    
    if (search) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.node.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  },

  // Developer/Admin operation: Restart a Pod
  restartPod: async (namespace, name) => {
    const res = await axiosInstance.post(`/pods/${namespace}/${name}/restart`);
    return res.data; // returns { success: true, message: "..." }
  },

  // Deployments workload query
  getDeployments: async (namespace = 'All Namespaces', search = '') => {
    const nsParam = namespace === 'All Namespaces' ? '' : namespace;
    const res = await axiosInstance.get(`/deployments?namespace=${nsParam}`);
    let list = res.data.data || [];
    
    if (search) {
      list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  },

  // Nodes compute query
  getNodes: async () => {
    const res = await axiosInstance.get('/nodes');
    return res.data.data || [];
  },

  // Services endpoint query
  getServices: async (namespace = 'All Namespaces', search = '') => {
    const nsParam = namespace === 'All Namespaces' ? '' : namespace;
    const res = await axiosInstance.get(`/services?namespace=${nsParam}`);
    let list = res.data.data || [];
    
    if (search) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.clusterIP.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  },

  // RBAC lists merge and namespace filtering
  getRbacData: async (namespace = 'All Namespaces') => {
    const [rolesRes, bindingsRes, sasRes] = await Promise.all([
      axiosInstance.get('/rbac/roles'),
      axiosInstance.get('/rbac/rolebindings'),
      axiosInstance.get('/rbac/serviceaccounts')
    ]);
    
    const filterByNamespace = (list) => {
      if (!list) return [];
      if (namespace === 'All Namespaces') return list;
      return list.filter(item => item.namespace && item.namespace.toLowerCase() === namespace.toLowerCase());
    };

    return {
      roles: filterByNamespace(rolesRes.data.data),
      bindings: filterByNamespace(bindingsRes.data.data),
      serviceAccounts: filterByNamespace(sasRes.data.data)
    };
  },

  // Event stream log
  getEvents: async () => {
    const res = await axiosInstance.get('/events');
    return res.data.data || [];
  },

  // Metrics Server CPU load query
  getCPUUsage: async () => {
    const res = await axiosInstance.get('/metrics/cpu');
    return res.data.data; // returns { value: number }
  },

  // Metrics Server Memory load query
  getMemoryUsage: async () => {
    const res = await axiosInstance.get('/metrics/memory');
    return res.data.data; // returns { value: number }
  },

  // Get all available contexts (clusters)
  getClusters: async () => {
    const res = await axiosInstance.get('/clusters');
    return res.data.data;
  },

  // Get current active context (cluster) details
  getCurrentCluster: async () => {
    const res = await axiosInstance.get('/clusters/current');
    return res.data.data;
  },

  // Switch context (cluster)
  switchCluster: async (contextName) => {
    const res = await axiosInstance.post('/clusters/switch', { context: contextName });
    return res.data;
  }
};
