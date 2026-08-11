import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const workflowApi = {
  // Delegations (workflow)
  myDelegations: () => client.get('/workflow-delegates/me').then(unwrap),
  list:          (params) => client.get('/workflow-delegates', { params }).then(unwrap),
  create:        (data)   => client.post('/workflow-delegates', data).then(unwrap),
  cancel:        (id)     => client.put(`/workflow-delegates/${id}/cancel`).then(unwrap),
  // Org hierarchy pending items
  hierarchy:     () => client.get('/org-hierarchy/tree').then(unwrap),
};
