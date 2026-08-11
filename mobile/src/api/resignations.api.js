import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const resignationsApi = {
  // Employee
  my:       () => client.get('/resignations/my').then(unwrap),
  submit:   (data) => client.post('/resignations/my', data).then(unwrap),
  withdraw: (id)   => client.put(`/resignations/my/${id}/withdraw`).then(unwrap),
  // Manager
  team:          () => client.get('/resignations/manager/team').then(unwrap),
  managerReview: (id, data) => client.put(`/resignations/manager/${id}/review`, data).then(unwrap),
  // Admin
  all:         (params) => client.get('/resignations/admin/all', { params }).then(unwrap),
  adminReview: (id, data) => client.put(`/resignations/admin/${id}/review`, data).then(unwrap),
};
