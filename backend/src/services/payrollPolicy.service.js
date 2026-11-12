'use strict';
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

const defaults = () => ({
  currency_code: 'INR', payroll_frequency: 'MONTHLY', cutoff_day: 25, salary_payment_day: 1,
  working_days_method: 'WORKING_DAYS', fixed_working_days: null,
  lop_calculation_method: 'WORKING_DAYS', rounding_method: 'HALF_UP',
  financial_year_start_month: 4, statutory_rules: {}, approval_employee_ids: [], effective_from: null, is_default: true,
});

class PayrollPolicyService {
  async get({ companyId, asOf = new Date().toISOString().slice(0, 10) }) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const [rows, history] = await Promise.all([
      query(`SELECT * FROM payroll_policy_versions
              WHERE company_id=? AND effective_from<=? AND (effective_to IS NULL OR effective_to>=?)
              ORDER BY effective_from DESC LIMIT 1`, [company, asOf, asOf]),
      query(`SELECT payroll_policy_version_id, effective_from, effective_to, currency_code,
                    payroll_frequency, cutoff_day, salary_payment_day, working_days_method,
                    fixed_working_days, lop_calculation_method, rounding_method,
                    financial_year_start_month, created_at
               FROM payroll_policy_versions WHERE company_id=?
              ORDER BY effective_from DESC LIMIT 24`, [company]),
    ]);
    const policy = rows[0] ? this._format(rows[0]) : defaults();
    return { policy, history };
  }

  _format(row) {
    let statutoryRules = row.statutory_rules_json || {};
    if (typeof statutoryRules === 'string') {
      try { statutoryRules = JSON.parse(statutoryRules); }
      catch { throw ApiError.internal('Stored payroll statutory rules are not valid JSON'); }
    }
    return {
      ...row,
      cutoff_day: Number(row.cutoff_day),
      salary_payment_day: Number(row.salary_payment_day),
      fixed_working_days: row.fixed_working_days == null ? null : Number(row.fixed_working_days),
      financial_year_start_month: Number(row.financial_year_start_month),
      statutory_rules: statutoryRules,
      approval_employee_ids: this._parseApprovers(row.approval_employee_ids_json),
      is_default: false,
    };
  }

  _parseApprovers(value) {
    if (!value) return [];
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed.map(Number).filter((id) => Number.isInteger(id) && id > 0) : [];
    } catch { throw ApiError.internal('Stored payroll approvers are not valid JSON'); }
  }

  async save({ companyId, userId, payload }) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const approverIds = [...new Set((payload.approval_employee_ids || []).map(Number))];
    if (approverIds.some((id) => !Number.isInteger(id) || id <= 0)) throw ApiError.badRequest('Approver employee IDs must be positive integers');
    if (approverIds.length) {
      const placeholders = approverIds.map(() => '?').join(',');
      const eligible = await query(`SELECT employee_id FROM employees WHERE company_id=? AND employee_id IN (${placeholders})`, [company, ...approverIds]);
      if (eligible.length !== approverIds.length) throw ApiError.badRequest('Every payroll approver must be an employee in this company');
    }
    await withTransaction(async (conn) => {
      const [future] = await conn.query(
        `SELECT payroll_policy_version_id FROM payroll_policy_versions
          WHERE company_id=? AND effective_from>? LIMIT 1 FOR UPDATE`,
        [company, payload.effective_from]
      );
      if (future.length) throw ApiError.conflict('This effective date overlaps a later saved payroll policy');

      const [[sameDate]] = await conn.query(
        'SELECT payroll_policy_version_id FROM payroll_policy_versions WHERE company_id=? AND effective_from=? FOR UPDATE',
        [company, payload.effective_from]
      );
      const params = [
        payload.currency_code.toUpperCase(), payload.payroll_frequency, payload.cutoff_day,
        payload.salary_payment_day, payload.working_days_method, payload.fixed_working_days,
        payload.lop_calculation_method, payload.rounding_method, payload.financial_year_start_month,
        JSON.stringify(payload.statutory_rules || {}), JSON.stringify(approverIds), userId || null,
      ];
      if (sameDate) {
        await conn.query(
          `UPDATE payroll_policy_versions SET currency_code=?, payroll_frequency=?, cutoff_day=?, salary_payment_day=?,
             working_days_method=?, fixed_working_days=?, lop_calculation_method=?, rounding_method=?,
             financial_year_start_month=?, statutory_rules_json=?, approval_employee_ids_json=?, created_by=?
           WHERE payroll_policy_version_id=? AND company_id=?`,
          [...params, sameDate.payroll_policy_version_id, company]
        );
      } else {
        await conn.query(
          `UPDATE payroll_policy_versions SET effective_to=DATE_SUB(?, INTERVAL 1 DAY)
            WHERE company_id=? AND effective_from<? AND (effective_to IS NULL OR effective_to>=?)`,
          [payload.effective_from, company, payload.effective_from, payload.effective_from]
        );
        await conn.query(
          `INSERT INTO payroll_policy_versions
             (company_id,effective_from,currency_code,payroll_frequency,cutoff_day,salary_payment_day,
              working_days_method,fixed_working_days,lop_calculation_method,rounding_method,
              financial_year_start_month,statutory_rules_json,approval_employee_ids_json,created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [company, payload.effective_from, ...params]
        );
      }
    });
    return this.get({ companyId, asOf: payload.effective_from });
  }
}

module.exports = new PayrollPolicyService();
