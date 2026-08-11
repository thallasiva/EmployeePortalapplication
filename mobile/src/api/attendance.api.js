import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const attendanceApi = {
  today:       ()       => client.get('/attendance/me/today').then(unwrap),
  monthly:     (params) => client.get('/attendance/me/monthly', { params }).then(unwrap),
  myHistory:   (params) => client.get('/attendance/me/monthly', { params }).then(unwrap),
  checkIn:     (data)   => client.post('/attendance/check-in', data).then(unwrap),
  checkOut:    (data)   => client.post('/attendance/check-out', data).then(unwrap),
  // Admin
  list:        (params) => client.get('/attendance', { params }).then(unwrap),
  dashboard:   ()       => client.get('/attendance/dashboard').then(unwrap),
  // Regularization
  regularizations:       (params) => client.get('/attendance/regularizations', { params }).then(unwrap),
  createRegularization:  (data)   => client.post('/attendance/regularizations', data).then(unwrap),
  // Employee-specific (admin)
  employeeToday:   (empId) => client.get(`/attendance/employees/${empId}/today`).then(unwrap),
  employeeMonthly: (empId, params) => client.get(`/attendance/employees/${empId}/monthly`, { params }).then(unwrap),
};

// Added: regularization review for admin
export const reviewRegularization = (id, data) =>
  client.put(`/attendance/regularizations/${id}/review`, data).then(r => r.data?.data ?? r.data);
