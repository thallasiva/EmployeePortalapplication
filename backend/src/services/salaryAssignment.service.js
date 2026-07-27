const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { computeStructure } = require('../utils/formulaEngine');

function rows(r, idx = 0) { return r[idx] ?? []; }
function row(r, idx = 0)  { return (r[idx] ?? [])[0] ?? null; }

class SalaryAssignmentService {

  /** Assign (or update) a structure+CTC to an employee */
  async assign(employeeId, { structure_id, ctc_annual, effective_from }) {
    if (!structure_id || !ctc_annual || !effective_from)
      throw ApiError.badRequest('structure_id, ctc_annual and effective_from are required');

    const res = await callProcedure(
      'sp_assign_salary_structure(?, ?, ?, ?, ?)',
      [employeeId, structure_id, Number(ctc_annual), effective_from, null]
    );
    const { assignment_id } = row(res) ?? {};
    return this.getAssignment(employeeId);
  }

  /** Get active assignment + structure lines for one employee */
  async getAssignment(employeeId) {
    const res  = await callProcedure('sp_get_employee_salary_assignment(?)', [employeeId]);
    const meta  = row(res, 0);
    const lines = rows(res, 1);
    if (!meta) return null;
    return { ...meta, lines };
  }

  /** List all employees with their current assignment */
  async listAll({ department_id, search } = {}) {
    const res = await callProcedure(
      'sp_list_employee_salary_assignments(?, ?)',
      [department_id ?? null, search ?? null]
    );
    return rows(res);
  }

  /** Get revision history for one employee */
  async history(employeeId) {
    const res = await callProcedure('sp_get_salary_assignment_history(?)', [employeeId]);
    return rows(res);
  }

  /**
   * Compute payslip component breakdown using the employee's assigned structure.
   * Returns { components, ctx } from formulaEngine, or null if no assignment.
   */
  async computePayslipBreakdown(employeeId, ctcAnnualOverride = null) {
    const assignment = await this.getAssignment(employeeId);
    if (!assignment || !assignment.lines?.length) return null;

    const ctcAnnual = ctcAnnualOverride ?? Number(assignment.ctc_annual);
    return computeStructure(assignment.lines, ctcAnnual, {});
  }
}

module.exports = new SalaryAssignmentService();
