import apiClient, { unwrap, unwrapList } from "./client";
const BASE = "/kudos-feedback";
export const listKfCategories = (params) =>
apiClient.get(`${BASE}/categories`, { params }).then(unwrap);
export const createKfCategory = (payload) =>
apiClient.post(`${BASE}/categories`, payload).then(unwrap);
export const updateKfCategory = (id, payload) =>
apiClient.put(`${BASE}/categories/${id}`, payload).then(unwrap);
export const deleteKfCategory = (id) =>
apiClient.delete(`${BASE}/categories/${id}`).then(unwrap);
export const listKfEmployees = (params) =>
apiClient.get(`${BASE}/employees`, { params }).then(unwrap);
export const getKfSummary = () =>
apiClient.get(`${BASE}/summary`).then(unwrap);
export const listKudos = (params) =>
apiClient.get(`${BASE}/kudos`, { params }).then(unwrapList);
export const listTopRecognised = (params) =>
apiClient.get(`${BASE}/kudos/top`, { params }).then(unwrap);
export const giveKudos = (payload) =>
apiClient.post(`${BASE}/kudos`, payload).then((r) => r.data);
export const listFeedback = (params) =>
apiClient.get(`${BASE}/feedback`, { params }).then(unwrapList);
export const giveFeedback = (payload) =>
apiClient.post(`${BASE}/feedback`, payload).then((r) => r.data);
export const listFeedbackRequests = (params) =>
apiClient.get(`${BASE}/requests`, { params }).then(unwrap);
export const requestFeedback = (payload) =>
apiClient.post(`${BASE}/requests`, payload).then((r) => r.data);
export const declineFeedbackRequest = (id) =>
apiClient.patch(`${BASE}/requests/${id}/decline`).then(unwrap);
export const getKfTeam = () =>
apiClient.get(`${BASE}/team`).then(unwrap);
export const getKfReport = (params) =>
apiClient.get(`${BASE}/reports`, { params }).then(unwrap);
