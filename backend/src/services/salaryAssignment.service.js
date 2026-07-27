const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { computeStructure } = require('../utils/formulaEngine');

function rows(r, idx = 0) {return r[idx] ?? [];}
function row(r, idx = 0) {return (r[idx] ?? [])[0] ?? null;}

class SalaryAssignmentService {


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


  async getAssignment(employeeId) {
    const res = await callProcedure('sp_get_employee_salary_assignment(?)', [employeeId]);
    const meta = row(res, 0);
    const lines = rows(res, 1);
    if (!meta) return null;
    return { ...meta, lines };
  }


  async listAll({ department_id, search } = {}) {
    const res = await callProcedure(
      'sp_list_employee_salary_assignments(?, ?)',
      [department_id ?? null, search ?? null]
    );
    return rows(res);
  }


  async history(employeeId) {
    const res = await callProcedure('sp_get_salary_assignment_history(?)', [employeeId]);
    return rows(res);
  }





  async computePayslipBreakdown(employeeId, ctcAnnualOverride = null) {
    const assignment = await this.getAssignment(employeeId);
    if (!assignment || !assignment.lines?.length) return null;

    const ctcAnnual = ctcAnnualOverride ?? Number(assignment.ctc_annual);
    return computeStructure(assignment.lines, ctcAnnual, {});
  }
}

module.exports = new SalaryAssignmentService();
