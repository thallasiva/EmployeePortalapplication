import client from './client';
const unwrap = r => r.data?.data ?? r.data;

// Status map: mobile filter key → backend DB value
const STATUS_MAP = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  all: undefined,
};

export const helpdeskApi = {
  myTickets:   (params) => {
    const mapped = { ...params };
    if (mapped.status && STATUS_MAP[mapped.status] !== undefined) mapped.status = STATUS_MAP[mapped.status];
    else if (mapped.status === 'all') delete mapped.status;
    return client.get('/helpdesk/me', { params: mapped }).then(unwrap);
  },
  teamTickets: (params) => client.get('/helpdesk/team', { params }).then(unwrap),
  allTickets:  (params) => {
    const mapped = { ...params };
    if (mapped.status && STATUS_MAP[mapped.status] !== undefined) mapped.status = STATUS_MAP[mapped.status];
    else if (mapped.status === 'all') delete mapped.status;
    return client.get('/helpdesk', { params: mapped }).then(unwrap);
  },
  ticket:      (id)     => client.get(`/helpdesk/${id}`).then(unwrap),
  create:      (data)   => {
    // Capitalize priority to match backend validation: Low, Medium, High, Urgent
    const body = { ...data };
    if (body.priority) body.priority = body.priority.charAt(0).toUpperCase() + body.priority.slice(1).toLowerCase();
    if (body.priority === 'Critical') body.priority = 'Urgent'; // map critical→Urgent
    return client.post('/helpdesk', body).then(unwrap);
  },
  addComment:  (id, comment) => client.post(`/helpdesk/${id}/comments`, { comment }).then(unwrap),
  close:       (id)     => client.put(`/helpdesk/${id}/close`).then(unwrap),
  reopen:      (id, data) => client.put(`/helpdesk/${id}/reopen`, data).then(unwrap),
  updateStatus:(id, data) => client.put(`/helpdesk/${id}/status`, data).then(unwrap),
  assign:      (id, data) => client.put(`/helpdesk/${id}/assign`, data).then(unwrap),
};
