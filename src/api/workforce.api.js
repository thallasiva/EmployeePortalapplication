import apiClient, { unwrap } from "./client";

export const listTrainingCourses = () => apiClient.get("/training/courses").then(unwrap);
export const saveTrainingCourse = (course, id) =>
  (id ? apiClient.put(`/training/courses/${id}`, course) : apiClient.post("/training/courses", course)).then(unwrap);
export const listTrainingAssignments = () => apiClient.get("/training/assignments").then(unwrap);
export const assignTraining = (courseId, payload) => apiClient.post(`/training/courses/${courseId}/assign`, payload).then(unwrap);
export const getMyTraining = () => apiClient.get("/training/me").then(unwrap);
export const updateMyTraining = (id, status) => apiClient.put(`/training/me/assignments/${id}`, { status }).then(unwrap);
export const listAssets = () => apiClient.get("/assets").then(unwrap);
export const getAssetDashboard = () => apiClient.get("/assets/dashboard").then(unwrap);
export const createAsset = (payload) => apiClient.post("/assets", payload).then(unwrap);
export const assignAsset = (id, employeeId) => apiClient.post(`/assets/${id}/assign`, { employee_id: employeeId }).then(unwrap);
export const returnAsset = (id, return_condition) => apiClient.post(`/assets/${id}/return`, { return_condition }).then(unwrap);
export const updateAssetStatus = (id, status) => apiClient.put(`/assets/${id}/status`, { status }).then(unwrap);
export const getMyAssets = () => apiClient.get("/assets/me").then(unwrap);
export const listAssetCategories = (includeInactive = true) => apiClient.get("/assets/categories", { params: { include_inactive: includeInactive } }).then(unwrap);
export const saveAssetCategory = (category, id) =>
  (id ? apiClient.put(`/assets/categories/${id}`, category) : apiClient.post("/assets/categories", category)).then(unwrap);
export const listAssetAllocations = (params) => apiClient.get("/assets/allocations", { params }).then(unwrap);
export const listAssetReturns = () => apiClient.get("/assets/returns").then(unwrap);
export const listAssetRequests = () => apiClient.get("/assets/requests").then(unwrap);
export const listMyAssetRequests = () => apiClient.get("/assets/requests/mine").then(unwrap);
export const createAssetRequest = (payload) => apiClient.post("/assets/requests", payload).then(unwrap);
export const reviewAssetRequest = (id, payload) => apiClient.put(`/assets/requests/${id}/review`, payload).then(unwrap);
export const fulfillAssetRequest = (id, assetId) => apiClient.post(`/assets/requests/${id}/fulfill`, { asset_id: assetId }).then(unwrap);
export const listAssetMaintenance = () => apiClient.get("/assets/maintenance").then(unwrap);
export const createAssetMaintenance = (payload) => apiClient.post("/assets/maintenance", payload).then(unwrap);
export const updateAssetMaintenance = (id, payload) => apiClient.put(`/assets/maintenance/${id}`, payload).then(unwrap);
export const transferAsset = (id, payload) => apiClient.post(`/assets/${id}/transfer`, payload).then(unwrap);
export const listAssetTransfers = () => apiClient.get("/assets/transfers").then(unwrap);
export const getAssetReport = (params) => apiClient.get("/assets/reports", { params }).then(unwrap);
export const listPendingApprovals = () => apiClient.get("/approvals").then(unwrap);
