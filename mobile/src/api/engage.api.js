import client from './client';
const unwrap = r => r.data?.data ?? r.data;

// Engage uses calendar-events for announcements/events
export const engageApi = {
  events:      (params) => client.get('/calendar-events', { params }).then(unwrap),
  event:       (id)     => client.get(`/calendar-events/${id}`).then(unwrap),
  dashboard:   ()       => client.get('/dashboard/events').then(unwrap),
  activities:  ()       => client.get('/dashboard/recent-activities').then(unwrap),
};
