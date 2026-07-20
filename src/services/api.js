import axios from 'axios';

// Get base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request/Response interceptors can be configured here (e.g. inject tokens)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('k8s_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==========================================
// MOCK DATA SYSTEM FOR DEV & OUT-OF-THE-BOX USE
// ==========================================

let mockEvents = [
  { id: 1, time: '2026-07-20T11:50:00Z', resource: 'pod/frontend-v3-8f2ba', type: 'Normal', status: 'Created', message: 'Created container frontend', namespace: 'default' },
  { id: 2, time: '2026-07-20T11:50:02Z', resource: 'pod/frontend-v3-8f2ba', type: 'Normal', status: 'Started', message: 'Started container frontend', namespace: 'default' },
  { id: 3, time: '2026-07-20T11:51:15Z', resource: 'deployment/backend-api', type: 'Warning', status: 'ScalingReplicaSet', message: 'Scaled replica set backend-api-5c7d8b from 2 to 3', namespace: 'production' },
  { id: 4, time: '2026-07-20T11:52:10Z', resource: 'node/worker-2', type: 'Warning', status: 'KubeletNotReady', message: 'Container runtime network not ready', namespace: 'kube-system' },
  { id: 5, time: '2026-07-20T11:53:05Z', resource: 'pod/cache-redis-0', type: 'Normal', status: 'Pulled', message: 'Successfully pulled image "redis:6-alpine"', namespace: 'staging' },
  { id: 6, time: '2026-07-20T11:54:12Z', resource: 'pod/payment-svc-9f1aa', type: 'Danger', status: 'CrashLoopBackOff', message: 'Back-off restarting failed container', namespace: 'production' },
];

let mockPods = [
  // default
  { name: 'frontend-v3-8f2ba', namespace: 'default', status: 'Running', node: 'worker-1', restarts: 0, cpu: '45m', memory: '128Mi', age: '14m', cpuRaw: 45, memoryRaw: 128 },
  { name: 'frontend-v3-9a3cb', namespace: 'default', status: 'Running', node: 'worker-2', restarts: 1, cpu: '48m', memory: '130Mi', age: '14m', cpuRaw: 48, memoryRaw: 130 },
  { name: 'auth-service-7f89d-11', namespace: 'default', status: 'Running', node: 'worker-1', restarts: 0, cpu: '12m', memory: '64Mi', age: '2d 4h', cpuRaw: 12, memoryRaw: 64 },
  { name: 'auth-service-7f89d-22', namespace: 'default', status: 'Pending', node: 'worker-3', restarts: 0, cpu: '0m', memory: '0Mi', age: '12s', cpuRaw: 0, memoryRaw: 0 },
  // production
  { name: 'backend-api-5c7d8b-1', namespace: 'production', status: 'Running', node: 'worker-2', restarts: 0, cpu: '115m', memory: '256Mi', age: '5h', cpuRaw: 115, memoryRaw: 256 },
  { name: 'backend-api-5c7d8b-2', namespace: 'production', status: 'Running', node: 'worker-3', restarts: 2, cpu: '110m', memory: '240Mi', age: '5h', cpuRaw: 110, memoryRaw: 240 },
  { name: 'payment-svc-9f1aa', namespace: 'production', status: 'CrashLoopBackOff', node: 'worker-1', restarts: 8, cpu: '15m', memory: '85Mi', age: '1h 22m', cpuRaw: 15, memoryRaw: 85 },
  { name: 'db-postgres-0', namespace: 'production', status: 'Running', node: 'worker-3', restarts: 0, cpu: '85m', memory: '512Mi', age: '10d', cpuRaw: 85, memoryRaw: 512 },
  // staging
  { name: 'cache-redis-0', namespace: 'staging', status: 'Running', node: 'worker-1', restarts: 0, cpu: '20m', memory: '96Mi', age: '3d', cpuRaw: 20, memoryRaw: 96 },
  { name: 'staging-api-bb77', namespace: 'staging', status: 'Completed', node: 'worker-2', restarts: 0, cpu: '0m', memory: '16Mi', age: '10h', cpuRaw: 0, memoryRaw: 16 },
  // kube-system
  { name: 'kube-apiserver-master', namespace: 'kube-system', status: 'Running', node: 'master-node', restarts: 0, cpu: '90m', memory: '340Mi', age: '12d', cpuRaw: 90, memoryRaw: 340 },
  { name: 'kube-proxy-w1', namespace: 'kube-system', status: 'Running', node: 'worker-1', restarts: 0, cpu: '15m', memory: '48Mi', age: '12d', cpuRaw: 15, memoryRaw: 48 },
  { name: 'kube-proxy-w2', namespace: 'kube-system', status: 'Running', node: 'worker-2', restarts: 0, cpu: '12m', memory: '45Mi', age: '12d', cpuRaw: 12, memoryRaw: 45 },
  { name: 'coredns-78fcc-aa', namespace: 'kube-system', status: 'Running', node: 'master-node', restarts: 1, cpu: '8m', memory: '32Mi', age: '12d', cpuRaw: 8, memoryRaw: 32 }
];

let mockDeployments = [
  { name: 'frontend-v3', namespace: 'default', replicas: '2/2', available: 2, desired: 2, updated: 2, age: '14m', health: 'Healthy' },
  { name: 'auth-service', namespace: 'default', replicas: '1/2', available: 1, desired: 2, updated: 2, age: '2d 4h', health: 'Degraded' },
  { name: 'backend-api', namespace: 'production', replicas: '2/2', available: 2, desired: 2, updated: 2, age: '5h', health: 'Healthy' },
  { name: 'payment-svc', namespace: 'production', replicas: '0/1', available: 0, desired: 1, updated: 1, age: '1h 22m', health: 'Unhealthy' },
  { name: 'staging-api', namespace: 'staging', replicas: '1/1', available: 1, desired: 1, updated: 1, age: '10h', health: 'Healthy' },
  { name: 'coredns', namespace: 'kube-system', replicas: '2/2', available: 2, desired: 2, updated: 2, age: '12d', health: 'Healthy' }
];

let mockNodes = [
  { name: 'master-node', status: 'Ready', cpuPercent: 32, memoryPercent: 64, runningPods: 4, version: 'v1.28.2', os: 'Ubuntu 22.04 LTS' },
  { name: 'worker-1', status: 'Ready', cpuPercent: 68, memoryPercent: 78, runningPods: 5, version: 'v1.28.2', os: 'Ubuntu 22.04 LTS' },
  { name: 'worker-2', status: 'Ready', cpuPercent: 42, memoryPercent: 55, runningPods: 4, version: 'v1.28.2', os: 'Ubuntu 22.04 LTS' },
  { name: 'worker-3', status: 'Not Ready', cpuPercent: 0, memoryPercent: 0, runningPods: 3, version: 'v1.28.2', os: 'Ubuntu 22.04 LTS' }
];

let mockServices = [
  { name: 'kubernetes', namespace: 'default', type: 'ClusterIP', clusterIP: '10.96.0.1', externalIP: 'None', ports: '443/TCP', age: '12d' },
  { name: 'frontend-svc', namespace: 'default', type: 'NodePort', clusterIP: '10.96.12.80', externalIP: 'None', ports: '80:31080/TCP', age: '14m' },
  { name: 'backend-api-svc', namespace: 'production', type: 'ClusterIP', clusterIP: '10.96.45.101', externalIP: 'None', ports: '8080/TCP', age: '5h' },
  { name: 'payment-lb', namespace: 'production', type: 'LoadBalancer', clusterIP: '10.96.50.200', externalIP: '34.120.45.89', ports: '80:32001/TCP', age: '1h 22m' },
  { name: 'redis-svc', namespace: 'staging', type: 'ClusterIP', clusterIP: '10.96.220.10', externalIP: 'None', ports: '6379/TCP', age: '3d' },
  { name: 'kube-dns', namespace: 'kube-system', type: 'ClusterIP', clusterIP: '10.96.0.10', externalIP: 'None', ports: '53/UDP, 53/TCP', age: '12d' }
];

let mockRbac = {
  roles: [
    { name: 'pod-reader', namespace: 'default', createdDate: '2026-06-01T08:00:00Z', permissions: 'pods (get, list, watch)' },
    { name: 'deployment-manager', namespace: 'production', createdDate: '2026-07-02T10:30:00Z', permissions: 'deployments, replicasets (create, update, patch, get, list)' },
    { name: 'cluster-admin', namespace: 'kube-system', createdDate: '2026-05-10T12:00:00Z', permissions: '* (*)' }
  ],
  bindings: [
    { name: 'read-pods-binding', namespace: 'default', createdDate: '2026-06-01T08:15:00Z', permissions: 'RoleRef: pod-reader, Subject: User(john)' },
    { name: 'prod-deploy-binding', namespace: 'production', createdDate: '2026-07-02T10:45:00Z', permissions: 'RoleRef: deployment-manager, Subject: Group(dev-team)' },
    { name: 'admin-binding', namespace: 'kube-system', createdDate: '2026-05-10T12:05:00Z', permissions: 'RoleRef: cluster-admin, Subject: ServiceAccount(admin-user)' }
  ],
  serviceAccounts: [
    { name: 'default', namespace: 'default', createdDate: '2026-05-01T00:00:00Z', permissions: 'Secrets: [default-token-xxxxx]' },
    { name: 'admin-user', namespace: 'kube-system', createdDate: '2026-05-10T11:55:00Z', permissions: 'Secrets: [admin-token-yyyyy]' },
    { name: 'api-service-sa', namespace: 'production', createdDate: '2026-07-15T09:20:00Z', permissions: 'Secrets: [api-sa-token-zzzzz]' }
  ]
};

// Real-time metric chart data
let cpuHistory = Array.from({ length: 15 }, (_, i) => ({
  time: new Date(Date.now() - (15 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  value: Math.floor(Math.random() * 25) + 35 // between 35% and 60%
}));

let memoryHistory = Array.from({ length: 15 }, (_, i) => ({
  time: new Date(Date.now() - (15 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  value: Math.floor(Math.random() * 15) + 50 // between 50% and 65%
}));

// Simulate background metric shifts and event triggers every 5 seconds
const triggerDataSimulation = () => {
  // 1. Shift CPU / Memory
  const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const lastCpu = cpuHistory[cpuHistory.length - 1].value;
  const lastMemory = memoryHistory[memoryHistory.length - 1].value;

  const nextCpu = Math.max(10, Math.min(95, lastCpu + (Math.floor(Math.random() * 11) - 5)));
  const nextMemory = Math.max(20, Math.min(98, lastMemory + (Math.floor(Math.random() * 5) - 2)));

  cpuHistory.push({ time: nextTime, value: nextCpu });
  memoryHistory.push({ time: nextTime, value: nextMemory });

  if (cpuHistory.length > 20) {
    cpuHistory.shift();
    memoryHistory.shift();
  }

  // 2. Randomly trigger a Pod restart or Status warning (15% chance)
  if (Math.random() < 0.15) {
    const runningPods = mockPods.filter(p => p.status === 'Running');
    if (runningPods.length > 0) {
      const luckyPodIndex = Math.floor(Math.random() * runningPods.length);
      const targetPod = runningPods[luckyPodIndex];
      targetPod.restarts += 1;
      targetPod.cpuRaw = Math.floor(Math.random() * 80) + 10;
      targetPod.cpu = `${targetPod.cpuRaw}m`;

      // Dispatch alert window event for UI listener
      const newEvent = {
        id: Date.now(),
        time: new Date().toISOString(),
        resource: `pod/${targetPod.name}`,
        type: 'Warning',
        status: 'Restarted',
        message: `Container of Pod ${targetPod.name} was restarted (restated count: ${targetPod.restarts})`,
        namespace: targetPod.namespace
      };
      
      mockEvents.unshift(newEvent);
      if (mockEvents.length > 30) mockEvents.pop();

      // Dispatch custom DOM event so that useToast can hook into it
      const event = new CustomEvent('k8s-alert', { detail: newEvent });
      window.dispatchEvent(event);
    }
  }

  // 3. Random node status flicker (5% chance)
  if (Math.random() < 0.05) {
    const worker3 = mockNodes.find(n => n.name === 'worker-3');
    if (worker3) {
      const becameReady = worker3.status === 'Not Ready';
      worker3.status = becameReady ? 'Ready' : 'Not Ready';
      worker3.cpuPercent = becameReady ? 38 : 0;
      worker3.memoryPercent = becameReady ? 48 : 0;

      const newEvent = {
        id: Date.now(),
        time: new Date().toISOString(),
        resource: 'node/worker-3',
        type: becameReady ? 'Normal' : 'Warning',
        status: becameReady ? 'NodeReady' : 'NodeNotReady',
        message: becameReady ? 'Node worker-3 is now ready' : 'Node worker-3 connectivity lost',
        namespace: 'kube-system'
      };
      mockEvents.unshift(newEvent);
      
      const event = new CustomEvent('k8s-alert', { detail: newEvent });
      window.dispatchEvent(event);
    }
  }
};

// Start simulation immediately in browser
if (typeof window !== 'undefined') {
  setInterval(triggerDataSimulation, 5000);
}

// Force mock mode if API URL is mock-based or absent
const isMockMode = !API_BASE_URL || API_BASE_URL.includes('localhost:8080');

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // General Stats
  getOverview: async () => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get('/overview');
        return res.data;
      } catch (err) {
        console.warn('Real API failed, falling back to mock.', err);
      }
    }
    
    await delay();
    return {
      pods: {
        running: mockPods.filter(p => p.status === 'Running').length,
        pending: mockPods.filter(p => p.status === 'Pending').length,
        failed: mockPods.filter(p => p.status === 'CrashLoopBackOff').length,
        completed: mockPods.filter(p => p.status === 'Completed').length
      },
      deployments: {
        available: mockDeployments.filter(d => d.health === 'Healthy').length,
        unavailable: mockDeployments.filter(d => d.health !== 'Healthy').length
      },
      nodes: {
        ready: mockNodes.filter(n => n.status === 'Ready').length,
        notReady: mockNodes.filter(n => n.status !== 'Ready').length
      },
      services: {
        clusterIP: mockServices.filter(s => s.type === 'ClusterIP').length,
        nodePort: mockServices.filter(s => s.type === 'NodePort').length,
        loadBalancer: mockServices.filter(s => s.type === 'LoadBalancer').length
      }
    };
  },

  // Monitor charts
  getMonitoringMetrics: async () => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get('/monitoring');
        return res.data;
      } catch (err) {
        // Fallback
      }
    }
    await delay(100);
    return {
      cpu: [...cpuHistory],
      memory: [...memoryHistory]
    };
  },

  // Event list
  getEvents: async () => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get('/events');
        return res.data;
      } catch (err) {}
    }
    await delay(200);
    return [...mockEvents];
  },

  // Pods
  getPods: async (namespace = 'All Namespaces', search = '') => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get(`/pods?namespace=${namespace}&search=${search}`);
        return res.data;
      } catch (err) {}
    }
    await delay(500); // realistic load time
    let filtered = [...mockPods];
    if (namespace !== 'All Namespaces') {
      filtered = filtered.filter(p => p.namespace.toLowerCase() === namespace.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.node.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  },

  // Deployments
  getDeployments: async (namespace = 'All Namespaces', search = '') => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get(`/deployments?namespace=${namespace}&search=${search}`);
        return res.data;
      } catch (err) {}
    }
    await delay(450);
    let filtered = [...mockDeployments];
    if (namespace !== 'All Namespaces') {
      filtered = filtered.filter(d => d.namespace.toLowerCase() === namespace.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    return filtered;
  },

  // Nodes
  getNodes: async () => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get('/nodes');
        return res.data;
      } catch (err) {}
    }
    await delay(400);
    return [...mockNodes];
  },

  // Services
  getServices: async (namespace = 'All Namespaces', search = '') => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get(`/services?namespace=${namespace}&search=${search}`);
        return res.data;
      } catch (err) {}
    }
    await delay(350);
    let filtered = [...mockServices];
    if (namespace !== 'All Namespaces') {
      filtered = filtered.filter(s => s.namespace.toLowerCase() === namespace.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.clusterIP.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  },

  // RBAC list
  getRbacData: async (namespace = 'All Namespaces') => {
    if (!isMockMode) {
      try {
        const res = await axiosInstance.get(`/rbac?namespace=${namespace}`);
        return res.data;
      } catch (err) {}
    }
    await delay(400);
    const filterByNamespace = (list) => {
      if (namespace === 'All Namespaces') return list;
      return list.filter(item => item.namespace.toLowerCase() === namespace.toLowerCase());
    };

    return {
      roles: filterByNamespace(mockRbac.roles),
      bindings: filterByNamespace(mockRbac.bindings),
      serviceAccounts: filterByNamespace(mockRbac.serviceAccounts)
    };
  }
};
