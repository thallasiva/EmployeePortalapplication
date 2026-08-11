import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const dashboardApi = {
  // Single stats endpoint for both admin and employee
  adminStats:     () => client.get('/dashboard/stats').then(unwrap),
  employeeStats:  () => client.get('/dashboard/stats').then(unwrap),
  stats:          () => client.get('/dashboard/stats').then(unwrap),
  attendanceDash: (date) => client.get('/dashboard/attendance', { params: { date } }).then(unwrap),
  recentActivities: () => client.get('/dashboard/recent-activities').then(unwrap),
  events:         () => client.get('/dashboard/events').then(unwrap),
};
