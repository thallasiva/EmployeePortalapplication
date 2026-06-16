const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT r.*, j.title AS job_title,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS referred_by_name
    FROM referrals r
    JOIN jobs j ON j.job_id = r.job_id
    JOIN employees e ON e.employee_id = r.referred_by
`;

class ReferralService extends BaseService {
  constructor() {
    super('referrals', 'referral_id', [
      'job_id', 'referred_by', 'candidate_name', 'candidate_email',
      'candidate_mobile', 'resume_url', 'status',
    ]);
  }

  async list({ referred_by, job_id, status, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (referred_by) {
      where.push('r.referred_by = ?');
      params.push(referred_by);
    }
    if (job_id) {
      where.push('r.job_id = ?');
      params.push(job_id);
    }
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY r.referred_on DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM referrals r ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE r.referral_id = ?`, [id]);
    return rows[0] || null;
  }

  async updateStatus(id, status) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Referral not found');
    await query('UPDATE referrals SET status = ? WHERE referral_id = ?', [status, id]);
    return this.getDetails(id);
  }
}

module.exports = new ReferralService();
