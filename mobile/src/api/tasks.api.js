import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const tasksApi = {
  myTasks:    (params) => client.get('/timesheets/my-tasks', { params }).then(unwrap),
  create:     (data)   => client.post('/timesheets/my-tasks', data).then(unwrap),
  update:     (id, data) => client.put(`/timesheets/my-tasks/${id}`, data).then(unwrap),
  delete:     (id)     => client.delete(`/timesheets/my-tasks/${id}`),
  // Timesheets
  myTimesheets: (params) => client.get('/timesheets/my', { params }).then(unwrap),
  myTimesheet:  (id)     => client.get(`/timesheets/my/${id}`).then(unwrap),
  saveEntries:  (data)   => client.post('/timesheets/my/save-entries', data).then(unwrap),
  submit:       (id)     => client.post(`/timesheets/my/${id}/submit`).then(unwrap),
  dashboardCounts: () => client.get('/timesheets/my/dashboard-counts').then(unwrap),
  // Admin
  adminAll:    (params) => client.get('/timesheets/admin/all', { params }).then(unwrap),
  adminCounts: ()       => client.get('/timesheets/admin/dashboard-counts').then(unwrap),
  managerTeam: (params) => client.get('/timesheets/manager/team', { params }).then(unwrap),
  review:      (id, data) => client.post(`/timesheets/manager/${id}/review`, data).then(unwrap),
};
