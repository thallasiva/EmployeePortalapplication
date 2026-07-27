import apiClient, { unwrap, unwrapList } from "./client";


export const listLeaveRequests = (params) =>
apiClient.get("/leave-requests", { params }).then(unwrapList);


export const getMyLeaveRequests = (params) =>
apiClient.get("/leave-requests/me", { params }).then(unwrapList);


export const getMyLeaveBalances = (params) =>
apiClient.get("/leave-requests/me/balances", { params }).then(unwrap);


export const getLeaveRequest = (id) => apiClient.get(`/leave-requests/${id}`).then(unwrap);


export const applyLeave = (payload) => apiClient.post("/leave-requests", payload).then(unwrap);


export const cancelLeaveRequest = (id) =>
apiClient.put(`/leave-requests/${id}/cancel`).then(unwrap);


export const reviewLeaveRequest = (id, payload) =>
apiClient.put(`/leave-requests/${id}/review`, payload).then(unwrap);


export const getEmployeeLeaveBalances = (employeeId) =>
apiClient.get(`/leave-requests/employees/${employeeId}/balances`).then(unwrap);


export const getAllLeaveBalances = (year) =>
apiClient.get("/leave-requests/admin/balances", { params: { year } }).then(unwrap);


export const adjustLeaveBalance = (payload) =>
apiClient.put("/leave-requests/admin/adjust", payload).then(unwrap);


export const initializeLeaveYear = (year) =>
apiClient.post("/leave-requests/admin/initialize-year", { year }).then(unwrap);


export const getLeaveSummary = (params) =>
apiClient.get("/leave-requests/admin/summary", { params }).then(unwrap);





export const accrueEarnedLeave = (payload) =>
apiClient.post("/leave-requests/admin/accrue-earned-leave", payload).then(unwrap);
