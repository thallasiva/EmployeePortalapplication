const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const MODULE_KEYS = [
  'employees', 'attendance', 'leave', 'payroll', 'recruitment', 'performance',
  'timesheets', 'helpdesk', 'documents', 'reports', 'settings'
];
class CompanyService extends BaseService {
  constructor() {
    super('companies', 'company_id', [
      'company_code', 'company_name', 'legal_name', 'registration_number',
      'registration_country_id', 'country_id', 'headquarters_office_id', 'logo_url',
      'address', 'email', 'phone', 'country', 'timezone', 'currency', 'status'
    ]);
  }

  async create(data) {
    await this.validateReferences(data);
    const company = await super.create(data);
    await query(
      `INSERT IGNORE INTO company_modules (company_id, module_key, enabled)
       VALUES ${MODULE_KEYS.map(() => '(?, ?, 1)').join(', ')}`,
      MODULE_KEYS.flatMap((key) => [company.company_id, key])
    );
    await query(
      `INSERT INTO salary_components (
         company_id, component_name, component_code, category, calc_type,
         percentage_value, percentage_of, formula_expr, frequency, is_taxable,
         pf_applicable, esi_applicable, gratuity_applicable, show_offer_letter,
         show_ctc_breakup, show_payslip, is_active, is_system, sort_order,
         description
       )
       SELECT ?, component_name, component_code, category, calc_type,
              percentage_value, percentage_of, formula_expr, frequency, is_taxable,
              pf_applicable, esi_applicable, gratuity_applicable, show_offer_letter,
              show_ctc_breakup, show_payslip, is_active, is_system, sort_order,
              description
         FROM salary_components
        WHERE company_id = (
          SELECT MIN(source.company_id) FROM companies source WHERE source.company_id <> ?
        ) AND is_system = 1`,
      [company.company_id, company.company_id]
    );
    await query(
      `INSERT INTO salary_templates (
         company_id, template_name, description, basic_pct, hra_pct, variable_pct,
         telephone_monthly, lta_annual, pf_applicable, pf_cap, gratuity_applicable,
         bonus_applicable, insurance_cost, other_allowances, professional_tax,
         is_default, is_active
       )
       SELECT ?, template_name, description, basic_pct, hra_pct, variable_pct,
              telephone_monthly, lta_annual, pf_applicable, pf_cap, gratuity_applicable,
              bonus_applicable, insurance_cost, other_allowances, professional_tax,
              is_default, is_active
         FROM salary_templates
        WHERE company_id = (
          SELECT MIN(source.company_id) FROM companies source WHERE source.company_id <> ?
        )`,
      [company.company_id, company.company_id]
    );
    return company;
  }

  async validateReferences(data, companyId = null) {
    for (const field of ['country_id', 'registration_country_id']) {
      if (data[field] == null) continue;
      const rows = await query('SELECT country_id FROM countries WHERE country_id = ? AND status = ? LIMIT 1', [data[field], 'Active']);
      if (!rows.length) throw ApiError.badRequest(`Select an active ${field === 'country_id' ? 'default' : 'registration'} country`);
    }
    if (data.headquarters_office_id == null) return;
    if (!companyId) throw ApiError.badRequest('Set the headquarters branch after creating the company');
    const rows = await query(
      'SELECT office_id FROM offices WHERE office_id = ? AND company_id = ? LIMIT 1',
      [data.headquarters_office_id, companyId]
    );
    if (!rows.length) throw ApiError.badRequest('The headquarters branch must belong to this company');
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw ApiError.notFound('Company not found');
    await this.validateReferences(data, id);
    return super.update(id, data);
  }

  async getModules(companyId) {
    const rows = await query(
      'SELECT module_key, enabled FROM company_modules WHERE company_id = ? ORDER BY module_key',
      [companyId]
    );
    return rows;
  }

  async updateModules(companyId, modules, userId) {
    for (const module of modules) {
      await query(
        `INSERT INTO company_modules (company_id, module_key, enabled, updated_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), updated_by = VALUES(updated_by), updated_at = NOW()`,
        [companyId, module.module_key, module.enabled ? 1 : 0, userId || null]
      );
    }
    return this.getModules(companyId);
  }
}
module.exports = new CompanyService();
