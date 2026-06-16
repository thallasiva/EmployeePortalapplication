const BaseService = require('./base.service');
const { query, callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT lr.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         d.department_name,
         lt.leave_type_name,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e ON e.employee_id = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rv ON rv.employee_id = lr.reviewed_by
`;

class LeaveRequestService extends BaseService {
  constructor() {
    super('leave_requests', 'leave_request_id', [
      'employee_id', 'leave_type_id', 'from_date', 'from_session', 'to_date', 'to_session',
      'days', 'reason', 'status', 'reviewed_by', 'remarks', 'is_cancel_request',
    ]);
  }

  async list({ employee_id, status, leave_type_id, department_id, reporting_to, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('lr.employee_id = ?');
      params.push(employee_id);
    }
    if (status) {
      where.push('lr.status = ?');
      params.push(status);
    }
    if (leave_type_id) {
      where.push('lr.leave_type_id = ?');
      params.push(leave_type_id);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    if (reporting_to) {
      where.push('e.reporting_to = ?');
      params.push(reporting_to);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY lr.applied_on DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM leave_requests lr JOIN employees e ON e.employee_id = lr.employee_id ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE lr.leave_request_id = ?`, [id]);
    return rows[0] || null;
  }

  /**
   * Applies for leave via sp_apply_leave, which validates the leave balance
   * before inserting a Pending request.
   */
  async apply(data) {
    const results = await callProcedure('sp_apply_leave(?, ?, ?, ?, ?, ?, ?, ?, @request_id, @status_msg)', [
      data.employee_id,
      data.leave_type_id,
      data.from_date,
      data.from_session || null,
      data.to_date,
      data.to_session || null,
      data.days,
      data.reason || null,
    ]);

    const out = await query('SELECT @request_id AS request_id, @status_msg AS status_msg');
    const { request_id, status_msg } = out[0];

    if (!request_id) {
      throw ApiError.badRequest(status_msg || 'Unable to submit leave request');
    }

    return this.getDetails(request_id);
  }

  /**
   * Approves or rejects a leave request via sp_review_leave_request, which
   * adjusts the leave balance and marks attendance when approved.
   */
  async review(id, { decision, reviewed_by, remarks }) {
    try {
      await callProcedure('sp_review_leave_request(?, ?, ?, ?)', [id, decision, reviewed_by, remarks || null]);
    } catch (err) {
      if (err && err.sqlState === '45000') {
        throw ApiError.conflict(err.sqlMessage || 'Unable to review leave request');
      }
      throw err;
    }
    return this.getDetails(id);
  }

  async cancel(id, employeeId) {
    const request = await this.findById(id);
    if (!request) throw ApiError.notFound('Leave request not found');
    if (request.employee_id !== employeeId) throw ApiError.forbidden('You can only cancel your own leave requests');
    if (request.status !== 'Pending') throw ApiError.conflict('Only pending leave requests can be cancelled');

    await query('UPDATE leave_requests SET status = ? WHERE leave_request_id = ?', ['Cancelled', id]);
    return this.getDetails(id);
  }

  async balances(employeeId, year) {
    const targetYear = year || new Date().getFullYear();
    return query(
      `SELECT lt.leave_type_id, lt.leave_type_name, lt.annual_quota, lt.carry_forward_limit,
              IFNULL(lb.opening_balance, 0) AS opening_balance,
              IFNULL(lb.granted, lt.annual_quota) AS granted,
              IFNULL(lb.availed, 0) AS availed,
              IFNULL(lb.balance, lt.annual_quota) AS balance
         FROM leave_types lt
         LEFT JOIN leave_balances lb
           ON lb.leave_type_id = lt.leave_type_id AND lb.employee_id = ? AND lb.year = ?
        ORDER BY lt.leave_type_name`,
      [employeeId, targetYear]
    );
  }
}

module.exports = new LeaveRequestService();
