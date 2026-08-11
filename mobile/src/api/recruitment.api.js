import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const recruitmentApi = {
  // Jobs
  jobs:       (params) => client.get('/hiring/jobs', { params }).then(unwrap),
  job:        (id)     => client.get(`/hiring/jobs/${id}`).then(unwrap),
  createJob:  (data)   => client.post('/hiring/jobs', data).then(unwrap),
  updateJob:  (id, data) => client.put(`/hiring/jobs/${id}`, data).then(unwrap),
  // Applications/Candidates
  candidates: (params) => client.get('/hiring/applications', { params }).then(unwrap),
  candidate:  (id)     => client.get(`/hiring/applications/${id}`).then(unwrap),
  createApplication: (data) => client.post('/hiring/applications', data).then(unwrap),
  // Referrals
  myReferrals:(params) => client.get('/hiring/referrals/me', { params }).then(unwrap),
  referrals:  (params) => client.get('/hiring/referrals', { params }).then(unwrap),
};
