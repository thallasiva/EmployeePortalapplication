const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { computeStructure } = require('../utils/formulaEngine');

function rows(r, idx = 0) {return r[idx] ?? [];}
function row(r, idx = 0) {return (r[idx] ?? [])[0] ?? null;}

class SalaryComponentService {



  async listComponents(activeOnly = null) {
    const res = await callProcedure('sp_list_salary_components(?)', [
    activeOnly != null ? activeOnly ? 1 : 0 : null]
    );
    return rows(res);
  }

  async getComponent(id) {
    const c = row(await callProcedure('sp_get_salary_component(?)', [id]));
    if (!c) throw ApiError.notFound('Salary component not found');
    return c;
  }

  async upsertComponent(id, data) {
    const res = await callProcedure(
      'sp_upsert_salary_component(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
      id || null,
      data.component_name,
      data.component_code?.toUpperCase(),
      data.category,
      data.calc_type,
      data.percentage_value != null ? Number(data.percentage_value) : null,
      data.percentage_of || null,
      data.formula_expr || null,
      data.frequency || 'Monthly',
      data.is_taxable ? 1 : 0,
      data.pf_applicable ? 1 : 0,
      data.esi_applicable ? 1 : 0,
      data.gratuity_applicable ? 1 : 0,
      data.show_offer_letter !== false ? 1 : 0,
      data.show_ctc_breakup !== false ? 1 : 0,
      data.show_payslip !== false ? 1 : 0,
      Number(data.sort_order) || 100,
      data.description || null]

    );
    const { component_id } = row(res) ?? {};
    return this.getComponent(component_id || id);
  }

  async toggleComponent(id, active) {
    await callProcedure('sp_toggle_salary_component(?, ?)', [id, active ? 1 : 0]);
    return this.getComponent(id);
  }



  async listStructures() {
    return rows(await callProcedure('sp_list_salary_structures()'));
  }

  async getStructure(id) {
    const res = await callProcedure('sp_get_salary_structure(?)', [id]);
    const meta = row(res, 0);
    if (!meta) throw ApiError.notFound('Salary structure not found');
    const lines = rows(res, 1);
    return { ...meta, lines };
  }

  async upsertStructure(id, data) {
    const res = await callProcedure(
      'sp_upsert_salary_structure(?,?,?,?)',
      [id || null, data.structure_name, data.description || null, data.is_default ? 1 : 0]
    );
    const { structure_id } = row(res) ?? {};
    const sid = structure_id || id;


    if (Array.isArray(data.lines)) {
      for (const line of data.lines) {
        await callProcedure(
          'sp_save_structure_lines(?,?,?,?,?,?,?,?)',
          [
          sid,
          line.component_id,
          line.calc_type_override || null,
          line.percentage_override != null ? Number(line.percentage_override) : null,
          line.percentage_of_override || null,
          line.formula_override || null,
          line.fixed_amount != null ? Number(line.fixed_amount) : null,
          Number(line.sort_order) || 100]

        );
      }
    }
    return this.getStructure(sid);
  }

  async removeStructureLine(structureId, componentId) {
    await callProcedure('sp_remove_structure_line(?,?)', [structureId, componentId]);
  }



  async computeCTC(structureId, ctcAnnual, overrides = {}) {
    const structure = await this.getStructure(structureId);
    return computeStructure(structure.lines, ctcAnnual, overrides);
  }
}

module.exports = new SalaryComponentService();
