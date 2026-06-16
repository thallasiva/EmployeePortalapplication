import apiClient, { unwrap, unwrapList } from "./client";

/** GET /attendance?page=&limit=&employee_id=&department_id=&from_date=&to_date=&status= */
export const listAttendance = (params) =>
  apiClient.get("/attendance", { params }).then(unwrapList);

/** GET /attendance/me/today */
export const getMyTodayAttendance = () => apiClient.get("/attendance/me/today").then(unwrap);

/** GET /attendance/me/monthly?month=&year= */
export const getMyMonthlyAttendance = (params) =>
  apiClient.get("/attendance/me/monthly", { params }).then(unwrap);

/** POST /attendance/check-in */
export const checkIn = (payload) => apiClient.post("/attendance/check-in", payload).then(unwrap);

/** POST /attendance/check-out */
export const checkOut = (payload) => apiClient.post("/attendance/check-out", payload).then(unwrap);

/** GET /attendance/dashboard?date= */
export const getAttendanceDashboard = (date) =>
  apiClient.get("/attendance/dashboard", { params: { date } }).then(unwrap);

/** GET /attendance/team-leave-calendar?year=&month= */
export const getTeamLeaveCalendar = (params) =>
  apiClient.get("/attendance/team-leave-calendar", { params }).then(unwrap);

/** GET /attendance/regularizations */
export const listRegularizations = (params) =>
  apiClient.get("/attendance/regularizations", { params }).then(unwrapList);

/** POST /attendance/regularizations */
export const createRegularization = (payload) =>
  apiClient.post("/attendance/regularizations", payload).then(unwrap);

/** PUT /attendance/regularizations/:id/review */
export const reviewRegularization = (id, payload) =>
  apiClient.put(`/attendance/regularizations/${id}/review`, payload).then(unwrap);
