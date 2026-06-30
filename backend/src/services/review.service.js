const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class ReviewService extends BaseService {
  constructor() {
    super('reviews', 'review_id', [
      'review_type_id', 'employee_id', 'reviewer_id', 'cycle_start', 'cycle_end',
      'due_date', 'status', 'overall_rating', 'comments', 'submitted_on',
    ]);
  }

  async list({ employee_id, reviewer_id, status, review_type_id, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_reviews(?, ?, ?, ?, ?, ?)',
      [
        employee_id    ?? null,
        reviewer_id    ?? null,
        status         ?? null,
        review_type_id ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
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
