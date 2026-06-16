import apiClient, { unwrapList, unwrap } from "./client";

/** GET /leave-types */
export const listLeaveTypes = (params) =>
  apiClient.get("/leave-types", { params }).then(unwrapList);

/** GET /leave-types/:id */
export const getLeaveType = (id) => apiClient.get(`/leave-types/${id}`).then(unwrap);
