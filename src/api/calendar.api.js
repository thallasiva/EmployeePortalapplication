import apiClient, { unwrap, unwrapList } from "./client";


export const listCalendarEvents = (params) =>
apiClient.get("/calendar-events", { params }).then(unwrapList);


export const createCalendarEvent = (payload) =>
apiClient.post("/calendar-events", payload).then(unwrap);


export const updateCalendarEvent = (id, payload) =>
apiClient.put(`/calendar-events/${id}`, payload).then(unwrap);


export const deleteCalendarEvent = (id) =>
apiClient.delete(`/calendar-events/${id}`).then(unwrap);
