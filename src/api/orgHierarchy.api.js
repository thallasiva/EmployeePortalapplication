import apiClient, { unwrap } from "./client";

const BASE = "/org-hierarchy";

export const getOrgStats        = ()       => apiClient.get(`${BASE}/stats`).then(unwrap);
export const getOrgTree         = (params) => apiClient.get(`${BASE}/tree`, { params }).then(unwrap);
export const getUnassigned      = ()       => apiClient.get(`${BASE}/unassigned`).then(unwrap);
export const getManagers        = ()       => apiClient.get(`${BASE}/managers`).then(unwrap);
export const getManagerDetails  = (id)     => apiClient.get(`${BASE}/managers/${id}`).then(unwrap);
export const searchOrg          = (params) => apiClient.get(`${BASE}/search`, { params }).then(unwrap);

export const assignManager  = (body) => apiClient.post(`${BASE}/assign`, body).then(unwrap);
export const bulkAssign     = (body) => apiClient.post(`${BASE}/bulk-assign`, body).then(unwrap);
export const transferManager= (body) => apiClient.post(`${BASE}/transfer`, body).then(unwrap);

export const listDelegations  = (params) => apiClient.get(`${BASE}/delegations`, { params }).then(unwrap);
export const createDelegation = (body)   => apiClient.post(`${BASE}/delegations`, body).then(unwrap);
export const cancelDelegation = (id)     => apiClient.put(`${BASE}/delegations/${id}/cancel`).then(unwrap);

export const getReportingHistory = (params) => apiClient.get(`${BASE}/history`, { params }).then(unwrap);
