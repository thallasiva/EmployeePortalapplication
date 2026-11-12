'use strict';
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const payrollPolicyService = require('./payrollPolicy.service');

class PayrollPeriodService {
  _period(companyId, month, year) {
    const company = Number(companyId), m = Number(month), y = Number(year);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) throw ApiError.badRequest('Valid payroll month and year are required');
    return { company, month: m, year: y };
  }
  async get({ companyId, month, year }) {
    const period = this._period(companyId, month, year);
    const [row] = await query('SELECT * FROM payroll_period_controls WHERE company_id=? AND month=? AND year=? LIMIT 1', [period.company, period.month, period.year]);
    if (!row) return { company_id: period.company, month: period.month, year: period.year, status: 'OPEN' };
    const { snapshot_json, ...safeRow } = row;
    return safeRow;
  }
  async lockInputs({ companyId, month, year, userId, reason, snapshot }) {
    const period = this._period(companyId, month, year);
    const { policy } = await payrollPolicyService.get({ companyId: period.company, asOf: `${period.year}-${String(period.month).padStart(2, '0')}-01` });
    const lastDay = new Date(period.year, period.month, 0).getDate();
    const cutoffDate = `${period.year}-${String(period.month).padStart(2, '0')}-${String(Math.min(lastDay, Number(policy.cutoff_day) || lastDay)).padStart(2, '0')}`;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    if (today < cutoffDate) throw ApiError.conflict(`Payroll inputs can be locked on or after the company cutoff date (${cutoffDate})`);
    return withTransaction(async (conn) => {
      await conn.query('SELECT company_id FROM companies WHERE company_id=? FOR UPDATE', [period.company]);
      const [[existing]] = await conn.query('SELECT status FROM payroll_period_controls WHERE company_id=? AND month=? AND year=? FOR UPDATE', [period.company, period.month, period.year]);
      if (existing?.status === 'INPUTS_LOCKED') throw ApiError.conflict('Payroll inputs are already locked for this period');
      if (!snapshot || !Array.isArray(snapshot.employees)) throw ApiError.badRequest('A payroll preview snapshot is required before locking inputs');
      const [runs] = await conn.query('SELECT review_status,is_locked FROM payroll_runs WHERE company_id=? AND month=? AND year=? FOR UPDATE', [period.company, period.month, period.year]);
      if (runs.some((run) => run.review_status === 'APPROVED' || run.is_locked)) throw ApiError.conflict('This payroll period is already finalized; use the controlled reopen workflow.');
      await conn.query(`INSERT INTO payroll_period_controls(company_id,month,year,status,locked_by,locked_at,reason,snapshot_json)
        VALUES (?,?,?,'INPUTS_LOCKED',?,NOW(),?,?) ON DUPLICATE KEY UPDATE status='INPUTS_LOCKED',locked_by=VALUES(locked_by),locked_at=NOW(),reason=VALUES(reason),snapshot_json=VALUES(snapshot_json)`,
      [period.company, period.month, period.year, userId || null, reason || null, JSON.stringify(snapshot)]);
      const [[row]] = await conn.query('SELECT * FROM payroll_period_controls WHERE company_id=? AND month=? AND year=?', [period.company, period.month, period.year]);
      return row;
    });
  }
  async close({ companyId, month, year, userId, reason }) {
    const period = this._period(companyId, month, year);
    return withTransaction(async (conn) => {
      const [[run]] = await conn.query('SELECT review_status,is_locked FROM payroll_runs WHERE company_id=? AND month=? AND year=? FOR UPDATE', [period.company, period.month, period.year]);
      if (!run || run.review_status !== 'APPROVED' || !run.is_locked) throw ApiError.conflict('Approve and lock payroll before closing this period');
      const result = await conn.query(`UPDATE payroll_period_controls SET status='CLOSED',closed_by=?,closed_at=NOW(),reason=?
        WHERE company_id=? AND month=? AND year=? AND status='INPUTS_LOCKED'`, [userId || null, reason || null, period.company, period.month, period.year]);
      if (!result[0].affectedRows) throw ApiError.conflict('Lock payroll inputs before closing the period');
      const [[row]] = await conn.query('SELECT * FROM payroll_period_controls WHERE company_id=? AND month=? AND year=?', [period.company, period.month, period.year]);
      return row;
    });
  }
  async reopen({ companyId, month, year, userId, reason }) {
    const period = this._period(companyId, month, year);
    if (!reason || reason.trim().length < 5) throw ApiError.badRequest('A reason of at least 5 characters is required to reopen a period');
    return withTransaction(async (conn) => {
      const [[control]] = await conn.query('SELECT status FROM payroll_period_controls WHERE company_id=? AND month=? AND year=? FOR UPDATE', [period.company, period.month, period.year]);
      if (!control || control.status !== 'CLOSED') throw ApiError.conflict('Only a closed payroll period can be reopened');
      const [[run]] = await conn.query('SELECT review_status,is_locked FROM payroll_runs WHERE company_id=? AND month=? AND year=? FOR UPDATE', [period.company, period.month, period.year]);
      if (run?.review_status === 'APPROVED' || run?.is_locked) throw ApiError.conflict('This run is finalized. Use payroll reversal/correction before reopening its period.');
      await conn.query(`UPDATE payroll_period_controls SET status='OPEN',reopened_by=?,reopened_at=NOW(),reason=?
        WHERE company_id=? AND month=? AND year=?`, [userId || null, reason.trim(), period.company, period.month, period.year]);
      const [[row]] = await conn.query('SELECT * FROM payroll_period_controls WHERE company_id=? AND month=? AND year=?', [period.company, period.month, period.year]);
      return row;
    });
  }
  async assertInputsOpen(companyId, month, year) {
    const status = await this.get({ companyId, month, year });
    if (status.status !== 'OPEN') throw ApiError.conflict(`Payroll inputs are ${String(status.status).toLowerCase().replace('_', ' ')} for this period`);
    return status;
  }
}

module.exports = new PayrollPeriodService();
