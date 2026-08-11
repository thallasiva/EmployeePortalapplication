import client from './client';
const unwrap = r => r.data?.data ?? r.data;

export const peopleApi = {
  directory:   (params) => client.get('/employees/directory', { params }).then(unwrap),
  myTeam:      ()       => client.get('/employees/my-team').then(unwrap),
  orgChart:    ()       => client.get('/employees/org-chart').then(unwrap),
  employee:    (id)     => client.get(`/employees/${id}`).then(unwrap),
  departments: ()       => client.get('/departments').then(unwrap),
};
