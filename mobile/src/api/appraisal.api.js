import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const appraisalApi = {
  // Employee
  cycle:        () => client.get('/appraisal/cycle').then(unwrap),
  my:           () => client.get('/appraisal/my').then(unwrap),
  save:         (data) => client.post('/appraisal/my/save', data).then(unwrap),
  // Manager
  team:         () => client.get('/appraisal/team').then(unwrap),
  rateEmployee: (id, data) => client.put(`/appraisal/${id}/manager-rate`, data).then(unwrap),
  // Admin
  cycles:       () => client.get('/appraisal/cycles').then(unwrap),
  all:          (params) => client.get('/appraisal/all', { params }).then(unwrap),
  enrollments:  () => client.get('/appraisal/enrollments').then(unwrap),
};
