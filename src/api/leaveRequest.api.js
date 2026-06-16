import apiClient, { unwrap, unwrapList } from "./client";

/** GET /leave-requests?page=&limit=&employee_id=&status=&leave_type_id=&department_id= */
export const listLeaveRequests = (params) =>
  apiClient.get("/leave-requests", { params }).then(unwrapList);

/** GET /leave-requests/me */
export const getMyLeaveRequests = (params) =>
  apiClient.get("/leave-requests/me", { params }).then(unwrapList);

/** GET /leave-requests/me/balances?year= */
export const getMyLeaveBalances = (params) =>
  apiClient.get("/leave-requests/me/balances", { params }).then(unwrap);

/** GET /leave-requests/:id */
export const getLeaveRequest = (id) => apiClient.get(`/leave-requests/${id}`).then(unwrap);

/** POST /leave-requests (apply for leave) */
export const applyLeave = (payload) => apiClient.post("/leave-requests", payload).then(unwrap);

/** PUT /leave-requests/:id/cancel */
export const cancelLeaveRequest = (id) =>
  apiClient.put(`/leave-requests/${id}/cancel`).then(unwrap);

/** PUT /leave-requests/:id/review */
export const reviewLeaveRequest = (id, payload) =>
  apiClient.put(`/leave-requests/${id}/review`, payload).then(unwrap);

/** GET /leave-requests/employees/:employeeId/balances */
export const getEmployeeLeaveBalances = (employeeId) =>
  apiClient.get(`/leave-requests/employees/${employeeId}/balances`).then(unwrap);
