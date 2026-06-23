import apiClient, { unwrapList, unwrap } from "./client";

/** GET /leave-types */
export const listLeaveTypes = (params) =>
  apiClient.get("/leave-types", { params }).then(unwrapList);

/** GET /leave-types/:id */
export const getLeaveType = (id) => apiClient.get(`/leave-types/${id}`).then(unwrap);

/** POST /leave-types */
export const createLeaveType = (payload) => apiClient.post("/leave-types", payload).then(unwrap);

/** PUT /leave-types/:id */
export const updateLeaveType = (id, payload) => apiClient.put(`/leave-types/${id}`, payload).then(unwrap);

/** DELETE /leave-types/:id */
export const deleteLeaveType = (id) => apiClient.delete(`/leave-types/${id}`).then(unwrap);
