import apiClient, { unwrap, unwrapList } from "./client";

/** GET /calendar-events?year=&month=&event_type= */
export const listCalendarEvents = (params) =>
  apiClient.get("/calendar-events", { params }).then(unwrapList);

/** POST /calendar-events */
export const createCalendarEvent = (payload) =>
  apiClient.post("/calendar-events", payload).then(unwrap);

/** PUT /calendar-events/:id */
export const updateCalendarEvent = (id, payload) =>
  apiClient.put(`/calendar-events/${id}`, payload).then(unwrap);

/** DELETE /calendar-events/:id */
export const deleteCalendarEvent = (id) =>
  apiClient.delete(`/calendar-events/${id}`).then(unwrap);
