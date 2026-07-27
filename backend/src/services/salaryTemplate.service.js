const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

function row(results) { return (results[0] ?? [])[0] ?? null; }
function rows(results) { return results[0] ?? []; }

const PARAMS = (d) => [
  d.template_name,
  d.description         ?? null,
  Number(d.basic_pct)        || 50,
  Number(d.hra_pct)          || 40,
  Number(d.variable_pct)     || 0,
  Number(d.telephone_monthly) || 1500,
  Number(d.lta_annual)       || 0,
  d.pf_applicable   ? 1 : 0,
  d.pf_cap          ? 1 : 0,
  d.gratuity_applicable ? 1 : 0,
  d.bonus_applicable    ? 1 : 0,
  Number(d.insurance_cost)   || 0,
  Number(d.other_allowances) || 0,
  Number(d.professional_tax) || 0,
  d.is_default      ? 1 : 0,
];

class SalaryTemplateService {
  async list() {
    return rows(await callProcedure('sp_list_salary_templates()'));
  }

  async get(id) {
    const t = row(await callProcedure('sp_get_salary_template(?)', [id]));
    if (!t) throw ApiError.notFound('Salary template not found');
    return t;
  }

  async create(data) {
    if (!data.template_name) throw ApiError.badRequest('template_name is required');
    const result = row(await callProcedure(
      'sp_create_salary_template(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      PARAMS(data)
    ));
    return this.get(result.template_id);
  }

  async update(id, data) {
    await callProcedure(
      'sp_update_salary_template(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, ...PARAMS(data)]
    );
    return this.get(id);
  }

  async remove(id) {
    await callProcedure('sp_delete_salary_template(?)', [id]);
    return { deleted: true };
  }
}

module.exports = new SalaryTemplateService();
