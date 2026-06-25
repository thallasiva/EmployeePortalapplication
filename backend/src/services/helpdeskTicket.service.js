const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT t.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name, e.emp_code,
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

class HelpdeskTicketService extends BaseService {
  constructor() {
    super('helpdesk_tickets', 'ticket_id', [
      'employee_id', 'category', 'subject', 'description', 'priority',
      'status', 'assigned_to', 'attachment_url',
    ]);
  }

  async list({ employee_id, status, priority, category, assigned_to, search, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('t.employee_id = ?');
      params.push(employee_id);
    }
    if (status) {
      where.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      where.push('t.priority = ?');
      params.push(priority);
    }
    if (category) {
      where.push('t.category = ?');
      params.push(category);
    }
    if (assigned_to) {
      where.push('t.assigned_to = ?');
      params.push(assigned_to);
    }
    if (search) {
      where.push('t.subject LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY t.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM helpdesk_tickets t ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE t.ticket_id = ?`, [id]);
    if (!rows.length) return null;
    const comments = await query(COMMENT_SELECT, [id]);
    return { ...rows[0], comments };
  }

  async updateStatus(id, status) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Ticket not found');

    const resolvedAt = status === 'Resolved' || status === 'Closed' ? 'NOW()' : 'NULL';
    await query(`UPDATE helpdesk_tickets SET status = ?, resolved_at = ${resolvedAt} WHERE ticket_id = ?`, [status, id]);
    return this.getDetails(id);
  }

  async assign(id, assignedTo) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Ticket not found');
    await query('UPDATE helpdesk_tickets SET assigned_to = ? WHERE ticket_id = ?', [assignedTo, id]);
    return this.getDetails(id);
  }

  /** Tickets raised by employees whose reporting_to = managerId */
  async listTeam(managerId, { status, priority, category, search, limit, offset } = {}) {
    const where = ['e.reporting_to = ?'];
    const params = [managerId];

    if (status)   { where.push('t.status = ?');   params.push(status); }
    if (priority) { where.push('t.priority = ?'); params.push(priority); }
    if (category) { where.push('t.category = ?'); params.push(category); }
    if (search)   { where.push('t.subject LIKE ?'); params.push(`%${search}%`); }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY t.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }
    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM helpdesk_tickets t JOIN employees e ON e.employee_id = t.employee_id ${whereSql}`,
      limit !== undefined ? params.slice(0, params.length - 2) : params
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async addComment(ticketId, commentedBy, comment) {
    const exists = await this.existsById(ticketId);
    if (!exists) throw ApiError.notFound('Ticket not found');

    await query(
      'INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (?, ?, ?)',
      [ticketId, commentedBy, comment]
    );
    return this.getDetails(ticketId);
  }
}

module.exports = new HelpdeskTicketService();
