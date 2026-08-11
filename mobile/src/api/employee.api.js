import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const employeeApi = {
  list: (params) => client.get('/employees', { params }).then(unwrap),
  get: (id) => client.get(`/employees/${id}`).then(unwrap),
  create: (data) => client.post('/employees', data).then(unwrap),
  update: (id, data) => client.put(`/employees/${id}`, data).then(unwrap),
  delete: (id) => client.delete(`/employees/${id}`),
  departments: () => client.get('/departments').then(unwrap),
  designations: () => client.get('/designations').then(unwrap),
  myProfile: () => client.get('/employees/me').then(unwrap),
};
