const { callProcedure, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { computeStructure } = require('../utils/formulaEngine');
function rows(r, idx = 0) { return r[idx] ?? []; }
function row(r, idx = 0) { return (r[idx] ?? [])[0] ?? null; }
function companyIdOrThrow(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) {
    throw ApiError.forbidden('Authenticated company context is required');
  }
  return company;
}
class SalaryAssignmentService {
  async assertEmployeeCompany(employeeId, companyId) {
    const company = companyIdOrThrow(companyId);
    const [employee] = await query(
      'SELECT employee_id FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [employeeId, company]
    );
    if (!employee) throw ApiError.notFound('Employee not found');
  }
  async assign(employeeId, { structure_id, ctc_annual, effective_from }, companyId) {
    const company = companyIdOrThrow(companyId);
    if (!structure_id || !ctc_annual || !effective_from)
      throw ApiError.badRequest('structure_id, ctc_annual and effective_from are required');
    const [employee] = await query(
      'SELECT company_id FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
      [employeeId, company]
    );
    const [structure] = await query(
      'SELECT company_id FROM salary_structures WHERE structure_id = ? AND company_id = ? LIMIT 1',
      [structure_id, company]
    );
    if (!employee || !structure) throw ApiError.notFound('Employee or salary structure not found');
    if (Number(employee.company_id) !== Number(structure.company_id)) {
      throw ApiError.badRequest('The salary structure belongs to a different company');
    }
    const res = await callProcedure(
      'sp_assign_salary_structure(?, ?, ?, ?, ?)',
      [employeeId, structure_id, Number(ctc_annual), effective_from, null]
    );
    row(res);
    return this.getAssignment(employeeId, company);
  }
  async getAssignment(employeeId, companyId) {
    const company = companyIdOrThrow(companyId);

    await this.assertEmployeeCompany(employeeId, company);

    const res = await callProcedure(
      'sp_get_employee_salary_assignment(?, ?)',
      [employeeId, company]
    );

    const meta = row(res, 0);
    const lines = rows(res, 1);

    if (!meta) return null;

    return {
      ...meta,
      lines
    };
  }
  async listAll({ department_id, search, companyId } = {}) {
    const company = companyIdOrThrow(companyId);
    const res = await callProcedure(
      'sp_list_employee_salary_assignments(?, ?, ?)',
      [department_id ?? null, search ?? null, company]
    );
    return rows(res);
  }
  async history(employeeId, companyId) {
    const company = companyIdOrThrow(companyId);

    await this.assertEmployeeCompany(employeeId, company);

    const res = await callProcedure(
      'sp_get_salary_assignment_history(?, ?)',
      [employeeId, company]
    );

    return rows(res);
  }
  async computePayslipBreakdown(employeeId, companyId, ctcAnnualOverride = null) {
    const assignment = await this.getAssignment(employeeId, companyId);
    if (!assignment || !assignment.lines?.length) return null;
    const ctcAnnual = ctcAnnualOverride ?? Number(assignment.ctc_annual);
    return computeStructure(assignment.lines, ctcAnnual, {});
  }
}
module.exports = new SalaryAssignmentService();
