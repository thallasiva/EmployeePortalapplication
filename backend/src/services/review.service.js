const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT r.*, rt.name AS review_type_name, rt.frequency,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name, e.emp_code,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM reviews r
    JOIN review_types rt ON rt.review_type_id = r.review_type_id
    JOIN employees e ON e.employee_id = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id = r.reviewer_id
`;

class ReviewService extends BaseService {
  constructor() {
    super('reviews', 'review_id', [
      'review_type_id', 'employee_id', 'reviewer_id', 'cycle_start', 'cycle_end',
      'due_date', 'status', 'overall_rating', 'comments', 'submitted_on',
    ]);
  }

  async list({ employee_id, reviewer_id, status, review_type_id, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('r.employee_id = ?');
      params.push(employee_id);
    }
    if (reviewer_id) {
      where.push('r.reviewer_id = ?');
      params.push(reviewer_id);
    }
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }
    if (review_type_id) {
      where.push('r.review_type_id = ?');
      params.push(review_type_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY r.due_date DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM reviews r ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE r.review_id = ?`, [id]);
    return rows[0] || null;
  }

  async submit(id, { overall_rating, comments }) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Review not found');

    await query(
      `UPDATE reviews
          SET overall_rating = ?, comments = ?, status = 'Submitted', submitted_on = NOW()
        WHERE review_id = ?`,
      [overall_rating, comments || null, id]
    );
    return this.getDetails(id);
  }

  async complete(id) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Review not found');
    await query("UPDATE reviews SET status = 'Completed' WHERE review_id = ?", [id]);
    return this.getDetails(id);
  }
}

module.exports = new ReviewService();
