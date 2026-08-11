import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const documentsApi = {
  myDocs:     (params) => client.get('/documents/me', { params }).then(unwrap),
  list:       (params) => client.get('/documents', { params }).then(unwrap),
  getOne:     (id)     => client.get(`/documents/${id}`).then(unwrap),
  categories: ()       => client.get('/documents/categories').then(unwrap),
  upload:     (data)   => client.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap),
  delete:     (id)     => client.delete(`/documents/${id}`),
};
