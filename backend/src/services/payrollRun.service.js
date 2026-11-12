'use strict';
const BaseService = require('./base.service');
const { callProcedure, callProcedureWithOuts, query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const payrollPolicyService = require('./payrollPolicy.service');
const payrollPeriodService = require('./payrollPeriod.service');
class PayrollRunService extends BaseService {
  constructor() {
    super('payroll_runs', 'payroll_run_id', ['month', 'year', 'status', 'processed_by', 'processed_on', 'total_amount']);
  }
  async list({ year, status, limit, offset, companyId = null } = {}) {
    const where = `WHERE (? IS NULL OR company_id = ?) AND (? IS NULL OR year = ?) AND (? IS NULL OR status = ?)`;
    const params = [companyId, companyId, year ?? null, year ?? null, status ?? null, status ?? null];
    const totalRows = await query(`SELECT COUNT(*) AS total FROM payroll_runs ${where}`, params);
    let sql = `SELECT * FROM payroll_runs ${where} ORDER BY year DESC, month DESC, payroll_run_id DESC`;
    const rowParams = [...params];
    if (limit != null) {
      sql += ' LIMIT ? OFFSET ?';
      rowParams.push(Number(limit), Number(offset || 0));
    }
    return { rows: await query(sql, rowParams), total: Number(totalRows[0]?.total || 0) };
  }
  async getDetails(id, companyId = null) {
    await this.assertCompany(id, companyId);
    const results = await callProcedure('sp_get_payroll_run(?)', [id]);
    if (!(results[0] ?? []).length) return null;
    return { ...results[0][0], payslips: results[1] ?? [] };
  }
  async assertCompany(id, companyId) {
    if (!companyId) return;
    const rows = await query('SELECT company_id FROM payroll_runs WHERE payroll_run_id = ? LIMIT 1', [id]);
    if (!rows.length || Number(rows[0].company_id) !== Number(companyId)) {
      throw ApiError.notFound('Payroll run not found');
    }
  }
  async run({ month, year, processed_by, company_id = null }) {
    const { outs: out } = await callProcedureWithOuts('sp_run_payroll(?, ?, ?, @payroll_run_id)', [month, year, processed_by || null]);
    const payrollRunId = out.payroll_run_id;
    return this.getDetails(payrollRunId, company_id);
  }
  async submitForReview(id, employeeId, companyId = null) {
    await this.assertCompany(id, companyId);
    await this.assertNotLocked(id);
    const [runs] = await query('SELECT month,year FROM payroll_runs WHERE payroll_run_id=? AND company_id=? LIMIT 1', [id, companyId]);
    if (!runs.length) throw ApiError.notFound('Payroll run not found');
    const period = `${runs[0].year}-${String(runs[0].month).padStart(2, '0')}-01`;
    const { policy } = await payrollPolicyService.get({ companyId, asOf: period });
    const approvers = JSON.stringify(policy.approval_employee_ids || []);
    const result = await query(`UPDATE payroll_runs SET review_status='PENDING_REVIEW', current_approval_step=1,
        approval_employee_ids_json=? WHERE payroll_run_id=? AND company_id=? AND review_status IN ('DRAFT','REJECTED')`, [approvers, id, companyId]);
    if (!result.affectedRows) throw ApiError.conflict('Payroll run is not ready for review');
    return this.getDetails(id, companyId);
  }
  async review(id, employeeId, { approved, remarks }, companyId = null) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    await withTransaction(async (conn) => {
      const [runs] = await conn.query('SELECT * FROM payroll_runs WHERE payroll_run_id=? AND company_id=? FOR UPDATE', [id, company]);
      const run = runs[0];
      if (!run) throw ApiError.notFound('Payroll run not found');
      if (run.review_status !== 'PENDING_REVIEW') throw ApiError.conflict('Payroll run is not awaiting review');
      if (Number(run.processed_by) === Number(employeeId)) throw ApiError.forbidden('The payroll processor cannot approve or reject their own run');
      const period = `${run.year}-${String(run.month).padStart(2, '0')}-01`;
      const { policy } = await payrollPolicyService.get({ companyId: company, asOf: period });
      let approvers = policy.approval_employee_ids || [];
      if (run.approval_employee_ids_json) {
        try { approvers = JSON.parse(run.approval_employee_ids_json); }
        catch { throw ApiError.internal('Stored payroll approval sequence is not valid JSON'); }
      }
      const step = Number(run.current_approval_step || 1);
      if (approvers.length && Number(approvers[step - 1]) !== Number(employeeId)) {
        throw ApiError.forbidden('This payroll run is assigned to a different approver');
      }
      const [reviewer] = await conn.query('SELECT 1 FROM employees WHERE employee_id=? AND company_id=? LIMIT 1', [employeeId, company]);
      if (!reviewer) throw ApiError.forbidden('Approver must belong to the payroll company');
      const decision = approved ? 'APPROVED' : 'REJECTED';
      await conn.query(`INSERT INTO payroll_run_approvals
        (payroll_run_id,company_id,approval_step,approver_employee_id,decision,remarks)
        VALUES (?,?,?,?,?,?)`, [id, company, step, employeeId, decision, remarks || null]);
      if (!approved) {
        await conn.query(`UPDATE payroll_runs SET review_status='REJECTED', reviewed_by=?, reviewed_at=NOW(), approval_remarks=?
          WHERE payroll_run_id=?`, [employeeId, remarks || null, id]);
      } else if (approvers.length && step < approvers.length) {
        await conn.query(`UPDATE payroll_runs SET current_approval_step=current_approval_step+1, approval_remarks=?
          WHERE payroll_run_id=?`, [remarks || null, id]);
      } else {
        await conn.query(`UPDATE payroll_runs SET review_status='APPROVED', reviewed_by=?, reviewed_at=NOW(), approval_remarks=?,
          is_locked=1, locked_by=?, locked_at=NOW() WHERE payroll_run_id=?`, [employeeId, remarks || null, employeeId, id]);
      }
    });
    return this.getDetails(id, company);
  }
  /** Assert the run is not locked — throws ApiError 403 if it is */
  async assertNotLocked(id) {
    const rows = await query('SELECT is_locked FROM payroll_runs WHERE payroll_run_id=?', [id]);
    if (rows[0]?.is_locked) {
      throw ApiError.forbidden('This payroll run is locked and cannot be modified. Ask an admin to unlock it.');
    }
  }
  /** Manually lock a payroll run (admin/HR) */
  async lockRun(id, userId, note, companyId = null) {
    await this.assertCompany(id, companyId);
    const rows = await query('SELECT is_locked FROM payroll_runs WHERE payroll_run_id=?', [id]);
    if (!rows[0]) throw ApiError.notFound('Payroll run not found');
    if (rows[0].is_locked) throw ApiError.badRequest('Payroll run is already locked');
    await query('UPDATE payroll_runs SET is_locked=1, locked_by=?, locked_at=NOW(), lock_note=? WHERE payroll_run_id=?',
      [userId, note || null, id]);
    return this.getDetails(id, companyId);
  }
  /** Unlock a payroll run (admin only) */
  async unlockRun(id, userId, companyId = null) {
    await this.assertCompany(id, companyId);
    await query('UPDATE payroll_runs SET is_locked=0, locked_by=NULL, locked_at=NULL, lock_note=NULL WHERE payroll_run_id=?', [id]);
    return this.getDetails(id, companyId);
  }
  async approvedInputs(employeeId, month, year) {
    const rows = await query(`SELECT input_type, COALESCE(SUM(amount),0) amount
      FROM payroll_inputs WHERE employee_id=? AND month=? AND year=? AND status='APPROVED' GROUP BY input_type`,
      [employeeId, month, year]);
    return Object.fromEntries(rows.map(r => [r.input_type, Number(r.amount)]));
  }
  async listInputs({ month, year, employeeId, status, companyId } = {}) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    return query(`SELECT pi.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) employee_name
      FROM payroll_inputs pi JOIN employees e ON e.employee_id=pi.employee_id
      WHERE e.company_id=? AND (? IS NULL OR pi.month=?) AND (? IS NULL OR pi.year=?) AND (? IS NULL OR pi.employee_id=?) AND (? IS NULL OR pi.status=?)
      ORDER BY pi.created_at DESC`,
      [company, month || null, month || null, year || null, year || null, employeeId || null, employeeId || null, status || null, status || null]);
  }
  async createInput({ employeeId, month, year, inputType, amount, remarks, createdBy, companyId }) {
    if (!['OVERTIME', 'ARREARS'].includes(inputType)) throw ApiError.badRequest('inputType must be OVERTIME or ARREARS');
    if (!(Number(amount) > 0)) throw ApiError.badRequest('amount must be greater than zero');
    await payrollPeriodService.assertInputsOpen(companyId, month, year);
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const employeeRows = await query(
      'SELECT 1 FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [employeeId, company]
    );
    if (!employeeRows.length) throw ApiError.forbidden('You can only access employee records in your company');
    const result = await query(`INSERT INTO payroll_inputs (employee_id,month,year,input_type,amount,remarks,status,created_by)
      VALUES (?,?,?,?,?,?,'PENDING_REVIEW',?)`, [employeeId, month, year, inputType, amount, remarks || null, createdBy]);
    return { payroll_input_id: result.insertId, status: 'PENDING_REVIEW' };
  }
  async reviewInput(id, reviewerId, { approved, remarks }, companyId) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const rows = await query(
      `SELECT pi.employee_id,pi.month,pi.year
         FROM payroll_inputs pi
         JOIN employees e ON e.employee_id = pi.employee_id
        WHERE pi.payroll_input_id = ? AND e.company_id = ?
        LIMIT 1`,
      [id, company]
    );
    if (!rows.length) throw ApiError.notFound('Payroll input not found');
    await payrollPeriodService.assertInputsOpen(companyId, rows[0].month, rows[0].year);
    const reviewerRows = await query(
      'SELECT 1 FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [reviewerId, company]
    );
    if (!reviewerRows.length) throw ApiError.forbidden('You can only act for your company');
    const result = await query(`UPDATE payroll_inputs SET status=?, reviewed_by=?, reviewed_at=NOW(), remarks=COALESCE(?,remarks)
      WHERE payroll_input_id=? AND status='PENDING_REVIEW'`,
      [approved ? 'APPROVED' : 'REJECTED', reviewerId, remarks || null, id]);
    if (!result.affectedRows) throw ApiError.conflict('Payroll input is not awaiting review');
    const updatedRows = await query('SELECT * FROM payroll_inputs WHERE payroll_input_id=?', [id]);
    return updatedRows[0] || null;
  }
}
module.exports = new PayrollRunService();
