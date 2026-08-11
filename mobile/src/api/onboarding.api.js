import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const onboardingApi = {
  list:       (params) => client.get('/joining/invitations', { params }).then(unwrap),
  getOne:     (id)     => client.get(`/joining/invitations/${id}`).then(unwrap),
  review:     (id, data) => client.put(`/joining/invitations/${id}/review`, data).then(unwrap),
  resend:     (id)     => client.post(`/joining/invitations/${id}/resend`).then(unwrap),
  myJoining:  ()       => client.get('/joining/my-joining-docs').then(unwrap),
};
