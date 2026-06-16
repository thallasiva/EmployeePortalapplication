const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT rh.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name, e.emp_code,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM request_hub rh
    JOIN employees e ON e.employee_id = rh.employee_id
    LEFT JOIN employees rv ON rv.employee_id = rh.reviewed_by
`;

class RequestHubService extends BaseService {
  constructor() {
    super('request_hub', 'request_id', [
      'employee_id', 'request_type', 'title', 'description', 'status', 'reviewed_by',
    ]);
  }

  async list({ employee_id, status, request_type, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('rh.employee_id = ?');
      params.push(employee_id);
    }
    if (status) {
      where.push('rh.status = ?');
      params.push(status);
    }
    if (request_type) {
      where.push('rh.request_type = ?');
      params.push(request_type);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY rh.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM request_hub rh ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE rh.request_id = ?`, [id]);
    return rows[0] || null;
  }

  async updateStatus(id, status, reviewedBy) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Request not found');

    const resolvedAt = status === 'Pending' ? 'NULL' : 'NOW()';
    await query(
      `UPDATE request_hub SET status = ?, reviewed_by = ?, resolved_at = ${resolvedAt} WHERE request_id = ?`,
      [status, reviewedBy || null, id]
    );
    return this.getDetails(id);
  }
}

module.exports = new RequestHubService();
