const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { encryptSalaryFields, applyVisibility } = require('../utils/encryption');

class SalaryStructureService extends BaseService {
  constructor() {
    super('salary_structures', 'id', [
      'employee_id', 'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
      'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'ctc', 'effective_from',
    ]);
  }

  async list({ employee_id, limit, offset, reqUser } = {}) {
    const results = await callProcedure(
      'sp_list_salary_structures(?, ?, ?)',
      [
        employee_id ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    const rows    = results[0] ?? [];
    const total   = (results[1] ?? [])[0]?.total ?? 0;
    const visible = rows.map(r => applyVisibility(r, reqUser, r.employee_id));
    return { rows: visible, total };
  }

  async latestForEmployee(employeeId, reqUser = null) {
    const results = await callProcedure('sp_get_latest_salary_structure(?)', [employeeId]);
    const row = (results[0] ?? [])[0] ?? null;
    return applyVisibility(row, reqUser, employeeId);
  }

  async getDetails(id, reqUser = null, ownerId = null) {
    const results = await callProcedure('sp_get_salary_structure(?)', [id]);
    const row = (results[0] ?? [])[0] ?? null;
    return applyVisibility(row, reqUser, ownerId ?? row?.employee_id);
  }

  /** Override: encrypt salary data on INSERT, then NULL out plaintext columns */
  async create(data) {
    const salaryEncrypted = encryptSalaryFields(data);
    const row = await super.create(data);
    if (salaryEncrypted && row) {
      await callProcedure('sp_update_salary_encrypted(?, ?)', [row.id, salaryEncrypted]);
    }
    return row;
  }

  /** Override: encrypt salary data on UPDATE, then NULL out plaintext columns */
  async update(id, data) {
    const row = await super.update(id, data);
    const rawResults = await callProcedure('sp_get_salary_structure_raw(?)', [id]);
    const full = (rawResults[0] ?? [])[0] ?? null;
    if (full) {
      const { decryptSalaryRow } = require('../utils/encryption');
      const existing = decryptSalaryRow(full);
      const merged   = { ...existing, ...data };
      const salaryEncrypted = encryptSalaryFields(merged);
      if (salaryEncrypted) {
        await callProcedure('sp_update_salary_encrypted(?, ?)', [id, salaryEncrypted]);
      }
    }
    return row;
  }

  async bulkImport(rows) {
    if (!Array.isArray(rows) || rows.length === 0) throw ApiError.badRequest('No rows to import');

    const result = { inserted: 0, updated: 0, skipped: [] };

    for (const row of rows) {
      const empCode = String(row.emp_code || row.employee_code || '').trim();
      if (!empCode) { result.skipped.push({ reason: 'Missing emp_code' }); continue; }

      const empResults = await callProcedure('sp_find_employee_by_empcode(?)', [empCode]);
      const employee   = (empResults[0] ?? [])[0] ?? null;
      if (!employee) { result.skipped.push({ emp_code: empCode, reason: 'Employee not found' }); continue; }
      if (!row.effective_from) { result.skipped.push({ emp_code: empCode, reason: 'Missing effective_from' }); continue; }

      const payload  = this._pick({ ...row, employee_id: employee.employee_id });
      const findRes  = await callProcedure('sp_find_salary_structure(?, ?)', [employee.employee_id, payload.effective_from]);
      const existing = (findRes[0] ?? [])[0] ?? null;

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
