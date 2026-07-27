import apiClient, { unwrap } from './client';


export const createTicket = (data) =>
apiClient.post('/helpdesk', data).then(unwrap);


export const myTickets = (params = {}) =>
apiClient.get('/helpdesk/me', { params }).then(unwrap);


export const teamTickets = (params = {}) =>
apiClient.get('/helpdesk/team', { params }).then(unwrap);


export const allTickets = (params = {}) =>
apiClient.get('/helpdesk', { params }).then(unwrap);


export const getTicket = (id) =>
apiClient.get(`/helpdesk/${id}`).then(unwrap);


export const updateTicketStatus = (id, status) =>
apiClient.put(`/helpdesk/${id}/status`, { status }).then(unwrap);


export const assignTicket = (id, assigned_to) =>
apiClient.put(`/helpdesk/${id}/assign`, { assigned_to }).then(unwrap);


export const addComment = (id, comment) =>
apiClient.post(`/helpdesk/${id}/comments`, { comment }).then(unwrap);







export const managerAction = (id, action, forwardedToTeam = null, comment = '') =>
apiClient.put(`/helpdesk/${id}/manager-action`, {
  action,
  forwarded_to_team: forwardedToTeam,
  comment
}).then(unwrap);





export const closeTicket = (id) =>
apiClient.put(`/helpdesk/${id}/close`).then(unwrap);





export const reopenTicket = (id, comment = '') =>
apiClient.put(`/helpdesk/${id}/reopen`, { comment }).then(unwrap);
