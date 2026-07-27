import apiClient, { unwrap, unwrapList } from "./client";

const BASE = "/timesheets";




export const getMyTasks = () =>
apiClient.get(`${BASE}/my-tasks`).then((r) => unwrap(r) ?? []);


export const createTask = (payload) =>
apiClient.post(`${BASE}/my-tasks`, payload).then(unwrap);


export const updateTask = (taskId, payload) =>
apiClient.put(`${BASE}/my-tasks/${taskId}`, payload).then(unwrap);


export const deleteTask = (taskId) =>
apiClient.delete(`${BASE}/my-tasks/${taskId}`).then(unwrap);




export const getMyTimesheets = () =>
apiClient.get(`${BASE}/my`).then((r) => unwrap(r) ?? []);


export const getEmployeeDashboardCounts = () =>
apiClient.get(`${BASE}/my/dashboard-counts`).then(unwrap);


export const saveTimesheetEntries = (payload) =>
apiClient.post(`${BASE}/my/save-entries`, payload).then(unwrap);


export const submitTimesheet = (timesheetId) =>
apiClient.post(`${BASE}/my/${timesheetId}/submit`).then(unwrap);


export const getTimesheetDetail = (timesheetId) =>
apiClient.get(`${BASE}/my/${timesheetId}`).then(unwrap);




export const getMyExtraWork = () =>
apiClient.get(`${BASE}/extra-work/my`).then((r) => unwrap(r) ?? []);


export const createExtraWorkRequest = (payload) =>
apiClient.post(`${BASE}/extra-work`, payload).then(unwrap);




export const getManagerTimesheets = (params) =>
apiClient.get(`${BASE}/manager/team`, { params }).then((r) => unwrap(r) ?? []);


export const getManagerFullDashboard = () =>
apiClient.get(`${BASE}/manager/full-dashboard`).then(unwrap);


export const getManagerDashboardCounts = () =>
apiClient.get(`${BASE}/manager/dashboard-counts`).then(unwrap);


export const reviewTimesheet = (timesheetId, payload) =>
apiClient.post(`${BASE}/manager/${timesheetId}/review`, payload).then(unwrap);


export const getManagerExtraWork = () =>
apiClient.get(`${BASE}/manager/extra-work`).then((r) => unwrap(r) ?? []);


export const reviewExtraWork = (extraWorkId, payload) =>
apiClient.post(`${BASE}/manager/extra-work/${extraWorkId}/review`, payload).then(unwrap);


export const getAnyTimesheetDetail = (timesheetId) =>
apiClient.get(`${BASE}/${timesheetId}`).then(unwrap);




export const getAllTimesheets = (params) =>
apiClient.get(`${BASE}/admin/all`, { params }).then((r) => unwrap(r) ?? []);


export const getAdminDashboardCounts = () =>
apiClient.get(`${BASE}/admin/dashboard-counts`).then(unwrap);
