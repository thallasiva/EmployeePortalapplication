import apiClient, { unwrap, unwrapList } from "./client";


export const listAttendance = (params) =>
apiClient.get("/attendance", { params }).then(unwrapList);


export const getMyTodayAttendance = () => apiClient.get("/attendance/me/today").then(unwrap);


export const getMyMonthlyAttendance = (params) =>
apiClient.get("/attendance/me/monthly", { params }).then(unwrap);


export const getMyAttendanceSwipes = (date) =>
apiClient.get("/attendance/me/swipes", { params: { date } }).then(unwrap);


export const checkIn = (payload) => apiClient.post("/attendance/check-in", payload).then(unwrap);


export const checkOut = (payload) => apiClient.post("/attendance/check-out", payload).then(unwrap);


export const getAttendanceDashboard = (date) =>
apiClient.get("/attendance/dashboard", { params: { date } }).then(unwrap);


export const getTeamLeaveCalendar = (params) =>
apiClient.get("/attendance/team-leave-calendar", { params }).then(unwrap);


export const listRegularizations = (params) =>
apiClient.get("/attendance/regularizations", { params }).then(unwrapList);


export const createRegularization = (payload) =>
apiClient.post("/attendance/regularizations", payload).then(unwrap);


export const reviewRegularization = (id, payload) =>
apiClient.put(`/attendance/regularizations/${id}/review`, payload).then(unwrap);


export const breakStart = (payload) => apiClient.post("/attendance/break-start", payload).then(unwrap);

export const breakEnd = (payload) => apiClient.post("/attendance/break-end", payload).then(unwrap);
