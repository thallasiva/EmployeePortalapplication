const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { computeStructure, validateFormula } = require('../utils/formulaEngine');

function companyIdOrThrow(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) {
    throw ApiError.forbidden('Authenticated company context is required');
  }
  return company;
}

function componentValues(data) {
  return [
    data.component_name,
    String(data.component_code || '').trim().toUpperCase(),
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
    data.description || null,
  ];
}

class SalaryComponentService {
  async listComponents(companyId, activeOnly = null) {
    const company = companyIdOrThrow(companyId);
    return query(
      `SELECT * FROM salary_components
        WHERE company_id = ? AND (? IS NULL OR is_active = ?)
        ORDER BY category, sort_order, component_name`,
      [company, activeOnly == null ? null : activeOnly ? 1 : 0, activeOnly == null ? null : activeOnly ? 1 : 0]
    );
  }

  async getComponent(id, companyId, connection = null) {
    const company = companyIdOrThrow(companyId);
    let rows;
    if (connection) {
      [rows] = await connection.execute(
        'SELECT * FROM salary_components WHERE component_id = ? AND company_id = ? LIMIT 1',
        [id, company]
      );
    } else {
      rows = await query(
        'SELECT * FROM salary_components WHERE component_id = ? AND company_id = ? LIMIT 1',
        [id, company]
      );
    }
    if (!rows[0]) throw ApiError.notFound('Salary component not found');
    return rows[0];
  }

  async upsertComponent(id, data, companyId) {
    const company = companyIdOrThrow(companyId);
    if (!data.component_name || !data.component_code || !data.category || !data.calc_type) {
      throw ApiError.badRequest('component_name, component_code, category and calc_type are required');
    }
    if (!['Earning', 'Deduction', 'Employer Contribution'].includes(data.category)) {
      throw ApiError.badRequest('Invalid salary component category');
    }
    if (!['Fixed', 'Percentage', 'Formula'].includes(data.calc_type)) {
      throw ApiError.badRequest('Invalid salary component calculation type');
    }
    if (data.calc_type === 'Formula') {
      const components = await query(
        'SELECT component_code FROM salary_components WHERE company_id = ? AND is_active = 1',
        [company]
      );
      const allowedVariables = new Set([
        'CTC_ANNUAL', 'CTC_MONTHLY', 'CTC_ANNUAL_TOTAL', 'CTC_MONTHLY_TOTAL',
        'GROSS', 'GROSS_STD',
        ...components.map((component) => component.component_code),
        String(data.component_code).trim().toUpperCase(),
      ]);
      try {
        validateFormula(data.formula_expr, allowedVariables);
      } catch (error) {
        throw ApiError.badRequest(`Invalid salary formula: ${error.message}`);
      }
    }
    if (id) {
      const current = await this.getComponent(id, company);
      if (current.is_system) throw ApiError.conflict('System salary components cannot be edited');
      await query(
        `UPDATE salary_components SET
           component_name = ?, component_code = ?, category = ?, calc_type = ?,
           percentage_value = ?, percentage_of = ?, formula_expr = ?, frequency = ?,
           is_taxable = ?, pf_applicable = ?, esi_applicable = ?, gratuity_applicable = ?,
           show_offer_letter = ?, show_ctc_breakup = ?, show_payslip = ?,
           sort_order = ?, description = ?
         WHERE component_id = ? AND company_id = ? AND is_system = 0`,
        [...componentValues(data), id, company]
      );
      return this.getComponent(id, company);
    }

    const result = await query(
      `INSERT INTO salary_components (
         company_id, component_name, component_code, category, calc_type,
         percentage_value, percentage_of, formula_expr, frequency,
         is_taxable, pf_applicable, esi_applicable, gratuity_applicable,
         show_offer_letter, show_ctc_breakup, show_payslip, sort_order, description
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company, ...componentValues(data)]
    );
    return this.getComponent(result.insertId, company);
  }

  async toggleComponent(id, active, companyId) {
    const company = companyIdOrThrow(companyId);
    const current = await this.getComponent(id, company);
    if (current.is_system) throw ApiError.conflict('System salary components cannot be deactivated');
    await query(
      'UPDATE salary_components SET is_active = ? WHERE component_id = ? AND company_id = ? AND is_system = 0',
      [active ? 1 : 0, id, company]
    );
    return this.getComponent(id, company);
  }

  async listStructures(companyId) {
    const company = companyIdOrThrow(companyId);
    return query(
      `SELECT s.*, COUNT(c.component_id) AS component_count
         FROM salary_structures s
         LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
         LEFT JOIN salary_components c ON c.component_id = l.component_id AND c.company_id = s.company_id
        WHERE s.company_id = ? AND s.is_active = 1
        GROUP BY s.structure_id
        ORDER BY s.is_default DESC, s.structure_name`,
      [company]
    );
  }

  async assertStructureCompany(id, companyId, connection = null) {
    const company = companyIdOrThrow(companyId);
    const execute = connection ? connection.execute.bind(connection) : query;
    const result = await execute(
      'SELECT structure_id FROM salary_structures WHERE structure_id = ? AND company_id = ? LIMIT 1',
      [id, company]
    );
    const rows = connection ? result[0] : result;
    if (!rows.length) throw ApiError.notFound('Salary structure not found');
  }

  async getStructure(id, companyId) {
    const company = companyIdOrThrow(companyId);
    const structures = await query(
      `SELECT s.*, COUNT(c.component_id) AS component_count
         FROM salary_structures s
         LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
         LEFT JOIN salary_components c ON c.component_id = l.component_id AND c.company_id = s.company_id
        WHERE s.structure_id = ? AND s.company_id = ?
        GROUP BY s.structure_id`,
      [id, company]
    );
    const structure = structures[0];
    if (!structure) throw ApiError.notFound('Salary structure not found');
    const lines = await query(
      `SELECT l.*, c.component_name, c.component_code, c.category,
              c.calc_type AS master_calc_type, c.percentage_value AS master_pct_value,
              c.percentage_of AS master_pct_of, c.formula_expr AS master_formula,
              c.frequency, c.show_offer_letter, c.show_ctc_breakup, c.show_payslip,
              COALESCE(l.calc_type_override, c.calc_type) AS effective_calc_type,
              COALESCE(l.percentage_override, c.percentage_value) AS effective_pct,
              COALESCE(l.percentage_of_override, c.percentage_of) AS effective_pct_of,
              COALESCE(l.formula_override, c.formula_expr) AS effective_formula
         FROM salary_structure_lines l
         JOIN salary_components c ON c.component_id = l.component_id AND c.company_id = ?
        WHERE l.structure_id = ? AND l.is_active = 1
        ORDER BY l.sort_order, c.sort_order`,
      [company, id]
    );
    return { ...structure, lines };
  }

  async upsertStructure(id, data, companyId) {
    const company = companyIdOrThrow(companyId);
    if (!data.structure_name?.trim()) throw ApiError.badRequest('structure_name is required');
    if (data.lines !== undefined && !Array.isArray(data.lines)) {
      throw ApiError.badRequest('lines must be an array');
    }
    const lines = data.lines || [];
    const componentIds = lines.map((line) => Number(line.component_id));
    if (componentIds.some((componentId) => !Number.isInteger(componentId) || componentId <= 0) ||
        new Set(componentIds).size !== componentIds.length) {
      throw ApiError.badRequest('Salary structure lines must contain unique valid component IDs');
    }

    let structureId = id;
    await withTransaction(async (connection) => {
      if (id) {
        await this.assertStructureCompany(id, company, connection);
      }
      if (componentIds.length) {
        const [components] = await connection.execute(
          `SELECT component_id, component_code, calc_type, formula_expr FROM salary_components
            WHERE company_id = ? AND is_active = 1 AND component_id IN (${componentIds.map(() => '?').join(',')})`,
          [company, ...componentIds]
        );
        if (components.length !== componentIds.length) {
          throw ApiError.badRequest('Every salary component must be active and belong to this company');
        }
        const componentById = new Map(components.map((component) => [Number(component.component_id), component]));
        const allowedVariables = new Set([
          'CTC_ANNUAL', 'CTC_MONTHLY', 'CTC_ANNUAL_TOTAL', 'CTC_MONTHLY_TOTAL', 'GROSS', 'GROSS_STD',
          ...components.map((component) => component.component_code),
        ]);
        for (const line of lines) {
          const component = componentById.get(Number(line.component_id));
          const calcType = line.calc_type_override || component.calc_type;
          if (!['Fixed', 'Percentage', 'Formula'].includes(calcType)) {
            throw ApiError.badRequest(`Invalid calculation type for ${component.component_code}`);
          }
          if (line.fixed_amount != null && (!Number.isFinite(Number(line.fixed_amount)) || Number(line.fixed_amount) < 0)) {
            throw ApiError.badRequest(`Fixed amount for ${component.component_code} must be non-negative`);
          }
          if (line.percentage_override != null &&
              (!Number.isFinite(Number(line.percentage_override)) || Number(line.percentage_override) < 0)) {
            throw ApiError.badRequest(`Percentage for ${component.component_code} must be non-negative`);
          }
          if (calcType === 'Formula') {
            try {
              validateFormula(line.formula_override || component.formula_expr, allowedVariables);
            } catch (error) {
              throw ApiError.badRequest(`Invalid formula for ${component.component_code}: ${error.message}`);
            }
          }
          const percentageOf = line.percentage_of_override;
          if (percentageOf && !allowedVariables.has(String(percentageOf).toUpperCase())) {
            throw ApiError.badRequest(`Unknown percentage base "${percentageOf}"`);
          }
        }
      }
      if (data.is_default) {
        await connection.execute(
          'UPDATE salary_structures SET is_default = 0 WHERE company_id = ?',
          [company]
        );
      }
      if (id) {
        await connection.execute(
          `UPDATE salary_structures
              SET structure_name = ?, description = ?, is_default = ?
            WHERE structure_id = ? AND company_id = ?`,
          [data.structure_name.trim(), data.description || null, data.is_default ? 1 : 0, id, company]
        );
      } else {
        const [result] = await connection.execute(
          `INSERT INTO salary_structures (company_id, structure_name, description, is_default)
           VALUES (?, ?, ?, ?)`,
          [company, data.structure_name.trim(), data.description || null, data.is_default ? 1 : 0]
        );
        structureId = result.insertId;
      }
      for (const line of lines) {
        await connection.execute(
          `INSERT INTO salary_structure_lines
             (structure_id, component_id, calc_type_override, percentage_override,
              percentage_of_override, formula_override, fixed_amount, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE
             calc_type_override = VALUES(calc_type_override),
             percentage_override = VALUES(percentage_override),
             percentage_of_override = VALUES(percentage_of_override),
             formula_override = VALUES(formula_override),
             fixed_amount = VALUES(fixed_amount), sort_order = VALUES(sort_order), is_active = 1`,
          [structureId, Number(line.component_id), line.calc_type_override || null,
            line.percentage_override != null ? Number(line.percentage_override) : null,
            line.percentage_of_override || null, line.formula_override || null,
            line.fixed_amount != null ? Number(line.fixed_amount) : null, Number(line.sort_order) || 100]
        );
      }
    });
    return this.getStructure(structureId, company);
  }

  async removeStructureLine(structureId, componentId, companyId) {
    const company = companyIdOrThrow(companyId);
    await this.assertStructureCompany(structureId, company);
    const result = await query(
      `UPDATE salary_structure_lines l
         JOIN salary_structures s ON s.structure_id = l.structure_id
         JOIN salary_components c ON c.component_id = l.component_id
          SET l.is_active = 0
        WHERE l.structure_id = ? AND l.component_id = ?
          AND s.company_id = ? AND c.company_id = ? AND l.is_active = 1`,
      [structureId, componentId, company, company]
    );
    if (!result.affectedRows) throw ApiError.notFound('Salary structure component not found');
  }

  async deactivateStructure(id, companyId) {
    const company = companyIdOrThrow(companyId);
    await this.assertStructureCompany(id, company);
    await query(
      'UPDATE salary_structures SET is_active = 0, is_default = 0 WHERE structure_id = ? AND company_id = ?',
      [id, company]
    );
  }

  async computeCTC(structureId, ctcAnnual, overrides = {}, companyId) {
    const structure = await this.getStructure(structureId, companyId);
    return computeStructure(structure.lines, ctcAnnual, overrides);
  }
}

module.exports = new SalaryComponentService();
