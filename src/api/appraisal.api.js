import apiClient, { unwrap } from "./client";
const BASE = "/appraisal";

export const getAppraisalCycle    = ()       => apiClient.get(`${BASE}/cycle`).then(unwrap);
export const toggleAppraisalCycle = ()       => apiClient.put(`${BASE}/cycle/toggle`).then(unwrap);
export const updateCycleSettings  = (body)   => apiClient.put(`${BASE}/cycle/settings`, body).then(unwrap);
export const getMyAppraisal       = ()       => apiClient.get(`${BASE}/my`).then(unwrap);
export const saveMyAppraisal      = (body)   => apiClient.post(`${BASE}/my/save`, body).then(unwrap);
export const getTeamAppraisals    = ()       => apiClient.get(`${BASE}/team`).then(unwrap);
export const saveManagerRating    = (id, b)  => apiClient.put(`${BASE}/${id}/manager-rate`, b).then(unwrap);
export const getAllAppraisals      = (params) => apiClient.get(`${BASE}/all`, { params }).then(unwrap);
export const updateAppraisalStatus = (id, status) => apiClient.put(`${BASE}/${id}/status`, { status }).then(unwrap);
