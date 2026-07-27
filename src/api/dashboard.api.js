import apiClient, { unwrap } from "./client";


export const getDashboardStats = () => apiClient.get("/dashboard/stats").then(unwrap);


export const getAttendanceDashboard = (date) =>
apiClient.get("/dashboard/attendance", { params: { date } }).then(unwrap);


export const getTeamLeaveCalendar = (year, month) =>
apiClient.get("/dashboard/team-leave-calendar", { params: { year, month } }).then(unwrap);


export const getDashboardEvents = (month) =>
apiClient.get("/dashboard/events", { params: { month } }).then(unwrap);


export const getRecentActivities = (limit) =>
apiClient.get("/dashboard/recent-activities", { params: { limit } }).then(unwrap);
