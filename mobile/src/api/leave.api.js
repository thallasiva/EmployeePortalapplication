import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const leaveApi = {
  // Employee
  myLeaves: (params) => client.get('/leave-requests/me', { params }).then(unwrap),
  balance:  ()       => client.get('/leave-requests/me/balances').then(unwrap),
  apply:    (data)   => client.post('/leave-requests', data).then(unwrap),
  cancel:   (id)     => client.put(`/leave-requests/${id}/cancel`).then(unwrap),
  // Admin
  list:     (params) => client.get('/leave-requests', { params }).then(unwrap),
  getOne:   (id)     => client.get(`/leave-requests/${id}`).then(unwrap),
  review:   (id, data) => client.put(`/leave-requests/${id}/review`, data).then(unwrap),
  approve:  (id, data) => client.put(`/leave-requests/${id}/review`, { decision: 'approve', ...data }).then(unwrap),
  reject:   (id, data) => client.put(`/leave-requests/${id}/review`, { decision: 'reject', ...data }).then(unwrap),
  adminBalances: (params) => client.get('/leave-requests/admin/balances', { params }).then(unwrap),
  employeeBalances: (empId) => client.get(`/leave-requests/employees/${empId}/balances`).then(unwrap),
  // Leave types
  types: () => client.get('/leave-types').then(unwrap),
};
