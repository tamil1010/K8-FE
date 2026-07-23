import API from '../ApiCall/Api';

export const rbacApi = {
  // Roles
  getRoles: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await API.get('/rbac/roles', { params: ns ? { namespace: ns } : {} });
    return res.data?.data || [];
  },

  getRoleDetail: async (namespace, name) => {
    const res = await API.get(`/rbac/roles/${namespace || 'all'}/${name}`);
    return res.data?.data;
  },

  getRoleYaml: async (namespace, name) => {
    const res = await API.get(`/rbac/roles/${namespace || 'all'}/${name}/yaml`);
    return res.data?.data;
  },

  createRole: async (namespace, roleData) => {
    const res = await API.post('/rbac/roles', { namespace, body: roleData });
    return res.data;
  },

  updateRole: async (namespace, name, updateData) => {
    const res = await API.put(`/rbac/roles/${namespace || 'all'}/${name}`, updateData);
    return res.data;
  },

  deleteRole: async (namespace, name) => {
    const res = await API.delete(`/rbac/roles/${namespace || 'all'}/${name}`);
    return res.data;
  },

  // RoleBindings
  getRoleBindings: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await API.get('/rbac/rolebindings', { params: ns ? { namespace: ns } : {} });
    return res.data?.data || [];
  },

  getRoleBindingDetail: async (namespace, name) => {
    const res = await API.get(`/rbac/rolebindings/${namespace || 'all'}/${name}`);
    return res.data?.data;
  },

  getRoleBindingYaml: async (namespace, name) => {
    const res = await API.get(`/rbac/rolebindings/${namespace || 'all'}/${name}/yaml`);
    return res.data?.data;
  },

  createRoleBinding: async (namespace, bindingData) => {
    const res = await API.post('/rbac/rolebindings', { namespace, body: bindingData });
    return res.data;
  },

  updateRoleBinding: async (namespace, name, updateData) => {
    const res = await API.put(`/rbac/rolebindings/${namespace || 'all'}/${name}`, updateData);
    return res.data;
  },

  deleteRoleBinding: async (namespace, name) => {
    const res = await API.delete(`/rbac/rolebindings/${namespace || 'all'}/${name}`);
    return res.data;
  },

  // ServiceAccounts
  getServiceAccounts: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await API.get('/rbac/serviceaccounts', { params: ns ? { namespace: ns } : {} });
    return res.data?.data || [];
  },

  getServiceAccountDetail: async (namespace, name) => {
    const res = await API.get(`/rbac/serviceaccounts/${namespace || 'default'}/${name}`);
    return res.data?.data;
  },

  getServiceAccountYaml: async (namespace, name) => {
    const res = await API.get(`/rbac/serviceaccounts/${namespace || 'default'}/${name}/yaml`);
    return res.data?.data;
  },

  createServiceAccount: async (namespace, saData) => {
    const res = await API.post('/rbac/serviceaccounts', { namespace, body: saData });
    return res.data;
  },

  updateServiceAccount: async (namespace, name, updateData) => {
    const res = await API.put(`/rbac/serviceaccounts/${namespace || 'default'}/${name}`, updateData);
    return res.data;
  },

  deleteServiceAccount: async (namespace, name) => {
    const res = await API.delete(`/rbac/serviceaccounts/${namespace || 'default'}/${name}`);
    return res.data;
  }
};
