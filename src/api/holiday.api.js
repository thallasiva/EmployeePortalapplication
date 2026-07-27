import apiClient, { unwrap } from "./client";

export const listHolidays = (params) =>
apiClient.get("/holidays", { params }).then(unwrap);

export const listHolidayLocations = () =>
apiClient.get("/holidays/locations").then(unwrap);

export const getHoliday = (id) => apiClient.get(`/holidays/${id}`).then(unwrap);

export const createHoliday = (payload) =>
apiClient.post("/holidays", payload).then(unwrap);

export const updateHoliday = (id, payload) =>
apiClient.put(`/holidays/${id}`, payload).then(unwrap);

export const deleteHoliday = (id) => apiClient.delete(`/holidays/${id}`).then(unwrap);


export const importHolidays = (holidays) =>
apiClient.post("/holidays/import", { holidays }).then(unwrap);
