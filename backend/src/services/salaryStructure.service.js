const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { encryptSalaryFields, applyVisibility } = require('../utils/encryption');

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

  /**
   * @param {object} opts
   * @param {object} [opts.reqUser]  req.user — used to apply salary visibility rules
   */
  async list({ employee_id, limit, offset, reqUser } = {}) {
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

    // Apply visibility: admins see full data, others see masked values
    const visible = rows.map((r) => applyVisibility(r, reqUser, r.employee_id));
    return { rows: visible, total: countRows[0]?.total || 0 };
  }

  async latestForEmployee(employeeId, reqUser = null) {
    const rows = await query(
      `${LIST_SELECT} WHERE s.employee_id = ? ORDER BY s.effective_from DESC LIMIT 1`,
      [employeeId]
    );
    const row = rows[0] || null;
    return applyVisibility(row, reqUser, employeeId);
  }

  async getDetails(id, reqUser = null, ownerId = null) {
    const rows = await query(`${LIST_SELECT} WHERE s.id = ?`, [id]);
    const row = rows[0] || null;
    return applyVisibility(row, reqUser, ownerId ?? row?.employee_id);
  }

  /** Override: encrypt salary data on INSERT, then NULL out plaintext columns */
  async create(data) {
    const salaryEncrypted = encryptSalaryFields(data);
    const row = await super.create(data);
    if (salaryEncrypted && row) {
      await require('../config/db').query(
        `UPDATE salary_structures SET
           salary_encrypted = ?,
           basic = NULL, hra = NULL, conveyance = NULL,
           medical_allowance = NULL, special_allowance = NULL,
           pf_employee = NULL, pf_employer = NULL,
           professional_tax = NULL, income_tax = NULL, ctc = NULL
         WHERE id = ?`,
        [salaryEncrypted, row.id]
      );
    }
    return row;
  }

  /** Override: encrypt salary data on UPDATE, then NULL out plaintext columns */
  async update(id, data) {
    const row = await super.update(id, data);
    // Re-fetch full record to get all fields for the encrypted blob
    const full = await require('../config/db').query(
      'SELECT * FROM salary_structures WHERE id = ?', [id]
    );
    if (full[0]) {
      // Merge incoming data (plaintext) with existing encrypted fields
      const { decryptSalaryRow } = require('../utils/encryption');
      const existing = decryptSalaryRow(full[0]);
      const merged = { ...existing, ...data };
      const salaryEncrypted = encryptSalaryFields(merged);
      if (salaryEncrypted) {
        await require('../config/db').query(
          `UPDATE salary_structures SET
             salary_encrypted = ?,
             basic = NULL, hra = NULL, conveyance = NULL,
             medical_allowance = NULL, special_allowance = NULL,
             pf_employee = NULL, pf_employer = NULL,
             professional_tax = NULL, income_tax = NULL, ctc = NULL
           WHERE id = ?`,
          [salaryEncrypted, id]
        );
      }
    }
    return row;
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
