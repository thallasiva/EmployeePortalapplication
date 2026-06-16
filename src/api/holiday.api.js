import apiClient, { unwrap, unwrapList } from "./client";

/** GET /holidays?year=&holiday_calendar=&page=&limit= */
export const listHolidays = (params) =>
  apiClient.get("/holidays", { params }).then(unwrapList);

/** GET /holidays/:id */
export const getHoliday = (id) => apiClient.get(`/holidays/${id}`).then(unwrap);

/** POST /holidays (create a single holiday) */
export const createHoliday = (payload) =>
  apiClient.post("/holidays", payload).then(unwrap);

/** PUT /holidays/:id */
export const updateHoliday = (id, payload) =>
  apiClient.put(`/holidays/${id}`, payload).then(unwrap);

/** DELETE /holidays/:id */
export const deleteHoliday = (id) => apiClient.delete(`/holidays/${id}`).then(unwrap);

/**
 * POST /holidays/import — bulk import a holiday calendar.
 * `holidays` is an array of { holiday_name, holiday_date, holiday_calendar?, is_restricted? }
 */
export const importHolidays = (holidays) =>
  apiClient.post("/holidays/import", { holidays }).then(unwrap);
