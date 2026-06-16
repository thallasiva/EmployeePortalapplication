const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT ja.*, j.title AS job_title, j.department_id,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS applicant_employee_name
    FROM job_applications ja
    JOIN jobs j ON j.job_id = ja.job_id
    LEFT JOIN employees e ON e.employee_id = ja.applicant_employee_id
`;

class JobApplicationService extends BaseService {
  constructor() {
    super('job_applications', 'application_id', [
      'job_id', 'applicant_name', 'email', 'mobile', 'resume_url',
      'status', 'source', 'applicant_employee_id',
    ]);
  }

  async list({ job_id, status, search, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (job_id) {
      where.push('ja.job_id = ?');
      params.push(job_id);
    }
    if (status) {
      where.push('ja.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(ja.applicant_name LIKE ? OR ja.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY ja.applied_on DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM job_applications ja ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE ja.application_id = ?`, [id]);
    return rows[0] || null;
  }

  async updateStatus(id, status) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Application not found');
    await query('UPDATE job_applications SET status = ? WHERE application_id = ?', [status, id]);
    return this.getDetails(id);
  }
}

module.exports = new JobApplicationService();
