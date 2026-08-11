import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const calendarApi = {
  events:   (params) => client.get('/calendar-events', { params }).then(unwrap),
  event:    (id)     => client.get(`/calendar-events/${id}`).then(unwrap),
  create:   (data)   => client.post('/calendar-events', data).then(unwrap),
  update:   (id, data) => client.put(`/calendar-events/${id}`, data).then(unwrap),
  delete:   (id)     => client.delete(`/calendar-events/${id}`),
  // Holidays
  holidays: (params) => client.get('/holidays', { params }).then(unwrap),
};
