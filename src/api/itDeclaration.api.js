import apiClient from "./client";
const BASE = "/it-declaration";
const d = (r) => r.data;   // IT Declaration backend returns raw objects, not { success, data } wrappers

// ── Cycle ──────────────────────────────────────────────────────────────────
export const getITCycle           = ()         => apiClient.get(`${BASE}/cycle`).then(d);
export const getAllITCycles        = ()         => apiClient.get(`${BASE}/admin/cycles`).then(d);
export const createITCycle        = (body)     => apiClient.post(`${BASE}/admin/cycles`, body).then(d);
export const updateITCycle        = (id, body) => apiClient.put(`${BASE}/admin/cycles/${id}`, body).then(d);
export const toggleITCycle        = (id)       => apiClient.put(`${BASE}/admin/cycles/${id}/toggle`).then(d);

// ── Employee declaration ────────────────────────────────────────────────────
export const getMyITDeclaration   = ()         => apiClient.get(`${BASE}/my`).then(d);
export const saveMyITDeclaration  = (body)     => apiClient.post(`${BASE}/my/save`, body).then(d);

// ── Proof of investment ────────────────────────────────────────────────────
export const getMyProofs          = ()         => apiClient.get(`${BASE}/my/proofs`).then(d);
export const uploadProof          = (formData) => apiClient.post(`${BASE}/my/proofs`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
}).then(d);
export const deleteProof          = (id)       => apiClient.delete(`${BASE}/my/proofs/${id}`).then(d);
export const downloadProofUrl     = (id)       => `${apiClient.defaults.baseURL}${BASE}/proofs/${id}/file`;
export const adminDownloadProofUrl = (id)      => `${apiClient.defaults.baseURL}${BASE}/admin/proofs/${id}/file`;

// ── Admin ──────────────────────────────────────────────────────────────────
export const getAllITDeclarations  = (params)  => apiClient.get(`${BASE}/admin/all`, { params }).then(d);
export const reviewDeclaration    = (id, body) => apiClient.put(`${BASE}/admin/declarations/${id}/review`, body).then(d);
export const reviewProof          = (id, body) => apiClient.put(`${BASE}/admin/proofs/${id}/review`, body).then(d);
