import apiClient, { unwrapList, unwrap } from "./client";


export const listLeaveTypes = (params) =>
apiClient.get("/leave-types", { params }).then(unwrapList);


export const getLeaveType = (id) => apiClient.get(`/leave-types/${id}`).then(unwrap);


export const createLeaveType = (payload) => apiClient.post("/leave-types", payload).then(unwrap);


export const updateLeaveType = (id, payload) => apiClient.put(`/leave-types/${id}`, payload).then(unwrap);


export const deleteLeaveType = (id) => apiClient.delete(`/leave-types/${id}`).then(unwrap);
