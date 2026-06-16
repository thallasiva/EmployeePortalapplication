const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const LIST_SELECT = `
  SELECT s.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name
    FROM salary_structures s
    JOIN employees e ON e.employee_id = s.employee_id
`;

class SalaryStructureService extends BaseService {
  constructor() {
    super('salary_structures', 'id', [
      'employee_id', 'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
      'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'ctc', 'effective_from',
    ]);
  }

  async list({ employee_id, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('s.employee_id = ?');
      params.push(employee_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY s.effective_from DESC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM salary_structures s ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async latestForEmployee(employeeId) {
    const rows = await query(
      `${LIST_SELECT} WHERE s.employee_id = ? ORDER BY s.effective_from DESC LIMIT 1`,
      [employeeId]
    );
    return rows[0] || null;
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE s.id = ?`, [id]);
    return rows[0] || null;
  }

  /**
   * Bulk import salary structures from parsed CSV rows.
   * Each row is matched to an employee via `emp_code`, then a salary_structures
   * row is inserted (or updated if one already exists for the same employee +
   * effective_from date).
   *
   * @param {object[]} rows - parsed CSV rows, each with emp_code + the
   *   salary_structures fillable fields (basic, hra, conveyance, ...).
   * @returns {{ inserted: number, updated: number, skipped: {emp_code?: string, reason: string}[] }}
   */
  async bulkImport(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw ApiError.badRequest('No rows to import');
    }

    const result = { inserted: 0, updated: 0, skipped: [] };

    for (const row of rows) {
      const empCode = String(row.emp_code || row.employee_code || '').trim();
      if (!empCode) {
        result.skipped.push({ reason: 'Missing emp_code' });
        continue;
      }

      const employees = await query('SELECT employee_id FROM employees WHERE emp_code = ?', [empCode]);
      const employee = employees[0];
      if (!employee) {
        result.skipped.push({ emp_code: empCode, reason: 'Employee not found' });
        continue;
      }

      if (!row.effective_from) {
        result.skipped.push({ emp_code: empCode, reason: 'Missing effective_from' });
        continue;
      }

      const payload = this._pick({ ...row, employee_id: employee.employee_id });

      const existing = await this.findOne('employee_id = ? AND effective_from = ?', [
        employee.employee_id,
        payload.effective_from,
      ]);

      if (existing) {
        await this.update(existing.id, payload);
        result.updated += 1;
      } else {
        await this.create(payload);
        result.inserted += 1;
      }
    }

    return result;
  }
}

module.exports = new SalaryStructureService();
