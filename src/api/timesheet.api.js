import apiClient, { unwrap, unwrapList } from "./client";

const BASE = "/timesheets";

// ─── Employee Tasks ──────────────────────────────────────────────────────────

/** GET /timesheets/my-tasks */
export const getMyTasks = () =>
  apiClient.get(`${BASE}/my-tasks`).then(r => unwrap(r) ?? []);

/** POST /timesheets/my-tasks  { task_name, project_name, description } */
export const createTask = (payload) =>
  apiClient.post(`${BASE}/my-tasks`, payload).then(unwrap);

/** PUT /timesheets/my-tasks/:taskId */
export const updateTask = (taskId, payload) =>
  apiClient.put(`${BASE}/my-tasks/${taskId}`, payload).then(unwrap);

/** DELETE /timesheets/my-tasks/:taskId */
export const deleteTask = (taskId) =>
  apiClient.delete(`${BASE}/my-tasks/${taskId}`).then(unwrap);

// ─── Employee Timesheets ─────────────────────────────────────────────────────

/** GET /timesheets/my */
export const getMyTimesheets = () =>
  apiClient.get(`${BASE}/my`).then(r => unwrap(r) ?? []);

/** GET /timesheets/my/dashboard-counts */
export const getEmployeeDashboardCounts = () =>
  apiClient.get(`${BASE}/my/dashboard-counts`).then(unwrap);

/** POST /timesheets/my/save-entries  { weekDate, entries[] } */
export const saveTimesheetEntries = (payload) =>
  apiClient.post(`${BASE}/my/save-entries`, payload).then(unwrap);

/** POST /timesheets/my/:timesheetId/submit */
export const submitTimesheet = (timesheetId) =>
  apiClient.post(`${BASE}/my/${timesheetId}/submit`).then(unwrap);

/** GET /timesheets/my/:timesheetId */
export const getTimesheetDetail = (timesheetId) =>
  apiClient.get(`${BASE}/my/${timesheetId}`).then(unwrap);

// ─── Extra Work ──────────────────────────────────────────────────────────────

/** GET /timesheets/extra-work/my */
export const getMyExtraWork = () =>
  apiClient.get(`${BASE}/extra-work/my`).then(r => unwrap(r) ?? []);

/** POST /timesheets/extra-work  { timesheet_id, work_date, task_name, extra_hours, reason } */
export const createExtraWorkRequest = (payload) =>
  apiClient.post(`${BASE}/extra-work`, payload).then(unwrap);

// ─── Manager ─────────────────────────────────────────────────────────────────

/** GET /timesheets/manager/team?status= */
export const getManagerTimesheets = (params) =>
  apiClient.get(`${BASE}/manager/team`, { params }).then(r => unwrap(r) ?? []);

/** GET /timesheets/manager/full-dashboard */
export const getManagerFullDashboard = () =>
  apiClient.get(`${BASE}/manager/full-dashboard`).then(unwrap);

/** GET /timesheets/manager/dashboard-counts */
export const getManagerDashboardCounts = () =>
  apiClient.get(`${BASE}/manager/dashboard-counts`).then(unwrap);

/** POST /timesheets/manager/:timesheetId/review  { decision, comments } */
export const reviewTimesheet = (timesheetId, payload) =>
  apiClient.post(`${BASE}/manager/${timesheetId}/review`, payload).then(unwrap);

/** GET /timesheets/manager/extra-work */
export const getManagerExtraWork = () =>
  apiClient.get(`${BASE}/manager/extra-work`).then(r => unwrap(r) ?? []);

/** POST /timesheets/manager/extra-work/:extraWorkId/review */
export const reviewExtraWork = (extraWorkId, payload) =>
  apiClient.post(`${BASE}/manager/extra-work/${extraWorkId}/review`, payload).then(unwrap);

/** GET /timesheets/:timesheetId  (manager/admin view any) */
export const getAnyTimesheetDetail = (timesheetId) =>
  apiClient.get(`${BASE}/${timesheetId}`).then(unwrap);

// ─── Admin ────────────────────────────────────────────────────────────────────

/** GET /timesheets/admin/all?status=&employee_id= */
export const getAllTimesheets = (params) =>
  apiClient.get(`${BASE}/admin/all`, { params }).then(r => unwrap(r) ?? []);

/** GET /timesheets/admin/dashboard-counts */
export const getAdminDashboardCounts = () =>
  apiClient.get(`${BASE}/admin/dashboard-counts`).then(unwrap);
