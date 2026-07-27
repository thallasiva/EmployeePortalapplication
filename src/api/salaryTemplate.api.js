import apiClient from './client';

export const listSalaryTemplates  = ()         => apiClient.get('/salary-templates').then(r => r.data.data);
export const getSalaryTemplate    = (id)       => apiClient.get(`/salary-templates/${id}`).then(r => r.data.data);
export const createSalaryTemplate = (data)     => apiClient.post('/salary-templates', data).then(r => r.data.data);
export const updateSalaryTemplate = (id, data) => apiClient.put(`/salary-templates/${id}`, data).then(r => r.data.data);
export const deleteSalaryTemplate = (id)       => apiClient.delete(`/salary-templates/${id}`).then(r => r.data.data);
