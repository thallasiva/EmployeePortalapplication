import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const worklifeApi = {
  myRequests: (params) => client.get('/request-hub/me', { params }).then(unwrap),
  create:     (data)   => client.post('/request-hub', data).then(unwrap),
  getOne:     (id)     => client.get(`/request-hub/${id}`).then(unwrap),
  updateStatus:(id, data) => client.put(`/request-hub/${id}/status`, data).then(unwrap),
  // Admin list
  list:       (params) => client.get('/request-hub', { params }).then(unwrap),
};
