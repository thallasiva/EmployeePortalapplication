const BaseService = require('./base.service');
const { callProcedure, callProcedureWithOuts, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const notify = require('./mailNotify.service');
class HelpdeskTicketService extends BaseService {
  constructor() {
    super('helpdesk_tickets', 'ticket_id', [
    'employee_id', 'category', 'subject', 'description', 'priority',
    'status', 'assigned_to', 'forwarded_to_team', 'attachment_url']
    );
  }
  async list({ employee_id, status, priority, category, assigned_to, forwarded_to_team, search, limit, offset, companyId } = {}) {
    const company = this.requireCompanyId(companyId);
    const conditions = ['e.company_id = ?'];
    const params = [company];
    for (const [field, value] of [
      ['t.employee_id', employee_id],
      ['t.status', status],
      ['t.priority', priority],
      ['t.category', category],
      ['t.assigned_to', assigned_to],
      ['t.forwarded_to_team', forwarded_to_team]
    ]) {
      if (value != null) {
        conditions.push(`${field} = ?`);
        params.push(value);
      }
    }
    if (search) {
      conditions.push('t.subject LIKE ?');
      params.push(`%${search}%`);
    }
    const where = conditions.join(' AND ');
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT t.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                e.emp_code, CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) AS assigned_to_name
           FROM helpdesk_tickets t
           JOIN employees e ON e.employee_id = t.employee_id
           LEFT JOIN employees a ON a.employee_id = t.assigned_to
          WHERE ${where}
          ORDER BY t.created_at DESC
          ${limit != null ? 'LIMIT ? OFFSET ?' : ''}`,
        limit != null ? [...params, Number(limit), Number(offset || 0)] : params
      ),
      query(
        `SELECT COUNT(*) AS total
           FROM helpdesk_tickets t
           JOIN employees e ON e.employee_id = t.employee_id
          WHERE ${where}`,
        params
      )
    ]);
    return { rows, total: countRows[0]?.total ?? 0 };
  }
  async listTeam(managerId, { status, priority, category, search, limit, offset, companyId } = {}) {
    const company = this.requireCompanyId(companyId);
    const conditions = ['e.company_id = ?', 'e.reporting_to = ?'];
    const params = [company, managerId];
    for (const [field, value] of [['t.status', status], ['t.priority', priority], ['t.category', category]]) {
      if (value != null) {
        conditions.push(`${field} = ?`);
        params.push(value);
      }
    }
    if (search) {
      conditions.push('t.subject LIKE ?');
      params.push(`%${search}%`);
    }
    const where = conditions.join(' AND ');
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT t.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                e.emp_code, CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) AS assigned_to_name
           FROM helpdesk_tickets t
           JOIN employees e ON e.employee_id = t.employee_id
           LEFT JOIN employees a ON a.employee_id = t.assigned_to
          WHERE ${where}
          ORDER BY t.created_at DESC
          ${limit != null ? 'LIMIT ? OFFSET ?' : ''}`,
        limit != null ? [...params, Number(limit), Number(offset || 0)] : params
      ),
      query(
        `SELECT COUNT(*) AS total
           FROM helpdesk_tickets t
           JOIN employees e ON e.employee_id = t.employee_id
          WHERE ${where}`,
        params
      )
    ]);
    return { rows, total: countRows[0]?.total ?? 0 };
  }
  requireCompanyId(companyId) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    return company;
  }
  async assertTicketCompany(id, companyId) {
    const company = this.requireCompanyId(companyId);
    const rows = await query(
      `SELECT t.employee_id
         FROM helpdesk_tickets t
         JOIN employees e ON e.employee_id = t.employee_id
        WHERE t.ticket_id = ? AND e.company_id = ?
        LIMIT 1`,
      [id, company]
    );
    if (!rows.length) throw ApiError.notFound('Ticket not found');
    return rows[0].employee_id;
  }
  async assertEmployeeCompany(employeeId, companyId) {
    const company = this.requireCompanyId(companyId);
    const rows = await query(
      'SELECT 1 FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [employeeId, company]
    );
    if (!rows.length) throw ApiError.forbidden('You can only access employee records in your company');
  }
  async getDetails(id, companyId) {
    await this.assertTicketCompany(id, companyId);
    const results = await callProcedure('sp_get_ticket_with_comments(?)', [id]);
    const ticket = (results[0] ?? [])[0] ?? null;
    if (!ticket) return null;
    return { ...ticket, comments: results[1] ?? [] };
  }
  async updateStatus(id, status, companyId) {
    await this.assertTicketCompany(id, companyId);
    await callProcedure('sp_update_ticket_status(?, ?)', [id, status]);
    const ticket = await this.getDetails(id, companyId);
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
  async assign(id, assignedTo, companyId) {
    await this.assertTicketCompany(id, companyId);
    if (assignedTo != null) await this.assertEmployeeCompany(assignedTo, companyId);
    await callProcedure('sp_assign_ticket(?, ?)', [id, assignedTo]);
    const ticket = await this.getDetails(id, companyId);
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
  async managerAction(managerId, ticketId, action, forwardedToTeam, comment, companyId) {
    await this.assertTicketCompany(ticketId, companyId);
    await this.assertEmployeeCompany(managerId, companyId);
    const autoComment = action === 'approve' ?
    comment && comment.trim() ?
    `[Approved & Forwarded to ${forwardedToTeam}] ${comment.trim()}` :
    `Request approved and forwarded to ${forwardedToTeam}.` :
    `[Rejected] ${(comment || '').trim()}`;
    const { outs: out } = await callProcedureWithOuts('sp_manager_action_ticket(?, ?, ?, ?, ?, @ok, @msg)', [
    managerId, ticketId, action, forwardedToTeam || null, autoComment]
    );
    if (!out.ok) {
      const msg = out.msg ?? 'Cannot action ticket';
      if (msg.includes('not in your team')) throw ApiError.forbidden(msg);
      throw ApiError.badRequest(msg);
    }
    return this.getDetails(ticketId, companyId);
  }
  async closeTicket(employeeId, ticketId, companyId) {
    await this.assertTicketCompany(ticketId, companyId);
    await this.assertEmployeeCompany(employeeId, companyId);
    const { outs: out } = await callProcedureWithOuts('sp_close_ticket(?, ?, @ok, @msg)', [employeeId, ticketId]);
    if (!out.ok) {
      const msg = out.msg ?? 'Cannot close';
      if (msg === 'Ticket not found') throw ApiError.notFound(msg);
      if (msg === 'Not your ticket') throw ApiError.forbidden(msg);
      throw ApiError.badRequest(msg);
    }
    return this.getDetails(ticketId, companyId);
  }
  async reopenTicket(employeeId, ticketId, comment, companyId) {
    await this.assertTicketCompany(ticketId, companyId);
    await this.assertEmployeeCompany(employeeId, companyId);
    const reason = comment && comment.trim() ?
    comment.trim() :
    'Employee is not satisfied with the resolution.';
    const { outs: out } = await callProcedureWithOuts('sp_reopen_ticket(?, ?, ?, @ok, @msg)', [employeeId, ticketId, `[Reopened] ${reason}`]);
    if (!out.ok) {
      const msg = out.msg ?? 'Cannot reopen';
      if (msg === 'Ticket not found') throw ApiError.notFound(msg);
      if (msg === 'Not your ticket') throw ApiError.forbidden(msg);
      throw ApiError.badRequest(msg);
    }
    return this.getDetails(ticketId, companyId);
  }
  async addComment(ticketId, commentedBy, comment, companyId) {
    await this.assertTicketCompany(ticketId, companyId);
    await this.assertEmployeeCompany(commentedBy, companyId);
    await callProcedure('sp_add_helpdesk_comment(?, ?, ?)', [ticketId, commentedBy, comment]);
    const ticket = await this.getDetails(ticketId, companyId);
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
