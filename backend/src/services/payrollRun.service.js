const BaseService = require('./base.service');
const { callProcedure, readOuts } = require('../config/db');

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
}

module.exports = new PayrollRunService();
