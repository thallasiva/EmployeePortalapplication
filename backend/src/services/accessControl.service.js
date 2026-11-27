const { query, withTransaction, callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { isGlobalAccess, hasScopeAccess } = require('../utils/accessScope');
const RECRUITMENT_VIEW_ROLES = new Set([
  'ADMIN',
  'COMPANYADMIN',
  'HRHEAD',
  'HRMANAGER',
  'RECRUITMENTHEAD',
  'RECRUITER',
  'RECRUITERTEAMLEAD',
  'SUPERADMIN',
]);
const RECRUITMENT_EDIT_ROLES = new Set([
  'ADMIN',
  'COMPANYADMIN',
  'HRHEAD',
  'HRMANAGER',
  'RECRUITMENTHEAD',
  'RECRUITER',
  'RECRUITERTEAMLEAD',
  'SUPERADMIN',
]);
const COMPANY_ADMIN_VIEW_MODULES = new Set(['attendance', 'employees']);

function isSuperAdmin(user) {
  if (Array.isArray(user?.roleKeys)) return user.roleKeys.includes('SUPER_ADMIN');
  if (Array.isArray(user?.roles)) return user.roles.some((role) => role.roleKey === 'SUPER_ADMIN');
  return Number(user?.roleId) === 1;
}

function mapUserAccess(user, assignments, managerRows) {
  const byAssignment = new Map();
  for (const row of assignments) {
    if (Number(row.is_active) !== 1) continue;
    let assignment = byAssignment.get(Number(row.user_role_id));
    if (!assignment) {
      assignment = {
        userRoleId: Number(row.user_role_id),
        roleId: Number(row.role_id),
        roleKey: row.role_key,
        roleName: row.role_name,
        scopes: [],
      };
      byAssignment.set(assignment.userRoleId, assignment);
    }
    if (row.scope_type) {
      assignment.scopes.push({
        scope_type: row.scope_type,
        company_id: row.scope_company_id,
        region_id: row.region_id,
        branch_id: row.branch_id,
        department_id: row.department_id,
        team_id: row.team_id,
        resource_type: row.resource_type,
        resource_id: row.resource_id,
      });
    }
  }
  const roleAssignments = [...byAssignment.values()];
  const scopeAssignments = roleAssignments.flatMap((assignment) => assignment.scopes);
  return {
    userId: Number(user.user_id),
    employeeId: user.employee_id == null ? null : Number(user.employee_id),
    roleId: Number(user.role_id),
    roleName: user.role_name || 'Employee',
    companyId: user.company_id == null ? null : Number(user.company_id),
    roles: roleAssignments,
    roleKeys: [...new Set(roleAssignments.map((role) => role.roleKey).filter(Boolean))],
    roleIds: [...new Set(roleAssignments.map((role) => role.roleId))],
    scopeAssignments,
    enterpriseRbac: assignments.length > 0,
    managesEmployees: managerRows.length > 0,
  };
}

async function getUserAccess(userId) {
  const rows = await query(
    `SELECT u.user_id, u.employee_id, u.role_id, u.status, r.role_name,
            COALESCE(e.company_id, d.company_id) AS company_id
       FROM users u
       LEFT JOIN roles r ON r.role_id = u.role_id
       LEFT JOIN employees e ON e.employee_id = u.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE u.user_id = ?
      LIMIT 1`,
    [userId]
  );
  const user = rows[0];
  if (!user || String(user.status).toLowerCase() !== 'active') return null;
  const managerRows = user.employee_id == null ? [] : await query(
    'SELECT 1 FROM employees WHERE reporting_to = ? LIMIT 1',
    [user.employee_id]
  );

  const assignments = await query(
    `SELECT ur.user_role_id, ur.role_id, r.role_key, r.role_name,
            ur.is_active,
            urs.scope_type, urs.company_id AS scope_company_id,
            urs.region_id, urs.branch_id, urs.department_id, urs.team_id,
            urs.resource_type, urs.resource_id
       FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       LEFT JOIN user_role_scopes urs ON urs.user_role_id = ur.user_role_id
      WHERE ur.user_id = ?
      ORDER BY ur.user_role_id, urs.user_role_scope_id`,
    [userId]
  );
  return mapUserAccess(user, assignments, managerRows);
}

async function ensureDefaultEmployeeAccess(employeeId) {
  const rows = await query(
    'SELECT user_id, role_id FROM users WHERE employee_id = ? LIMIT 1',
    [employeeId]
  );
  const account = rows[0];
  if (!account) return null;

  let roleId = account.role_id;
  if (Number(roleId) === 1) {
    const employeeRoles = await query(
      "SELECT role_id FROM roles WHERE role_key = 'EMPLOYEE' LIMIT 1"
    );
    if (!employeeRoles.length) {
      throw ApiError.conflict('Employee role is not configured');
    }
    roleId = employeeRoles[0].role_id;
  }
  if (roleId == null) throw ApiError.conflict('A default role is required for employee access');

  await query(
    `INSERT INTO user_roles (user_id, role_id, is_active)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP`,
    [account.user_id, roleId]
  );
  const assignmentRows = await query(
    'SELECT user_role_id FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1',
    [account.user_id, roleId]
  );
  if (!assignmentRows.length) throw ApiError.conflict('Employee role assignment could not be created');
  const scopes = await query(
    'SELECT user_role_scope_id FROM user_role_scopes WHERE user_role_id = ? LIMIT 1',
    [assignmentRows[0].user_role_id]
  );
  if (!scopes.length) {
    await query(
      "INSERT INTO user_role_scopes (user_role_id, scope_type) VALUES (?, 'SELF')",
      [assignmentRows[0].user_role_id]
    );
  }
  return getUserAccess(account.user_id);
}

async function canPermission(user, module, action) {
  if (!user) return false;
  if ((user.roleKeys || []).includes('SUPER_ADMIN')) return true;
  const assignedRoles = [
    user.roleName,
    ...(Array.isArray(user.roleKeys) ? user.roleKeys : []),
    ...(Array.isArray(user.roles) ? user.roles.flatMap((role) => [role.roleName, role.roleKey]) : []),
  ].map((role) => String(role || '').toUpperCase().replace(/[^A-Z0-9]/g, ''));
  if (
    module === 'recruitment'
    && action === 'view'
    && assignedRoles.some((role) => RECRUITMENT_VIEW_ROLES.has(role))
  ) return true;
  if (
    module === 'recruitment'
    && action === 'edit'
    && assignedRoles.some((role) => RECRUITMENT_EDIT_ROLES.has(role))
  ) return true;
  if (
    action === 'view'
    && assignedRoles.includes('COMPANYADMIN')
    && COMPANY_ADMIN_VIEW_MODULES.has(module)
  ) return true;
  const roleIds = user.roleIds || [];
  if (!roleIds.length) {
    if (user.enterpriseRbac) return false;
    if (!user.enterpriseRbac && Number(user.roleId) === 1) return true;
    const legacy = await callProcedure('sp_check_role_permission(?, ?, ?)', [user.roleId, module, action]);
    return Boolean((legacy[0] ?? [])[0]?.allowed);
  }
  for (const roleId of roleIds) {
    const results = await callProcedure('sp_check_role_permission(?, ?, ?)', [roleId, module, action]);
    if ((results[0] ?? [])[0]?.allowed) return true;
  }
  return false;
}

async function assertCompanyScope(user, companyId) {
  const rows = await query('SELECT company_id FROM companies WHERE company_id = ? LIMIT 1', [companyId]);
  if (!rows.length) throw ApiError.notFound('Company not found');
  if (isGlobalAccess(user)) return rows[0];

  const target = { company_id: Number(companyId) };
  if (hasScopeAccess(user, target)) return rows[0];
  if (!user?.enterpriseRbac && !user?.roleIds?.length && Number(user?.companyId) === Number(companyId)) return rows[0];
  throw ApiError.notFound('Company not found');
}

async function assertBranchScope(user, branchId) {
  const rows = await query(
    `SELECT office_id AS branch_id, company_id, region_id
       FROM offices WHERE office_id = ? LIMIT 1`,
    [branchId]
  );
  const branch = rows[0];
  if (!branch) throw ApiError.notFound('Branch not found');
  if (isGlobalAccess(user) || hasScopeAccess(user, branch)) return branch;
  if (!user?.enterpriseRbac && !user?.roleIds?.length && Number(user?.companyId) === Number(branch.company_id)) return branch;
  throw ApiError.notFound('Branch not found');
}

async function assertDepartmentScope(user, departmentId) {
  const rows = await query(
    'SELECT department_id, company_id FROM departments WHERE department_id = ? LIMIT 1',
    [departmentId]
  );
  const department = rows[0];
  if (!department) throw ApiError.notFound('Department not found');
  if (isGlobalAccess(user) || hasScopeAccess(user, department)) return department;
  if (!user?.enterpriseRbac && !user?.roleIds?.length && Number(user?.companyId) === Number(department.company_id)) return department;
  const branches = (user?.scopeAssignments || [])
    .filter((scope) => scope.scope_type === 'BRANCH' && scope.branch_id != null)
    .map((scope) => Number(scope.branch_id));
  if (branches.length) {
    const placeholders = branches.map(() => '?').join(', ');
    const assignments = await query(
      `SELECT 1 FROM branch_departments
        WHERE department_id = ? AND company_id = ?
          AND branch_id IN (${placeholders}) LIMIT 1`,
      [departmentId, department.company_id, ...branches]
    );
    if (assignments.length) return department;
  }
  const regionIds = (user?.scopeAssignments || [])
    .filter((scope) => scope.scope_type === 'REGION' && scope.region_id != null)
    .map((scope) => Number(scope.region_id));
  if (regionIds.length) {
    const placeholders = regionIds.map(() => '?').join(', ');
    const assignments = await query(
      `SELECT 1 FROM branch_departments bd
        JOIN offices o ON o.office_id = bd.branch_id
        WHERE bd.department_id = ? AND bd.company_id = ?
          AND o.region_id IN (${placeholders}) LIMIT 1`,
      [departmentId, department.company_id, ...regionIds]
    );
    if (assignments.length) return department;
  }
  const teamIds = (user?.scopeAssignments || [])
    .filter((scope) => scope.scope_type === 'TEAM' && scope.team_id != null)
    .map((scope) => Number(scope.team_id));
  if (teamIds.length) {
    const placeholders = teamIds.map(() => '?').join(', ');
    const teamDepartments = await query(
      `SELECT 1 FROM employees e
        WHERE e.department_id = ? AND e.team_id IN (${placeholders}) LIMIT 1`,
      [departmentId, ...teamIds]
    );
    if (teamDepartments.length) return department;
  }
  throw ApiError.notFound('Department not found');
}

async function getAllowedDepartmentIds(user, companyId) {
  const departments = await query(
    'SELECT department_id, company_id FROM departments WHERE company_id = ?',
    [companyId]
  );
  if (isGlobalAccess(user) || (!user?.enterpriseRbac && !user?.roleIds?.length && Number(user?.companyId) === Number(companyId))) {
    return departments.map((department) => Number(department.department_id));
  }
  const allowed = new Set();
  for (const department of departments) {
    if (hasScopeAccess(user, department)) {
      allowed.add(Number(department.department_id));
      continue;
    }
    try {
      await assertDepartmentScope(user, department.department_id);
      allowed.add(Number(department.department_id));
    } catch (error) {
      if (error?.statusCode !== 404) throw error;
    }
  }
  return [...allowed];
}

async function getAllowedEmployeeIds(user, companyId) {
  const rows = await query(
    `SELECT e.employee_id, COALESCE(e.company_id, d.company_id) AS company_id,
            e.office_id AS branch_id, o.region_id, e.department_id,
            e.team_id, e.reporting_to
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN offices o ON o.office_id = e.office_id
      WHERE COALESCE(e.company_id, d.company_id) = ?`,
    [companyId]
  );
  if (isGlobalAccess(user) || (!user?.enterpriseRbac && !user?.roleIds?.length)) {
    return new Set(rows.map((row) => Number(row.employee_id)));
  }
  const reportingTreeIds = (
    user?.roleName === 'Reporting Manager'
    || user?.scopeAssignments?.some((scope) => scope.scope_type === 'TEAM' && scope.team_id == null)
  ) && user.employeeId
    ? await getReportingTreeIds(user.employeeId)
    : new Set();
  return new Set(rows.filter((row) => {
    row.employee_id = Number(row.employee_id);
    row.is_direct_report = Number(row.reporting_to) === Number(user.employeeId);
    return hasScopeAccess(user, row)
      || reportingTreeIds.has(row.employee_id)
      || row.employee_id === Number(user.employeeId);
  }).map((row) => Number(row.employee_id)));
}

async function getReportingTreeIds(managerId) {
  const rows = await query(
    `WITH RECURSIVE reporting_tree AS (
       SELECT employee_id,
              CAST(CONCAT(',', employee_id, ',') AS CHAR(4096)) AS path
         FROM employees
        WHERE reporting_to = ?
       UNION ALL
       SELECT child.employee_id,
              CONCAT(parent.path, child.employee_id, ',')
         FROM employees child
         JOIN reporting_tree parent ON child.reporting_to = parent.employee_id
        WHERE parent.path NOT LIKE CONCAT('%,', child.employee_id, ',%')
     )
     SELECT DISTINCT employee_id FROM reporting_tree`,
    [managerId]
  );
  return new Set(rows.map((row) => Number(row.employee_id)));
}

async function assertEmployeeScope(user, employeeId) {
  if (!employeeId) throw ApiError.badRequest('Employee ID is required');
  const rows = await query(
    `SELECT e.employee_id, COALESCE(e.company_id, d.company_id) AS company_id,
            e.office_id AS branch_id, e.department_id, e.team_id,
            e.reporting_to, o.region_id
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN offices o ON o.office_id = e.office_id
      WHERE e.employee_id = ? LIMIT 1`,
    [employeeId]
  );
  const employee = rows[0];
  if (!employee) throw ApiError.notFound('Employee not found');
  employee.is_direct_report = Number(employee.reporting_to) === Number(user?.employeeId);
  if (isGlobalAccess(user) || hasScopeAccess(user, employee)) return employee;
  if (Number(user?.employeeId) === Number(employeeId)) return employee;
  const teamScope = (user?.scopeAssignments || []).some((scope) => scope.scope_type === 'TEAM' && scope.team_id == null);
  const legacyManager = !user?.roleIds?.length && user?.roleName === 'Reporting Manager';
  if ((teamScope || legacyManager) && user?.employeeId) {
    const reportIds = await getReportingTreeIds(user.employeeId);
    if (reportIds.has(Number(employeeId))) return employee;
  }
  if (!user?.enterpriseRbac && !user?.roleIds?.length && Number(user?.companyId) === Number(employee.company_id)) return employee;
  throw ApiError.notFound('Employee not found');
}

async function assertRoleAssignmentAllowed(actor, targetUserId, roleId, scopes = []) {
  const targetRows = await query(
    `SELECT u.user_id, u.employee_id, COALESCE(e.company_id, d.company_id) AS company_id
       FROM users u
       LEFT JOIN employees e ON e.employee_id = u.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE u.user_id = ? LIMIT 1`,
    [targetUserId]
  );
  if (!targetRows.length) throw ApiError.notFound('User not found');
  const roleRows = await query('SELECT role_id, role_key FROM roles WHERE role_id = ? LIMIT 1', [roleId]);
  if (!roleRows.length) throw ApiError.notFound('Role not found');
  const targetCompanyId = targetRows[0].company_id == null ? null : Number(targetRows[0].company_id);
  const global = isSuperAdmin(actor);
  if (roleRows[0].role_key === 'SUPER_ADMIN' && !global) {
    throw ApiError.forbidden('Only a Super Admin can assign the Super Admin role');
  }
  if (!global) {
    if (!targetCompanyId || !targetRows[0].employee_id) {
      throw ApiError.forbidden('You can only manage user access in your company');
    }
    await assertEmployeeScope(actor, targetRows[0].employee_id);
    if (scopes.some((scope) => scope.scope_type === 'GLOBAL')) {
      throw ApiError.forbidden('Only a Super Admin can grant global scope');
    }
    const companyAdmin = (actor.roleKeys || []).includes('COMPANY_ADMIN');
    const companyScopedAdminRole = ['COMPANY_ADMIN', 'REGIONAL_ADMIN', 'HR_HEAD'].includes(roleRows[0].role_key);
    if (
      ['COMPANY_ADMIN', 'REGIONAL_ADMIN', 'BRANCH_ADMIN', 'HR_HEAD', 'SUPER_ADMIN'].includes(roleRows[0].role_key)
      && !global
      && !(companyAdmin && roleRows[0].role_key === 'BRANCH_ADMIN')
      && (companyScopedAdminRole || roleRows[0].role_key === 'BRANCH_ADMIN')
    ) {
      throw ApiError.forbidden('Only a Super Admin can assign administrative roles');
    }
  }
  for (const scope of scopes) {
    if (scope.scope_type === 'GLOBAL') {
      if (!global) throw ApiError.forbidden('Only a Super Admin can grant global scope');
      continue;
    }
    if (scope.company_id && targetCompanyId && Number(scope.company_id) !== targetCompanyId) {
      throw ApiError.forbidden('Role scope must remain within the target user company');
    }
    if (scope.scope_type === 'COMPANY') {
      const companyRows = await query('SELECT company_id FROM companies WHERE company_id = ? LIMIT 1', [scope.company_id]);
      if (!companyRows.length) throw ApiError.badRequest('Invalid company scope');
      scope.company_id = Number(companyRows[0].company_id);
    }
    if (scope.scope_type === 'REGION') {
      const regionRows = await query('SELECT region_id FROM regions WHERE region_id = ? LIMIT 1', [scope.region_id]);
      if (!regionRows.length) throw ApiError.badRequest('Invalid region scope');
      if (targetCompanyId) {
        const branches = await query(
          'SELECT 1 FROM offices WHERE company_id = ? AND region_id = ? LIMIT 1',
          [targetCompanyId, scope.region_id]
        );
        if (!branches.length) throw ApiError.forbidden('Region scope must belong to the target user company');
        scope.company_id = targetCompanyId;
      }
    }
    if (scope.branch_id) {
      const branch = await assertBranchScope(actor, scope.branch_id);
      if (targetCompanyId && Number(branch.company_id) !== targetCompanyId) {
        throw ApiError.forbidden('Branch scope must belong to the target user company');
      }
      scope.company_id = Number(branch.company_id);
      scope.region_id = branch.region_id == null ? null : Number(branch.region_id);
    }
    if (scope.department_id) {
      const departments = await query('SELECT company_id FROM departments WHERE department_id = ? LIMIT 1', [scope.department_id]);
      if (!departments.length || Number(departments[0].company_id) !== targetCompanyId) {
        throw ApiError.forbidden('Department scope must belong to the target user company');
      }
      scope.company_id = Number(departments[0].company_id);
    }
    if (scope.team_id) {
      const teams = await query(
        `SELECT DISTINCT COALESCE(e.company_id, d.company_id) AS company_id
           FROM employees e
           LEFT JOIN departments d ON d.department_id = e.department_id
          WHERE e.team_id = ?`,
        [scope.team_id]
      );
      if (!teams.length || teams.some((team) => Number(team.company_id) !== targetCompanyId)) {
        throw ApiError.forbidden('Team scope must belong to the target user company');
      }
      scope.company_id = targetCompanyId;
    }
    if (scope.scope_type === 'ASSIGNED_RESOURCE') {
      if (!scope.resource_type || scope.resource_id == null) {
        throw ApiError.badRequest('Assigned-resource scope requires resource_type and resource_id');
      }
      scope.resource_type = String(scope.resource_type).trim().toUpperCase();
      if (!scope.company_id && targetCompanyId) scope.company_id = targetCompanyId;
    }
    if (!global && scope.scope_type !== 'SELF' && !hasScopeAccess(actor, {
      company_id: scope.company_id,
      region_id: scope.region_id,
      branch_id: scope.branch_id,
      department_id: scope.department_id,
      team_id: scope.team_id,
      resource_type: scope.resource_type,
      resource_id: scope.resource_id,
    })) {
      throw ApiError.forbidden('You cannot grant a scope you do not hold');
    }
  }
}

async function replaceUserRoles(actor, targetUserId, roleAssignments, auditContext = {}) {
  if (!Array.isArray(roleAssignments)) throw ApiError.badRequest('roles must be an array');
  for (const assignment of roleAssignments) {
    await assertRoleAssignmentAllowed(actor, targetUserId, assignment.roleId, assignment.scopes || []);
  }

  await withTransaction(async (conn) => {
    const [existing] = await conn.query(
      `SELECT ur.user_role_id, ur.role_id, r.role_key
         FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
        WHERE ur.user_id = ? AND ur.is_active = 1 FOR UPDATE`,
      [targetUserId]
    );
    const requestedIds = new Set(roleAssignments.map((item) => Number(item.roleId)));
    if (existing.some((role) => role.role_key === 'SUPER_ADMIN' && !requestedIds.has(Number(role.role_id)))) {
      const [admins] = await conn.query(
        `SELECT ur.user_id
           FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
          WHERE ur.is_active = 1 AND r.role_key = 'SUPER_ADMIN' FOR UPDATE`,
        []
      );
      if (admins.length <= 1) {
        throw ApiError.conflict('The last active Super Admin cannot be revoked');
      }
    }
    for (const current of existing) {
      if (!requestedIds.has(Number(current.role_id))) {
        await conn.query(
          'UPDATE user_roles SET is_active = 0, assigned_by = ? WHERE user_role_id = ?',
          [actor.userId, current.user_role_id]
        );
        await conn.query(
          `INSERT INTO access_audit_logs
            (actor_user_id, target_user_id, role_id, action, details, ip_address, user_agent)
           VALUES (?, ?, ?, 'ROLE_REVOKED', JSON_OBJECT('user_role_id', ?), ?, ?)`,
          [actor.userId, targetUserId, current.role_id, current.user_role_id, auditContext.ip || null, auditContext.userAgent || null]
        );
      }
    }
    for (const assignment of roleAssignments) {
      const roleId = Number(assignment.roleId);
      await conn.query(
        `INSERT INTO user_roles (user_id, role_id, is_active, assigned_by)
         VALUES (?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE is_active = 1, assigned_by = VALUES(assigned_by), updated_at = CURRENT_TIMESTAMP`,
        [targetUserId, roleId, actor.userId]
      );
      const rows = await conn.query(
        'SELECT user_role_id FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1',
        [targetUserId, roleId]
      );
      const userRoleId = rows[0][0]?.user_role_id;
      const [oldScopes] = await conn.query('SELECT scope_type, company_id, region_id, branch_id, department_id, team_id, resource_type, resource_id FROM user_role_scopes WHERE user_role_id = ?', [userRoleId]);
      await conn.query('DELETE FROM user_role_scopes WHERE user_role_id = ?', [userRoleId]);
      for (const scope of assignment.scopes || []) {
        await conn.query(
          `INSERT INTO user_role_scopes
            (user_role_id, scope_type, company_id, region_id, branch_id, department_id, team_id, resource_type, resource_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userRoleId, scope.scope_type, scope.company_id || null, scope.region_id || null,
            scope.branch_id || null, scope.department_id || null, scope.team_id || null,
            scope.resource_type || null, scope.resource_id == null ? null : String(scope.resource_id),
          ]
        );
      }
      await conn.query(
        `INSERT INTO access_audit_logs
          (actor_user_id, target_user_id, role_id, action, details, ip_address, user_agent)
         VALUES (?, ?, ?, 'ROLE_ASSIGNMENT_UPDATED', JSON_OBJECT('user_role_id', ?, 'scope_count', ?, 'previous_scope_count', ?, 'scopes', ?), ?, ?)`,
        [actor.userId, targetUserId, roleId, userRoleId, (assignment.scopes || []).length, oldScopes.length, JSON.stringify(assignment.scopes || []), auditContext.ip || null, auditContext.userAgent || null]
      );
    }
  });
  return getUserAccess(targetUserId);
}

async function listUsers(user) {
  const rows = await query(
    `SELECT u.user_id, u.employee_id, u.email, u.status, u.role_id,
            e.first_name, e.last_name, e.emp_code,
            COALESCE(e.company_id, d.company_id) AS company_id,
            e.office_id AS branch_id, o.region_id, e.department_id,
            e.team_id, e.reporting_to
       FROM users u
       LEFT JOIN employees e ON e.employee_id = u.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN offices o ON o.office_id = e.office_id
      ORDER BY e.first_name, e.last_name, u.email`
  );
  if (isGlobalAccess(user)) return rows;
  return rows.filter((row) => {
    const target = {
      employee_id: row.employee_id,
      company_id: row.company_id,
      branch_id: row.branch_id,
      region_id: row.region_id,
      department_id: row.department_id,
      team_id: row.team_id,
      is_direct_report: Number(row.reporting_to) === Number(user.employeeId),
    };
    if (hasScopeAccess(user, target)) return true;
    return !user?.enterpriseRbac && !user?.roleIds?.length
      && Number(row.company_id) === Number(user.companyId);
  });
}

async function listRoles() {
  return query('SELECT role_id, role_name, role_key, description FROM roles ORDER BY role_name');
}

async function listPermissions() {
  const results = await callProcedure('sp_list_permissions()');
  return results[0] ?? [];
}

async function getRolePermissions(roleId) {
  const roleRows = await query('SELECT role_id, role_name, role_key FROM roles WHERE role_id = ? LIMIT 1', [roleId]);
  if (!roleRows.length) throw ApiError.notFound('Role not found');
  const results = await callProcedure('sp_get_role_permissions(?)', [roleId]);
  return { role: roleRows[0], permissions: results[0] ?? [] };
}

async function getEffectivePermissions(user) {
  const roleIds = user?.roleIds?.length ? user.roleIds : [user?.roleId].filter(Boolean);
  const effective = new Map();
  for (const roleId of roleIds) {
    const results = await callProcedure('sp_get_role_permissions(?)', [roleId]);
    for (const row of results[0] ?? []) {
      const key = `${row.module}:${row.action}`;
      const previous = effective.get(key);
      effective.set(key, {
        module: row.module,
        action: row.action,
        allowed: Number(row.allowed) === 1 || row.allowed === true || previous?.allowed === true,
      });
    }
  }
  return [...effective.values()];
}

async function updateRolePermissions(actor, roleId, updates, auditContext = {}) {
  const roleRows = await query('SELECT role_id, role_key FROM roles WHERE role_id = ? LIMIT 1', [roleId]);
  if (!roleRows.length) throw ApiError.notFound('Role not found');
  if (roleRows[0].role_key === 'SUPER_ADMIN' && !isSuperAdmin(actor)) {
    throw ApiError.forbidden('Only a Super Admin can edit Super Admin permissions');
  }
  await withTransaction(async (conn) => {
    for (const permission of updates) {
      await conn.query('CALL sp_upsert_role_permission(?, ?, ?, ?)', [
        roleId, permission.module, permission.action, permission.allowed ? 1 : 0,
      ]);
    }
    await conn.query(
      `INSERT INTO access_audit_logs
        (actor_user_id, role_id, action, details, ip_address, user_agent)
       VALUES (?, ?, 'ROLE_PERMISSIONS_UPDATED', JSON_OBJECT('permission_count', ?, 'permissions', ?), ?, ?)`,
      [actor.userId, roleId, updates.length, JSON.stringify(updates), auditContext.ip || null, auditContext.userAgent || null]
    );
  });
  return getRolePermissions(roleId);
}

async function listAuditLogs({ targetUserId, limit = 100, offset = 0 } = {}) {
  const clauses = [];
  const params = [];
  if (targetUserId) {
    clauses.push('l.target_user_id = ?');
    params.push(targetUserId);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return query(
    `SELECT l.access_audit_log_id, l.actor_user_id, actor.email AS actor_email,
            l.target_user_id, target.email AS target_email, l.role_id,
            r.role_name, l.action, l.scope_type, l.scope_id, l.details,
            l.ip_address, l.user_agent, l.created_at
       FROM access_audit_logs l
       LEFT JOIN users actor ON actor.user_id = l.actor_user_id
       LEFT JOIN users target ON target.user_id = l.target_user_id
       LEFT JOIN roles r ON r.role_id = l.role_id
       ${where}
      ORDER BY l.created_at DESC, l.access_audit_log_id DESC
      LIMIT ? OFFSET ?`,
    [...params, Math.min(500, Math.max(1, Number(limit) || 100)), Math.max(0, Number(offset) || 0)]
  );
}

module.exports = {
  getUserAccess,
  mapUserAccess,
  ensureDefaultEmployeeAccess,
  canPermission,
  assertCompanyScope,
  assertBranchScope,
  assertDepartmentScope,
  getAllowedDepartmentIds,
  getAllowedEmployeeIds,
  assertEmployeeScope,
  getReportingTreeIds,
  assertRoleAssignmentAllowed,
  replaceUserRoles,
  listUsers,
  listRoles,
  listPermissions,
  getRolePermissions,
  getEffectivePermissions,
  updateRolePermissions,
  listAuditLogs,
};
