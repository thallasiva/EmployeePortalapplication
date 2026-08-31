const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class AttendanceRegularizationService extends BaseService {
  constructor() {
    super('attendance_regularization', 'regularization_id', [
      'employee_id', 'attendance_date', 'requested_check_in', 'requested_check_out', 'reason', 'status',
    ]);
  }

  async list({ employee_id, status, reporting_to, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_attendance_regularization(?, ?, ?, ?, ?)',
      [
        employee_id   ?? null,
        status        ?? null,
        reporting_to  ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_attendance_regularization(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }

  async create(data) {
    const row = await super.create({ ...data, status: 'Pending' });
    return this.getDetails(row.regularization_id);
  }

  async review(id, { decision, reviewed_by, remarks }) {
    const request = await this.findById(id);
    if (!request) throw ApiError.notFound('Regularization request not found');
    if (request.status !== 'Pending') throw ApiError.conflict('Regularization request already reviewed');

    // Pre-check: 5-day monthly limit before calling the procedure
    if (decision === 'Approved') {
      const { query } = require('../config/db');
      const [limitRow] = await query(
        `SELECT COUNT(*) AS cnt
           FROM attendance_regularization
          WHERE employee_id = ?
            AND MONTH(attendance_date) = MONTH(?)
            AND YEAR(attendance_date)  = YEAR(?)
            AND status = 'Approved'
            AND regularization_id <> ?`,
        [request.employee_id, request.attendance_date, request.attendance_date, id]
      );
      if ((limitRow?.cnt || 0) >= 5) {
        throw ApiError.conflict('Regularization limit reached: maximum 5 approvals allowed per month');
      }
    }

    try {
      await callProcedure(
        'sp_review_attendance_regularization(?, ?, ?, ?)',
        [id, decision, reviewed_by, remarks || null]
      );
    } catch (err) {
      // Translate MySQL SIGNAL message to a clean API error
      if (err.message && err.message.includes('limit reached')) {
        throw ApiError.conflict(err.message);
      }
      throw err;
    }
    return this.getDetails(id);
  }
}

module.exports = new AttendanceRegularizationService();
