import apiClient, { unwrap } from "./client";
const BASE = "/appraisal";


export const getAppraisalCycle = () => apiClient.get(`${BASE}/cycle`).then(unwrap);
export const getAllAppraisalCycles = () => apiClient.get(`${BASE}/cycles`).then(unwrap);
export const createAppraisalCycle = (body) => apiClient.post(`${BASE}/cycles`, body).then(unwrap);
export const updateCycleSettings = (id, body) => apiClient.put(`${BASE}/cycle/${id}/settings`, body).then(unwrap);
export const rolloutCycle = (id, body) => apiClient.post(`${BASE}/cycle/${id}/rollout`, body).then(unwrap);
export const disableCycle = (id) => apiClient.post(`${BASE}/cycle/${id}/disable`).then(unwrap);


export const toggleAppraisalCycle = () => apiClient.put(`${BASE}/cycle/toggle`).then(unwrap);


export const getMyAppraisal = () => apiClient.get(`${BASE}/my`).then(unwrap);
export const saveMyAppraisal = (body) => apiClient.post(`${BASE}/my/save`, body).then(unwrap);


export const getTeamAppraisals = () => apiClient.get(`${BASE}/team`).then(unwrap);
export const saveManagerRating = (id, body) => apiClient.put(`${BASE}/${id}/manager-rate`, body).then(unwrap);


export const getAllAppraisals = (params) => apiClient.get(`${BASE}/all`, { params }).then(unwrap);
export const updateAppraisalStatus = (id, status) => apiClient.put(`${BASE}/${id}/status`, { status }).then(unwrap);


export const getEnrollments = (cycleId) => apiClient.get(`${BASE}/enrollments`, { params: { cycle_id: cycleId } }).then(unwrap);
export const enrollEmployees = (cycleId, ids) => apiClient.post(`${BASE}/enrollments`, { cycle_id: cycleId, employee_ids: ids }).then(unwrap);
export const unenrollEmployee = (employeeId, cycleId) => apiClient.delete(`${BASE}/enrollments/${employeeId}`, { params: { cycle_id: cycleId } }).then(unwrap);
