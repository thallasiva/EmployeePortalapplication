const BaseService = require('./base.service');
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT r.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM attendance_regularization r
    JOIN employees e ON e.employee_id = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id = r.reviewed_by
`;

class AttendanceRegularizationService extends BaseService {
  constructor() {
    super('attendance_regularization', 'regularization_id', [
      'employee_id', 'attendance_date', 'requested_check_in', 'requested_check_out', 'reason', 'status',
    ]);
  }

  async list({ employee_id, status, reporting_to, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (reporting_to) {
      where.push('e.reporting_to = ?');
      params.push(reporting_to);
    }
    if (employee_id) {
      where.push('r.employee_id = ?');
      params.push(employee_id);
    }
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY r.created_at DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM attendance_regularization r ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE r.regularization_id = ?`, [id]);
    return rows[0] || null;
  }

  async create(data) {
    const payload = this._pick({ ...data, status: 'Pending' });
    const columns = Object.keys(payload);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((c) => payload[c]);
    const result = await query(
      `INSERT INTO attendance_regularization (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return this.getDetails(result.insertId);
  }

  async review(id, { decision, reviewed_by, remarks }) {
    const request = await this.findById(id);
    if (!request) throw ApiError.notFound('Regularization request not found');
    if (request.status !== 'Pending') throw ApiError.conflict('Regularization request already reviewed');

    await withTransaction(async (conn) => {
      await conn.query(
        `UPDATE attendance_regularization
            SET status = ?, reviewed_by = ?, reviewed_on = NOW(), remarks = ?
          WHERE regularization_id = ?`,
        [decision, reviewed_by, remarks || null, id]
      );

      if (decision === 'Approved') {
        await conn.query(
          `INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, source)
           VALUES (?, ?, ?, ?, 'present', 'regularization')
           ON DUPLICATE KEY UPDATE
             check_in = IFNULL(?, check_in),
             check_out = IFNULL(?, check_out),
             status = 'present'`,
          [
            request.employee_id,
            request.attendance_date,
            request.requested_check_in,
            request.requested_check_out,
            request.requested_check_in,
            request.requested_check_out,
          ]
        );
      }
    });

    return this.getDetails(id);
  }
}

module.exports = new AttendanceRegularizationService();
