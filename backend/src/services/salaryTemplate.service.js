const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

function companyIdOrThrow(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) {
    throw ApiError.forbidden('Authenticated company context is required');
  }
  return company;
}

function templateValues(data) {
  return [
    data.template_name.trim(),
    data.description ?? null,
    Number(data.basic_pct ?? 50),
    Number(data.hra_pct ?? 40),
    Number(data.variable_pct ?? 0),
    Number(data.telephone_monthly ?? 1500),
    Number(data.lta_annual ?? 0),
    data.pf_applicable ? 1 : 0,
    data.pf_cap ? 1 : 0,
    data.gratuity_applicable ? 1 : 0,
    data.bonus_applicable ? 1 : 0,
    Number(data.insurance_cost ?? 0),
    Number(data.other_allowances ?? 0),
    Number(data.professional_tax ?? 0),
    data.is_default ? 1 : 0,
  ];
}

const COLUMNS = `template_name, description, basic_pct, hra_pct, variable_pct,
  telephone_monthly, lta_annual, pf_applicable, pf_cap, gratuity_applicable,
  bonus_applicable, insurance_cost, other_allowances, professional_tax, is_default`;

class SalaryTemplateService {
  async list(companyId) {
    const company = companyIdOrThrow(companyId);
    return query(
      `SELECT * FROM salary_templates
        WHERE company_id = ? AND is_active = 1
        ORDER BY is_default DESC, template_name ASC`,
      [company]
    );
  }

  async get(id, companyId) {
    const company = companyIdOrThrow(companyId);
    const templates = await query(
      'SELECT * FROM salary_templates WHERE template_id = ? AND company_id = ? LIMIT 1',
      [id, company]
    );
    if (!templates[0]) throw ApiError.notFound('Salary template not found');
    return templates[0];
  }

  async create(data, companyId) {
    const company = companyIdOrThrow(companyId);
    if (!data.template_name?.trim()) throw ApiError.badRequest('template_name is required');
    const values = templateValues(data);
    const result = await withTransaction(async (connection) => {
      if (data.is_default) {
        await connection.execute('UPDATE salary_templates SET is_default = 0 WHERE company_id = ?', [company]);
      }
      const [inserted] = await connection.execute(
        `INSERT INTO salary_templates (company_id, ${COLUMNS}) VALUES (?, ${values.map(() => '?').join(', ')})`,
        [company, ...values]
      );
      return inserted.insertId;
    });
    return this.get(result, company);
  }

  async update(id, data, companyId) {
    const company = companyIdOrThrow(companyId);
    if (!data.template_name?.trim()) throw ApiError.badRequest('template_name is required');
    const values = templateValues(data);
    await withTransaction(async (connection) => {
      const [existing] = await connection.execute(
        'SELECT template_id FROM salary_templates WHERE template_id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
        [id, company]
      );
      if (!existing.length) throw ApiError.notFound('Salary template not found');
      if (data.is_default) {
        await connection.execute(
          'UPDATE salary_templates SET is_default = 0 WHERE company_id = ? AND template_id <> ?',
          [company, id]
        );
      }
      await connection.execute(
        `UPDATE salary_templates SET
           template_name = ?, description = ?, basic_pct = ?, hra_pct = ?, variable_pct = ?,
           telephone_monthly = ?, lta_annual = ?, pf_applicable = ?, pf_cap = ?,
           gratuity_applicable = ?, bonus_applicable = ?, insurance_cost = ?,
           other_allowances = ?, professional_tax = ?, is_default = ?
         WHERE template_id = ? AND company_id = ?`,
        [...values, id, company]
      );
    });
    return this.get(id, company);
  }

  async remove(id, companyId) {
    const company = companyIdOrThrow(companyId);
    const result = await query(
      'UPDATE salary_templates SET is_active = 0, is_default = 0 WHERE template_id = ? AND company_id = ? AND is_active = 1',
      [id, company]
    );
    if (!result.affectedRows) throw ApiError.notFound('Salary template not found');
    return { deleted: true };
  }
}

module.exports = new SalaryTemplateService();
