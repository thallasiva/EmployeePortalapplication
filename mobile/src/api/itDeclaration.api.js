import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const itDeclarationApi = {
  cycle:    () => client.get('/it-declaration/cycle').then(unwrap),
  my:       () => client.get('/it-declaration/my').then(unwrap),
  save:     (data) => client.post('/it-declaration/my/save', data).then(unwrap),
  myProofs: () => client.get('/it-declaration/my/proofs').then(unwrap),
  // Admin
  adminCycles: () => client.get('/it-declaration/admin/cycles').then(unwrap),
  adminAll:    (params) => client.get('/it-declaration/admin/all', { params }).then(unwrap),
};
