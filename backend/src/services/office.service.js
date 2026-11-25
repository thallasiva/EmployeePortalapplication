const BaseService = require('./base.service');
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { isPlatformAdmin, resolveCompanyScope } = require('../utils/companyScope');
const accessControlService = require('./accessControl.service');
const { hasScopeAccess } = require('../utils/accessScope');

const OFFICE_FIELDS = [
  'company_id', 'branch_code', 'office_name', 'location', 'address', 'holiday_calendar',
  'timezone', 'status', 'geo_latitude', 'geo_longitude', 'geo_radius_meters',
  'geo_fence_enabled', 'country_id', 'region_id', 'state', 'city', 'postal_code',
  'currency', 'contact_email', 'contact_phone', 'branch_head_employee_id',
  'hr_manager_employee_id', 'working_days'
];

function nullableNumber(value) {
  return value === '' || value === undefined ? null : value;
}

function normalizeWorkingDays(value) {
  if (value === undefined || value === null || value === '') return null;
  return Array.isArray(value) ? JSON.stringify(value) : value;
}

function buildBranchFilters(user, filters = {}) {
  const clauses = [];
  const params = [];
  const companyId = resolveCompanyScope(user, filters.company_id);
  if (companyId !== null) {
    clauses.push('o.company_id = ?');
    params.push(companyId);
  }
  if (
    !isPlatformAdmin(user)
    && !user?.scopeAssignments?.some((scope) => scope.scope_type === 'GLOBAL')
    && user?.roleIds?.length
  ) {
    const scopeClauses = [];
    for (const scope of user.scopeAssignments || []) {
      if (scope.scope_type === 'COMPANY' && scope.company_id != null) {
        scopeClauses.push('o.company_id = ?');
        params.push(scope.company_id);
      } else if (scope.scope_type === 'REGION' && scope.region_id != null) {
        scopeClauses.push('o.region_id = ?');
        params.push(scope.region_id);
      } else if (scope.scope_type === 'BRANCH' && scope.branch_id != null) {
        scopeClauses.push('o.office_id = ?');
        params.push(scope.branch_id);
      } else if (scope.scope_type === 'DEPARTMENT' && scope.department_id != null) {
        scopeClauses.push(`EXISTS (
          SELECT 1 FROM branch_departments allowed_bd
           WHERE allowed_bd.branch_id = o.office_id
             AND allowed_bd.department_id = ?
        )`);
        params.push(scope.department_id);
      } else if (scope.scope_type === 'TEAM' && scope.team_id != null) {
        scopeClauses.push(`EXISTS (
          SELECT 1 FROM employees allowed_team
           WHERE allowed_team.office_id = o.office_id AND allowed_team.team_id = ?
        )`);
        params.push(scope.team_id);
      }
    }
    clauses.push(scopeClauses.length ? `(${scopeClauses.join(' OR ')})` : '1 = 0');
  }
  for (const [field, value] of [
    ['country_id', filters.country_id],
    ['region_id', filters.region_id],
  ]) {
    if (value !== undefined && value !== null && value !== '') {
      const id = Number(value);
      if (!Number.isInteger(id) || id < 1) throw ApiError.badRequest(`A valid ${field} is required`);
      clauses.push(`o.${field} = ?`);
      params.push(id);
    }
  }
  if (filters.status) {
    if (!['Active', 'Inactive'].includes(filters.status)) throw ApiError.badRequest('Invalid branch status filter');
    clauses.push('o.status = ?');
    params.push(filters.status);
  }
  return { where: clauses.length ? clauses.join(' AND ') : '1 = 1', params };
}

class OfficeService extends BaseService {
  constructor() {
    super('offices', 'office_id', OFFICE_FIELDS);
  }

  async _branchById(user, branchId, connection) {
    const companyId = resolveCompanyScope(user);
    const sql = `SELECT o.*, o.office_id AS branch_id, c.company_name,
                        co.country_name, r.region_name
                   FROM offices o
                   LEFT JOIN companies c ON c.company_id = o.company_id
                   LEFT JOIN countries co ON co.country_id = o.country_id
                   LEFT JOIN regions r ON r.region_id = o.region_id
                  WHERE o.office_id = ?${companyId === null ? '' : ' AND o.company_id = ?'}
                  LIMIT 1`;
    const params = companyId === null ? [branchId] : [branchId, companyId];
    const rows = connection
      ? (await connection.query(sql, params))[0]
      : await query(sql, params);
    if (!rows.length) throw ApiError.notFound('Branch not found');
    await accessControlService.assertBranchScope(user, branchId);
    return rows[0];
  }

  async listBranches(user, filters = {}) {
    const { where, params } = buildBranchFilters(user, filters);
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 100));
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      query(
        `SELECT o.*, o.office_id AS branch_id, c.company_name, co.country_name, r.region_name,
                (SELECT COUNT(*) FROM employees e
                  WHERE e.office_id = o.office_id AND e.company_id = o.company_id) AS employee_count,
                (SELECT COUNT(*) FROM branch_departments bd
                  WHERE bd.branch_id = o.office_id AND bd.company_id = o.company_id) AS department_count,
                (CASE WHEN o.branch_head_employee_id IS NULL THEN 0 ELSE 1 END
                 + CASE WHEN o.hr_manager_employee_id IS NULL
                          OR o.hr_manager_employee_id = o.branch_head_employee_id THEN 0 ELSE 1 END) AS manager_count
           FROM offices o
           LEFT JOIN companies c ON c.company_id = o.company_id
           LEFT JOIN countries co ON co.country_id = o.country_id
           LEFT JOIN regions r ON r.region_id = o.region_id
          WHERE ${where}
          ORDER BY o.office_id DESC
          LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) AS total FROM offices o WHERE ${where}`, params),
    ]);
    return { rows, total: Number(countRows[0]?.total || 0), page, limit };
  }

  async getBranch(user, branchId) {
    const branch = await this._branchById(user, branchId);
    const counts = await query(
      `SELECT
         (SELECT COUNT(*) FROM employees e
           WHERE e.office_id = ? AND e.company_id = ?) AS employee_count,
         (SELECT COUNT(*) FROM branch_departments bd
           WHERE bd.branch_id = ? AND bd.company_id = ?) AS department_count,
         (CASE WHEN ? IS NULL THEN 0 ELSE 1 END
          + CASE WHEN ? IS NULL OR ? = ? THEN 0 ELSE 1 END) AS manager_count`,
      [
        branch.office_id, branch.company_id, branch.office_id, branch.company_id,
        branch.branch_head_employee_id, branch.hr_manager_employee_id,
        branch.hr_manager_employee_id, branch.branch_head_employee_id,
      ]
    );
    return { ...branch, ...(counts[0] || {}) };
  }

  async _validateReferences(data, companyId, connection) {
    const run = async (sql, params) => {
      const rows = connection ? (await connection.query(sql, params))[0] : await query(sql, params);
      return rows;
    };
    if (data.country_id != null) {
      const rows = await run('SELECT country_id FROM countries WHERE country_id = ? AND status = ? LIMIT 1', [data.country_id, 'Active']);
      if (!rows.length) throw ApiError.badRequest('Select an active country');
    }
    if (data.region_id != null) {
      const rows = await run('SELECT country_id FROM regions WHERE region_id = ? AND status = ? LIMIT 1', [data.region_id, 'Active']);
      if (!rows.length || Number(rows[0].country_id) !== Number(data.country_id)) {
        throw ApiError.badRequest('The selected region must belong to the selected country');
      }
    }
    for (const field of ['branch_head_employee_id', 'hr_manager_employee_id']) {
      const employeeId = nullableNumber(data[field]);
      if (employeeId == null) continue;
      const rows = await run(
        'SELECT employee_id FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
        [employeeId, companyId]
      );
      if (!rows.length) throw ApiError.badRequest('Branch managers must belong to the branch company');
    }
  }

  async createBranch(user, data) {
    const companyId = resolveCompanyScope(user, data.company_id);
    if (companyId === null) throw ApiError.badRequest('company_id is required when creating a branch');
    const canCreate = isPlatformAdmin(user)
      || (user.scopeAssignments || []).some((scope) =>
        (scope.scope_type === 'COMPANY' && Number(scope.company_id) === companyId)
        || (scope.scope_type === 'REGION' && Number(scope.region_id) === Number(data.region_id))
      );
    if (!canCreate) throw ApiError.forbidden('Branch creation requires company or region administration scope');
    const companies = await query('SELECT company_id, currency, timezone FROM companies WHERE company_id = ? AND status = ? LIMIT 1', [companyId, 'Active']);
    if (!companies.length) throw ApiError.badRequest('Select an active company');
    await this._validateReferences(data, companyId);
    const countries = await query(
      'SELECT default_currency, default_timezone FROM countries WHERE country_id = ? LIMIT 1',
      [data.country_id]
    );
    const country = countries[0] || {};

    const payload = {
      ...data,
      company_id: companyId,
      location: data.location || data.city || null,
      currency: data.currency || country.default_currency || companies[0].currency || null,
      timezone: data.timezone || country.default_timezone || companies[0].timezone || null,
      working_days: normalizeWorkingDays(data.working_days),
    };
    const row = await super.create(payload);
    return this.getBranch(user, row.office_id);
  }

  async updateBranch(user, branchId, data) {
    const existing = await this._branchById(user, branchId);
    if (data.company_id !== undefined && Number(data.company_id) !== Number(existing.company_id)) {
      throw ApiError.conflict('A branch cannot be moved to another company; create a branch under the target company');
    }
    const companyId = Number(existing.company_id);
    const referenceData = { ...existing, ...data };
    await this._validateReferences(referenceData, companyId);
    const payload = this._pick(data);
    delete payload.company_id;
    if (payload.working_days !== undefined) payload.working_days = normalizeWorkingDays(payload.working_days);
    if (payload.location === '') payload.location = null;
    if (payload.city && !payload.location) payload.location = payload.city;
    if (Object.keys(payload).length) await super.update(branchId, payload);
    return this.getBranch(user, branchId);
  }

  async deleteBranch(user, branchId) {
    const branch = await this._branchById(user, branchId);
    const refs = await query(
      `SELECT
         (SELECT COUNT(*) FROM employees WHERE office_id = ?) AS employee_count,
         (SELECT COUNT(*) FROM employee_assignments WHERE branch_id = ?) AS assignment_count,
         (SELECT COUNT(*) FROM branch_departments WHERE branch_id = ?) AS department_count,
         (SELECT COUNT(*) FROM branch_settings WHERE branch_id = ?) AS setting_count,
         (SELECT COUNT(*) FROM companies WHERE headquarters_office_id = ?) AS headquarters_count`,
      [branchId, branchId, branchId, branchId, branchId]
    );
    const totals = Object.values(refs[0] || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    if (totals) {
      throw ApiError.conflict('This branch has dependent records. Deactivate it instead of deleting it.');
    }
    return super.remove(branchId);
  }

  async listBranchDepartments(user, branchId) {
    const branch = await this._branchById(user, branchId);
    return query(
      `SELECT d.department_id, d.department_name,
              (SELECT COUNT(*) FROM employees e
                WHERE e.office_id = ? AND e.department_id = d.department_id
                  AND e.company_id = ?) AS employee_count
         FROM branch_departments bd
         JOIN departments d ON d.department_id = bd.department_id AND d.company_id = bd.company_id
        WHERE bd.branch_id = ? AND bd.company_id = ?
        ORDER BY d.department_name`,
      [branch.office_id, branch.company_id, branch.office_id, branch.company_id]
    );
  }

  async setBranchDepartments(user, branchId, departmentIds) {
    const branch = await this._branchById(user, branchId);
    const uniqueIds = [...new Set(departmentIds.map(Number))];
    await withTransaction(async (connection) => {
      if (uniqueIds.length) {
        const placeholders = uniqueIds.map(() => '?').join(', ');
        const rows = (await connection.query(
          `SELECT department_id FROM departments
            WHERE company_id = ? AND department_id IN (${placeholders})`,
          [branch.company_id, ...uniqueIds]
        ))[0];
        if (rows.length !== uniqueIds.length) {
          throw ApiError.badRequest('Every selected department must belong to the branch company');
        }
      }
      const assigned = (await connection.query(
        'SELECT DISTINCT department_id FROM employee_assignments WHERE branch_id = ? AND company_id = ? AND is_current = 1 AND department_id IS NOT NULL',
        [branch.office_id, branch.company_id]
      ))[0].map((row) => Number(row.department_id));
      if (assigned.some((id) => !uniqueIds.includes(id))) {
        throw ApiError.conflict('A department with assigned employees cannot be removed from this branch');
      }
      await connection.query('DELETE FROM branch_departments WHERE branch_id = ? AND company_id = ?', [branch.office_id, branch.company_id]);
      if (uniqueIds.length) {
        const values = uniqueIds.map(() => '(?, ?, ?)').join(', ');
        await connection.query(
          `INSERT INTO branch_departments (company_id, branch_id, department_id) VALUES ${values}`,
          uniqueIds.flatMap((departmentId) => [branch.company_id, branch.office_id, departmentId])
        );
      }
    });
    return this.listBranchDepartments(user, branchId);
  }

  async assignEmployee(user, employeeId, { branch_id: branchId, department_id: departmentId }) {
    return withTransaction(async (connection) => {
      const employees = (await connection.query(
        `SELECT e.employee_id, e.company_id,
                COALESCE(e.company_id, d.company_id) AS effective_company_id,
                e.office_id, e.department_id, e.reporting_to, e.emp_joining_date
           FROM employees e
           LEFT JOIN departments d ON d.department_id = e.department_id
          WHERE e.employee_id = ? FOR UPDATE`,
        [employeeId]
      ))[0];
      if (!employees.length) throw ApiError.notFound('Employee not found');
      const employee = employees[0];
      await accessControlService.assertEmployeeScope(user, employeeId);

      const branches = (await connection.query(
        'SELECT office_id, company_id, region_id, status FROM offices WHERE office_id = ? LIMIT 1 FOR UPDATE',
        [branchId]
      ))[0];
      if (!branches.length || !branches[0].company_id) throw ApiError.notFound('Branch not found');
      const branch = branches[0];
      const branchAllowed = isPlatformAdmin(user) || hasScopeAccess(user, {
        branch_id: branchId,
        company_id: branch.company_id,
        region_id: branch.region_id,
      }) || (!user?.roleIds?.length && Number(user?.companyId) === Number(branch.company_id));
      if (!branchAllowed) {
        throw ApiError.forbidden('You can only assign employees to branches in your company');
      }
      if (String(branch.status || 'Active').toLowerCase() !== 'active') {
        throw ApiError.conflict('Employees cannot be assigned to an inactive branch');
      }
      if (!isPlatformAdmin(user) && Number(employee.effective_company_id) !== Number(branch.company_id)) {
        throw ApiError.forbidden('Cross-company employee transfers require a platform administrator');
      }
      if (Number(employee.effective_company_id) !== Number(branch.company_id)) {
        if (employee.reporting_to) {
          const managers = (await connection.query(
            `SELECT COALESCE(manager.company_id, dept.company_id) AS company_id
               FROM employees manager
               LEFT JOIN departments dept ON dept.department_id = manager.department_id
              WHERE manager.employee_id = ? LIMIT 1`,
            [employee.reporting_to]
          ))[0];
          if (Number(managers[0]?.company_id) !== Number(branch.company_id)) {
            throw ApiError.conflict('Update the employee reporting manager before transferring companies');
          }
        }
        const reports = (await connection.query(
          `SELECT report.employee_id
             FROM employees report
             LEFT JOIN departments dept ON dept.department_id = report.department_id
            WHERE report.reporting_to = ?
               AND (COALESCE(report.company_id, dept.company_id) IS NULL
                    OR COALESCE(report.company_id, dept.company_id) <> ?)`,
          [employeeId, branch.company_id]
        ))[0];
        if (reports.length) {
          throw ApiError.conflict('Transfer the employee direct reports before transferring companies');
        }
      }

      const departmentIdValue = departmentId == null || departmentId === '' ? null : Number(departmentId);
      if (departmentIdValue != null) {
        const departments = (await connection.query(
          'SELECT department_id FROM departments WHERE department_id = ? AND company_id = ? LIMIT 1',
          [departmentIdValue, branch.company_id]
        ))[0];
        if (!departments.length) throw ApiError.badRequest('The selected department does not belong to this company');
      }

      const currentRows = (await connection.query(
        'SELECT assignment_id, branch_id, department_id FROM employee_assignments WHERE employee_id = ? AND is_current = 1 FOR UPDATE',
        [employeeId]
      ))[0];
      const current = currentRows[0];
      if (current && Number(current.branch_id) === Number(branchId)
          && Number(current.department_id || 0) === Number(departmentIdValue || 0)) {
        return { employee_id: Number(employeeId), company_id: Number(branch.company_id), branch_id: Number(branchId), department_id: departmentIdValue };
      }
      if (current) {
        await connection.query(
          'UPDATE employee_assignments SET is_current = 0, end_date = CURRENT_DATE() WHERE assignment_id = ?',
          [current.assignment_id]
        );
      }
      if (departmentIdValue != null) {
        await connection.query(
          'INSERT IGNORE INTO branch_departments (company_id, branch_id, department_id) VALUES (?, ?, ?)',
          [branch.company_id, branchId, departmentIdValue]
        );
      }
      await connection.query(
        `INSERT INTO employee_assignments
          (employee_id, company_id, branch_id, department_id, start_date, is_current)
         VALUES (?, ?, ?, ?, CURRENT_DATE(), 1)`,
        [employeeId, branch.company_id, branchId, departmentIdValue]
      );
      await connection.query(
        'UPDATE employees SET company_id = ?, office_id = ?, department_id = ? WHERE employee_id = ?',
        [branch.company_id, branchId, departmentIdValue, employeeId]
      );
      return { employee_id: Number(employeeId), company_id: Number(branch.company_id), branch_id: Number(branchId), department_id: departmentIdValue };
    });
  }

  async listEmployeeAssignments(user, employeeId) {
    const companyId = resolveCompanyScope(user);
    const employees = await query(
      `SELECT COALESCE(e.company_id, d.company_id) AS company_id
         FROM employees e
         LEFT JOIN departments d ON d.department_id = e.department_id
        WHERE e.employee_id = ? LIMIT 1`,
      [employeeId]
    );
    if (!employees.length) throw ApiError.notFound('Employee not found');
    if (companyId !== null && Number(employees[0].company_id) !== companyId) {
      throw ApiError.notFound('Employee not found');
    }
    const conditions = ['a.employee_id = ?'];
    const params = [employeeId];
    if (companyId !== null) {
      conditions.push('a.company_id = ?');
      params.push(companyId);
    }
    return query(
      `SELECT a.assignment_id, a.employee_id, a.company_id, a.branch_id,
              o.office_name AS branch_name, a.department_id, d.department_name,
              a.start_date, a.end_date, a.is_current
         FROM employee_assignments a
         JOIN offices o ON o.office_id = a.branch_id
         LEFT JOIN departments d ON d.department_id = a.department_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.start_date DESC, a.assignment_id DESC`,
      params
    );
  }
}

module.exports = new OfficeService();
