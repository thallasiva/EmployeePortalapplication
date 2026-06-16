const BaseService = require('./base.service');
const { query } = require('../config/db');

const LIST_SELECT = `
  SELECT j.*, d.department_name,
         CONCAT(c.first_name, ' ', IFNULL(c.last_name, '')) AS created_by_name,
         (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.job_id) AS application_count
    FROM jobs j
    LEFT JOIN departments d ON d.department_id = j.department_id
    LEFT JOIN employees c ON c.employee_id = j.created_by
`;

class JobService extends BaseService {
  constructor() {
    super('jobs', 'job_id', [
      'title', 'department_id', 'location', 'employment_type', 'description',
      'status', 'posted_on', 'closing_date', 'created_by',
    ]);
  }

  async list({ status, department_id, search, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (status) {
      where.push('j.status = ?');
      params.push(status);
    }
    if (department_id) {
      where.push('j.department_id = ?');
      params.push(department_id);
    }
    if (search) {
      where.push('j.title LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY j.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM jobs j ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE j.job_id = ?`, [id]);
    return rows[0] || null;
  }
}

module.exports = new JobService();
