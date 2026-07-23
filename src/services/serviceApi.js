import API from '../ApiCall/Api';

export const serviceApi = {
  getServices: async (namespace = '') => {
    const ns = namespace === 'All Namespaces' ? '' : namespace;
    const res = await API.get('/services', { params: ns ? { namespace: ns } : {} });
    return res.data?.data || [];
  },

  getServiceDetail: async (namespace, name) => {
    const res = await API.get(`/services/${namespace}/${name}`);
    return res.data?.data;
  },

  getServiceYaml: async (namespace, name) => {
    const res = await API.get(`/services/${namespace}/${name}/yaml`);
    return res.data?.data;
  },

  createService: async (namespace, serviceData) => {
    const res = await API.post('/services', { namespace, body: serviceData });
    return res.data;
  },

  updateService: async (namespace, name, updateData) => {
    const res = await API.put(`/services/${namespace}/${name}`, updateData);
    return res.data;
  },

  deleteService: async (namespace, name) => {
    const res = await API.delete(`/services/${namespace}/${name}`);
    return res.data;
  }
};
