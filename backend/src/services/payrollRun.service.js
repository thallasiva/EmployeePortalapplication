const BaseService = require('./base.service');
const { callProcedure, readOuts, query } = require('../config/db');

class PayrollRunService extends BaseService {
  constructor() {
    super('payroll_runs', 'payroll_run_id', ['month', 'year', 'status', 'processed_by', 'processed_on', 'total_amount']);
  }

  async list({ year, status, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_payroll_runs(?, ?, ?, ?)',
      [
      year ?? null,
      status ?? null,
      limit != null ? Number(limit) : null,
      limit != null ? Number(offset || 0) : null]

    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_payroll_run(?)', [id]);
    if (!(results[0] ?? []).length) return null;
    return { ...results[0][0], payslips: results[1] ?? [] };
  }





  async run({ month, year, processed_by }) {
    await callProcedure('sp_run_payroll(?, ?, ?, @payroll_run_id)', [month, year, processed_by || null]);
    const out = await readOuts('payroll_run_id');
    const payrollRunId = out[0].payroll_run_id;
    return this.getDetails(payrollRunId);
  }

  async submitForReview(id, employeeId) {
    await query(`UPDATE payroll_runs SET review_status='PENDING_REVIEW', processed_by=? WHERE payroll_run_id=? AND review_status IN ('DRAFT','REJECTED')`, [employeeId, id]);
    return this.getDetails(id);
  }

  async review(id, employeeId, { approved, remarks }) {
    await query(`UPDATE payroll_runs SET review_status=?, reviewed_by=?, reviewed_at=NOW(), approval_remarks=? WHERE payroll_run_id=? AND review_status='PENDING_REVIEW'`, [approved ? 'APPROVED' : 'REJECTED', employeeId, remarks || null, id]);
    return this.getDetails(id);
  }

  async approvedInputs(employeeId, month, year) {
    const rows = await query(`SELECT input_type, COALESCE(SUM(amount),0) amount FROM payroll_inputs WHERE employee_id=? AND month=? AND year=? AND status='APPROVED' GROUP BY input_type`, [employeeId, month, year]);
    return Object.fromEntries(rows.map(r => [r.input_type, Number(r.amount)]));
  }

  async listInputs({ month, year, employeeId, status } = {}) {
    return query(`SELECT pi.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) employee_name
      FROM payroll_inputs pi JOIN employees e ON e.employee_id=pi.employee_id
      WHERE (? IS NULL OR pi.month=?) AND (? IS NULL OR pi.year=?) AND (? IS NULL OR pi.employee_id=?) AND (? IS NULL OR pi.status=?)
      ORDER BY pi.created_at DESC`, [month || null, month || null, year || null, year || null, employeeId || null, employeeId || null, status || null, status || null]);
  }

  async createInput({ employeeId, month, year, inputType, amount, remarks, createdBy }) {
    if (!['OVERTIME', 'ARREARS'].includes(inputType)) throw new Error('inputType must be OVERTIME or ARREARS');
    if (!(Number(amount) > 0)) throw new Error('amount must be greater than zero');
    const result = await query(`INSERT INTO payroll_inputs (employee_id,month,year,input_type,amount,remarks,status,created_by)
      VALUES (?,?,?,?,?,?,'PENDING_REVIEW',?)`, [employeeId, month, year, inputType, amount, remarks || null, createdBy]);
    return { payroll_input_id: result.insertId, status: 'PENDING_REVIEW' };
  }

  async reviewInput(id, reviewerId, { approved, remarks }) {
    await query(`UPDATE payroll_inputs SET status=?, reviewed_by=?, reviewed_at=NOW(), remarks=COALESCE(?,remarks)
      WHERE payroll_input_id=? AND status='PENDING_REVIEW'`, [approved ? 'APPROVED' : 'REJECTED', reviewerId, remarks || null, id]);
    const rows = await query('SELECT * FROM payroll_inputs WHERE payroll_input_id=?', [id]);
    return rows[0] || null;
  }

  async exportBankFile(id) {
    const rows = await query(`SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) employee_name,
      b.account_number, b.ifsc_code, p.net_pay FROM payroll_runs r JOIN payslips p ON p.payroll_run_id=r.payroll_run_id
      JOIN employees e ON e.employee_id=p.employee_id LEFT JOIN employee_bank_details b ON b.employee_id=e.employee_id
      WHERE r.payroll_run_id=? AND r.review_status='APPROVED' AND p.status='Generated'`, [id]);
    if (!rows.length) throw new Error('An approved payroll run with generated payslips is required');
    await query('UPDATE payroll_runs SET payment_exported_at=NOW() WHERE payroll_run_id=?', [id]);
    return rows;
  }
}

module.exports = new PayrollRunService();
