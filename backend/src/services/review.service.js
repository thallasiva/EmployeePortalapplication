const BaseService = require('./base.service');
const { callProcedure, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
class ReviewService extends BaseService {
  constructor() {
    super('reviews', 'review_id', [
      'review_type_id', 'employee_id', 'reviewer_id', 'cycle_start', 'cycle_end',
      'due_date', 'status', 'overall_rating', 'comments', 'submitted_on',
    ]);
  }
  async list({ employee_id, reviewer_id, status, review_type_id, limit, offset, companyId } = {}) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) {
      throw ApiError.forbidden('Company context is required');
    }

    const conditions = ['e.company_id = ?'];
    const params = [company];
    if (employee_id != null) {
      conditions.push('r.employee_id = ?');
      params.push(employee_id);
    }
    if (reviewer_id != null) {
      conditions.push('r.reviewer_id = ?');
      params.push(reviewer_id);
    }
    if (status != null) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (review_type_id != null) {
      conditions.push('r.review_type_id = ?');
      params.push(review_type_id);
    }

    const where = conditions.join(' AND ');
    const pageSize = limit != null ? Math.max(1, Number(limit)) : 10;
    const pageOffset = Math.max(0, Number(offset) || 0);
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT r.*, rt.name AS review_type_name, rt.frequency,
                CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                e.emp_code,
                CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
           FROM reviews r
           JOIN review_types rt ON rt.review_type_id = r.review_type_id
           JOIN employees e ON e.employee_id = r.employee_id
           LEFT JOIN employees rv ON rv.employee_id = r.reviewer_id
          WHERE ${where}
          ORDER BY r.due_date DESC
          LIMIT ? OFFSET ?`,
        [...params, pageSize, pageOffset]
      ),
      query(
        `SELECT COUNT(*) AS total
           FROM reviews r
           JOIN employees e ON e.employee_id = r.employee_id
          WHERE ${where}`,
        params
      )
    ]);
    return { rows, total: countRows[0]?.total ?? 0 };
  }
  async getDetails(id) {
    const results = await callProcedure('sp_get_review(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }
  async submit(id, { overall_rating, comments }) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Review not found');
    await callProcedure('sp_submit_review(?, ?, ?)', [id, overall_rating, comments || null]);
    return this.getDetails(id);
  }
  async complete(id) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Review not found');
    await callProcedure('sp_complete_review(?)', [id]);
    return this.getDetails(id);
  }
}
module.exports = new ReviewService();
