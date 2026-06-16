import apiClient, { unwrap } from "./client";

/** GET /dashboard/stats -> employees_count, companies_count, pending_leaves_count, salaries_count, open_tickets_count, open_jobs_count */
export const getDashboardStats = () => apiClient.get("/dashboard/stats").then(unwrap);

/** GET /dashboard/attendance?date=YYYY-MM-DD */
export const getAttendanceDashboard = (date) =>
  apiClient.get("/dashboard/attendance", { params: { date } }).then(unwrap);

/** GET /dashboard/team-leave-calendar?year=&month= */
export const getTeamLeaveCalendar = (year, month) =>
  apiClient.get("/dashboard/team-leave-calendar", { params: { year, month } }).then(unwrap);

/** GET /dashboard/events?month= */
export const getDashboardEvents = (month) =>
  apiClient.get("/dashboard/events", { params: { month } }).then(unwrap);

/** GET /dashboard/recent-activities?limit= */
export const getRecentActivities = (limit) =>
  apiClient.get("/dashboard/recent-activities", { params: { limit } }).then(unwrap);
