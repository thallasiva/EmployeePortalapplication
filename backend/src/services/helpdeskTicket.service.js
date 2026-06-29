const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT t.*,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         e.emp_code,
         CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) AS assigned_to_name
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
    LEFT JOIN employees a ON a.employee_id = t.assigned_to
`;

const COMMENT_SELECT = `
  SELECT c.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS commented_by_name
    FROM helpdesk_comments c
    JOIN employees e ON e.employee_id = c.commented_by
   WHERE c.ticket_id = ?
   ORDER BY c.created_at ASC
`;

/* Statuses that set resolved_at */
const CLOSING_STATUSES = ['Resolved', 'Closed', 'Rejected'];

class HelpdeskTicketService extends BaseService {
  constructor() {
    super('helpdesk_tickets', 'ticket_id', [
      'employee_id', 'category', 'subject', 'description', 'priority',
      'status', 'assigned_to', 'forwarded_to_team', 'attachment_url',
    ]);
  }

  /* ── List (admin / general) ────────────────────────────────────── */
  async list({ employee_id, status, priority, category, assigned_to, forwarded_to_team, search, limit, offset } = {}) {
    const where = []; const params = [];
    if (employee_id)       { where.push('t.employee_id = ?');       params.push(employee_id); }
    if (status)            { where.push('t.status = ?');             params.push(status); }
    if (priority)          { where.push('t.priority = ?');           params.push(priority); }
    if (category)          { where.push('t.category = ?');           params.push(category); }
    if (assigned_to)       { where.push('t.assigned_to = ?');        params.push(assigned_to); }
    if (forwarded_to_team) { where.push('t.forwarded_to_team = ?');  params.push(forwarded_to_team); }
    if (search)            { where.push('t.subject LIKE ?');         params.push(`%${search}%`); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY t.created_at DESC`;
    if (limit !== undefined) { sql += ' LIMIT ? OFFSET ?'; params.push(Number(limit), Number(offset || 0)); }

    const rows = await query(sql, params);
    const countSql = `SELECT COUNT(*) AS total FROM helpdesk_tickets t ${whereSql}`;
    const countParams = limit !== undefined ? params.slice(0, -2) : params;
    const countRows = await query(countSql, countParams);
    return { rows, total: countRows[0]?.total || 0 };
  }

  /* ── List manager's team tickets ───────────────────────────────── */
  async listTeam(managerId, { status, priority, category, search, limit, offset } = {}) {
    const where = ['e.reporting_to = ?']; const params = [managerId];
    if (status)   { where.push('t.status = ?');   params.push(status); }
    if (priority) { where.push('t.priority = ?'); params.push(priority); }
    if (category) { where.push('t.category = ?'); params.push(category); }
    if (search)   { where.push('t.subject LIKE ?'); params.push(`%${search}%`); }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY t.created_at DESC`;
    if (limit !== undefined) { sql += ' LIMIT ? OFFSET ?'; params.push(Number(limit), Number(offset || 0)); }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM helpdesk_tickets t
         JOIN employees e ON e.employee_id = t.employee_id ${whereSql}`,
      limit !== undefined ? params.slice(0, -2) : params
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  /* ── Single ticket with comments ───────────────────────────────── */
  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE t.ticket_id = ?`, [id]);
    if (!rows.length) return null;
    const comments = await query(COMMENT_SELECT, [id]);
    return { ...rows[0], comments };
  }

  /* ── Generic status update (admin / support) ───────────────────── */
  async updateStatus(id, status) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Ticket not found');
    const resolvedAt = CLOSING_STATUSES.includes(status) ? 'NOW()' : 'NULL';
    await query(
      `UPDATE helpdesk_tickets SET status = ?, resolved_at = ${resolvedAt} WHERE ticket_id = ?`,
      [status, id]
    );
    return this.getDetails(id);
  }

  /* ── Assign ────────────────────────────────────────────────────── */
  async assign(id, assignedTo) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Ticket not found');
    await query('UPDATE helpdesk_tickets SET assigned_to = ? WHERE ticket_id = ?', [assignedTo, id]);
    return this.getDetails(id);
  }

  /* ── Manager: approve → forward to team, or reject ─────────────── */
  async managerAction(managerId, ticketId, action, forwardedToTeam, comment) {
    /* Verify ticket belongs to a direct report */
    const owned = await query(
      `SELECT t.ticket_id, t.status FROM helpdesk_tickets t
         JOIN employees e ON e.employee_id = t.employee_id
        WHERE t.ticket_id = ? AND e.reporting_to = ?`,
      [ticketId, managerId]
    );
    if (!owned.length) throw ApiError.forbidden('This ticket does not belong to your team');
    if (owned[0].status !== 'Open') throw ApiError.badRequest('Only Open tickets can be actioned by manager');

    if (action === 'approve') {
      await query(
        `UPDATE helpdesk_tickets SET status = 'Forwarded', forwarded_to_team = ? WHERE ticket_id = ?`,
        [forwardedToTeam, ticketId]
      );
      const autoComment = (comment && comment.trim())
        ? `[Approved & Forwarded to ${forwardedToTeam}] ${comment.trim()}`
        : `Request approved and forwarded to ${forwardedToTeam}.`;
      await query(
        'INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (?, ?, ?)',
        [ticketId, managerId, autoComment]
      );
    } else {
      /* reject */
      await query(
        `UPDATE helpdesk_tickets SET status = 'Rejected', resolved_at = NOW() WHERE ticket_id = ?`,
        [ticketId]
      );
      await query(
        'INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (?, ?, ?)',
        [ticketId, managerId, `[Rejected] ${comment.trim()}`]
      );
    }

    return this.getDetails(ticketId);
  }

  /* ── Employee close (after Resolved) ──────────────────────────── */
  async closeTicket(employeeId, ticketId) {
    const rows = await query(
      'SELECT ticket_id, employee_id, status FROM helpdesk_tickets WHERE ticket_id = ?',
      [ticketId]
    );
    if (!rows.length) throw ApiError.notFound('Ticket not found');
    if (rows[0].employee_id !== employeeId) throw ApiError.forbidden('Not your ticket');
    if (rows[0].status !== 'Resolved') throw ApiError.badRequest('Ticket must be Resolved before closing');

    await query(
      `UPDATE helpdesk_tickets SET status = 'Closed', resolved_at = NOW() WHERE ticket_id = ?`,
      [ticketId]
    );
    return this.getDetails(ticketId);
  }

  /* ── Employee reopen (not satisfied with Resolved) ─────────────── */
  async reopenTicket(employeeId, ticketId, comment) {
    const rows = await query(
      'SELECT ticket_id, employee_id, status FROM helpdesk_tickets WHERE ticket_id = ?',
      [ticketId]
    );
    if (!rows.length) throw ApiError.notFound('Ticket not found');
    if (rows[0].employee_id !== employeeId) throw ApiError.forbidden('Not your ticket');
    if (rows[0].status !== 'Resolved') throw ApiError.badRequest('Only Resolved tickets can be reopened');

    await query(
      `UPDATE helpdesk_tickets SET status = 'Reopened', resolved_at = NULL WHERE ticket_id = ?`,
      [ticketId]
    );
    const reason = (comment && comment.trim()) ? comment.trim() : 'Employee is not satisfied with the resolution.';
    await query(
      'INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (?, ?, ?)',
      [ticketId, employeeId, `[Reopened] ${reason}`]
    );
    return this.getDetails(ticketId);
  }

  /* ── Add comment ───────────────────────────────────────────────── */
  async addComment(ticketId, commentedBy, comment) {
    await query(
      'INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (?, ?, ?)',
      [ticketId, commentedBy, comment]
    );
    return this.getDetails(ticketId);
  }
}

module.exports = new HelpdeskTicketService();
