import apiClient from './client';

const B = '/salary-components';


export const listComponents = (active) => apiClient.get(`${B}/components`, { params: active != null ? { active } : {} }).then((r) => r.data.data);
export const getComponent = (id) => apiClient.get(`${B}/components/${id}`).then((r) => r.data.data);
export const createComponent = (data) => apiClient.post(`${B}/components`, data).then((r) => r.data.data);
export const updateComponent = (id, d) => apiClient.put(`${B}/components/${id}`, d).then((r) => r.data.data);
export const toggleComponent = (id, active) => apiClient.patch(`${B}/components/${id}/toggle`, { active }).then((r) => r.data.data);


export const listStructures = () => apiClient.get(`${B}/structures`).then((r) => r.data.data);
export const getStructure = (id) => apiClient.get(`${B}/structures/${id}`).then((r) => r.data.data);
export const createStructure = (data) => apiClient.post(`${B}/structures`, data).then((r) => r.data.data);
export const updateStructure = (id, d) => apiClient.put(`${B}/structures/${id}`, d).then((r) => r.data.data);
export const removeStructureLine = (structureId, componentId) =>
apiClient.delete(`${B}/structures/${structureId}/components/${componentId}`).then((r) => r.data.data);


export const computeCTC = (structure_id, ctc_annual, overrides = {}) =>
apiClient.post(`${B}/compute-ctc`, { structure_id, ctc_annual, overrides }).then((r) => r.data.data);
