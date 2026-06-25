import apiClient, { unwrap } from './client';

/** Employee — create a ticket */
export const createTicket = (data) =>
  apiClient.post('/helpdesk', data).then(unwrap);

/** Employee — my own tickets */
export const myTickets = (params = {}) =>
  apiClient.get('/helpdesk/me', { params }).then(unwrap);

/** Manager — tickets raised by direct reports */
export const teamTickets = (params = {}) =>
  apiClient.get('/helpdesk/team', { params }).then(unwrap);

/** Admin — all tickets */
export const allTickets = (params = {}) =>
  apiClient.get('/helpdesk', { params }).then(unwrap);

/** Get single ticket with comments */
export const getTicket = (id) =>
  apiClient.get(`/helpdesk/${id}`).then(unwrap);

/** Update ticket status */
export const updateTicketStatus = (id, status) =>
  apiClient.put(`/helpdesk/${id}/status`, { status }).then(unwrap);

/** Assign ticket */
export const assignTicket = (id, assigned_to) =>
  apiClient.put(`/helpdesk/${id}/assign`, { assigned_to }).then(unwrap);

/** Add comment */
export const addComment = (id, comment) =>
  apiClient.post(`/helpdesk/${id}/comments`, { comment }).then(unwrap);
