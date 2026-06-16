const BaseService = require('./base.service');
const { query, callProcedure } = require('../config/db');

const LIST_SELECT = `
  SELECT pr.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS processed_by_name
    FROM payroll_runs pr
    LEFT JOIN employees e ON e.employee_id = pr.processed_by
`;

class PayrollRunService extends BaseService {
  constructor() {
    super('payroll_runs', 'payroll_run_id', ['month', 'year', 'status', 'processed_by', 'processed_on', 'total_amount']);
  }

  async list({ year, status, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (year) {
      where.push('pr.year = ?');
      params.push(year);
    }
    if (status) {
      where.push('pr.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY pr.year DESC, pr.month DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM payroll_runs pr ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE pr.payroll_run_id = ?`, [id]);
    if (!rows.length) return null;

    const payslips = await query(
      `SELECT p.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name
         FROM payslips p
         JOIN employees e ON e.employee_id = p.employee_id
        WHERE p.payroll_run_id = ?
        ORDER BY e.first_name`,
      [id]
    );

    return { ...rows[0], payslips };
  }

  /**
   * Runs payroll for all active employees for the given month/year via
   * sp_run_payroll (which loops sp_generate_payslip per employee).
   */
  async run({ month, year, processed_by }) {
    await callProcedure('sp_run_payroll(?, ?, ?, @payroll_run_id)', [month, year, processed_by || null]);
    const out = await query('SELECT @payroll_run_id AS payroll_run_id');
    const payrollRunId = out[0].payroll_run_id;
    return this.getDetails(payrollRunId);
  }
}

module.exports = new PayrollRunService();
