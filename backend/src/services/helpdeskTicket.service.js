const BaseService = require('./base.service');
const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');
const notify = require('./mailNotify.service');

class HelpdeskTicketService extends BaseService {
  constructor() {
    super('helpdesk_tickets', 'ticket_id', [
    'employee_id', 'category', 'subject', 'description', 'priority',
    'status', 'assigned_to', 'forwarded_to_team', 'attachment_url']
    );
  }

  async list({ employee_id, status, priority, category, assigned_to, forwarded_to_team, search, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_helpdesk_tickets(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
      employee_id ?? null,
      status ?? null,
      priority ?? null,
      category ?? null,
      assigned_to ?? null,
      forwarded_to_team ?? null,
      search ?? null,
      limit != null ? Number(limit) : null,
      limit != null ? Number(offset || 0) : null]

    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async listTeam(managerId, { status, priority, category, search, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_team_helpdesk(?, ?, ?, ?, ?, ?, ?)',
      [
      managerId,
      status ?? null,
      priority ?? null,
      category ?? null,
      search ?? null,
      limit != null ? Number(limit) : null,
      limit != null ? Number(offset || 0) : null]

    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_ticket_with_comments(?)', [id]);
    const ticket = (results[0] ?? [])[0] ?? null;
    if (!ticket) return null;
    return { ...ticket, comments: results[1] ?? [] };
  }

  async updateStatus(id, status) {
    await callProcedure('sp_update_ticket_status(?, ?)', [id, status]);
    const ticket = await this.getDetails(id);

    if (ticket && status === 'Resolved') {
      notify.ticketResolved({
        reporterEmail: ticket.reporter_email || ticket.employee_email || null,
        reporterName: ticket.reporter_name || ticket.employee_name || 'Employee',
        ticketId: ticket.ticket_id,
        subject: ticket.subject
      });
    }
    return ticket;
  }

  async assign(id, assignedTo) {
    await callProcedure('sp_assign_ticket(?, ?)', [id, assignedTo]);
    const ticket = await this.getDetails(id);

    if (ticket && ticket.agent_email) {
      notify.ticketCreated({
        agentEmail: ticket.agent_email,
        agentName: ticket.agent_name || 'Agent',
        reporterName: ticket.reporter_name || ticket.employee_name || 'Employee',
        ticketId: ticket.ticket_id,
        subject: ticket.subject,
        priority: ticket.priority,
        category: ticket.category
      });
    }
    return ticket;
  }

  async managerAction(managerId, ticketId, action, forwardedToTeam, comment) {
    const autoComment = action === 'approve' ?
    comment && comment.trim() ?
    `[Approved & Forwarded to ${forwardedToTeam}] ${comment.trim()}` :
    `Request approved and forwarded to ${forwardedToTeam}.` :
    `[Rejected] ${(comment || '').trim()}`;

    await callProcedure('sp_manager_action_ticket(?, ?, ?, ?, ?, @ok, @msg)', [
    managerId, ticketId, action, forwardedToTeam || null, autoComment]
    );
    const out = await readOuts('ok', 'msg');
    if (!out[0]?.ok) {
      const msg = out[0]?.msg ?? 'Cannot action ticket';
      if (msg.includes('not in your team')) throw ApiError.forbidden(msg);
      throw ApiError.badRequest(msg);
    }
    return this.getDetails(ticketId);
  }

  async closeTicket(employeeId, ticketId) {
    await callProcedure('sp_close_ticket(?, ?, @ok, @msg)', [employeeId, ticketId]);
    const out = await readOuts('ok', 'msg');
    if (!out[0]?.ok) {
      const msg = out[0]?.msg ?? 'Cannot close';
      if (msg === 'Ticket not found') throw ApiError.notFound(msg);
      if (msg === 'Not your ticket') throw ApiError.forbidden(msg);
      throw ApiError.badRequest(msg);
    }
    return this.getDetails(ticketId);
  }

  async reopenTicket(employeeId, ticketId, comment) {
    const reason = comment && comment.trim() ?
    comment.trim() :
    'Employee is not satisfied with the resolution.';
    await callProcedure('sp_reopen_ticket(?, ?, ?, @ok, @msg)', [employeeId, ticketId, `[Reopened] ${reason}`]);
    const out = await readOuts('ok', 'msg');
    if (!out[0]?.ok) {
      const msg = out[0]?.msg ?? 'Cannot reopen';
      if (msg === 'Ticket not found') throw ApiError.notFound(msg);
      if (msg === 'Not your ticket') throw ApiError.forbidden(msg);
      throw ApiError.badRequest(msg);
    }
    return this.getDetails(ticketId);
  }

  async addComment(ticketId, commentedBy, comment) {
    await callProcedure('sp_add_helpdesk_comment(?, ?, ?)', [ticketId, commentedBy, comment]);
    const ticket = await this.getDetails(ticketId);

    if (ticket && ticket.reporter_email && ticket.assigned_to !== commentedBy) {
      notify.ticketUpdated({
        reporterEmail: ticket.reporter_email || ticket.employee_email || null,
        reporterName: ticket.reporter_name || ticket.employee_name || 'Employee',
        ticketId: ticket.ticket_id,
        subject: ticket.subject,
        updateMessage: comment
      });
    }
    return ticket;
  }
}

module.exports = new HelpdeskTicketService();
