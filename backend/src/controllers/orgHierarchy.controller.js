const orgHierarchyService = require('../services/orgHierarchy.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const workflowDelegateService = require('../services/workflowDelegate.service');
const { query } = require('../config/db');
const { assertCompanyEmployee } = require('../middleware/rbac');
const { resolveCompanyScope } = require('../utils/companyScope');
const { hasScopeAccess } = require('../utils/accessScope');
const accessControlService = require('../services/accessControl.service');

async function getCompanyEmployeeIds(companyId, user) {
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
  if (!user?.enterpriseRbac && !user?.roleIds?.length && user?.roleName !== 'Reporting Manager') {
    return new Set(rows.map((row) => Number(row.employee_id)));
  }
  const reportingTreeIds = (
    user?.roleName === 'Reporting Manager'
    || user?.scopeAssignments?.some((scope) => scope.scope_type === 'TEAM' && scope.team_id == null)
  ) && user.employeeId
    ? await accessControlService.getReportingTreeIds(user.employeeId)
    : new Set();
  return new Set(rows.filter((row) => {
    row.employee_id = Number(row.employee_id);
    row.is_direct_report = Number(row.reporting_to) === Number(user.employeeId);
    return hasScopeAccess(user, row)
      || reportingTreeIds.has(row.employee_id)
      || row.employee_id === Number(user.employeeId);
  }).map((row) => Number(row.employee_id)));
}

async function filterRowsByCompany(rows, companyId, user) {
  if (companyId === null) return rows;
  const allowedIds = await getCompanyEmployeeIds(companyId, user);
  return rows.filter((row) => allowedIds.has(Number(row.employee_id)));
}

function filterTreeByCompany(nodes, allowedIds) {
  return nodes
    .filter((node) => allowedIds.has(Number(node.id)))
    .map((node) => {
      const children = filterTreeByCompany(node.children || [], allowedIds);
      return { ...node, children, direct_count: children.length };
    });
}

async function assertSameCompanyEmployees(user, employeeIds) {
  const ids = [...new Set(employeeIds.map(Number))];
  if (!ids.length || ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw ApiError.badRequest('Valid employee IDs are required');
  }
  for (const id of ids) await assertCompanyEmployee(user, id);
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await query(
    `SELECT DISTINCT COALESCE(e.company_id, d.company_id) AS company_id
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE e.employee_id IN (${placeholders})`,
    ids
  );
  if (rows.length !== 1 || rows[0].company_id == null) {
    throw ApiError.badRequest('Related employees must belong to the same company');
  }
}

const getDashboardStats = asyncHandler(async (req, res) => {
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  let stats;
  if (companyId === null) {
    stats = await orgHierarchyService.getDashboardStats();
  } else {
    const employeeIds = [...await getCompanyEmployeeIds(companyId, req.user)];
    if (!employeeIds.length) {
      stats = {
        total_employees: 0,
        without_manager: 0,
        total_managers: 0,
        managers_no_team: 0,
        delegated_workflows: 0,
      };
      return new ApiResponse(200, stats, 'Dashboard stats fetched').send(res);
    }
    const placeholders = employeeIds.map(() => '?').join(', ');
    const [employeeRows, managerRows, delegationRows] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total_employees,
                SUM(CASE WHEN e.reporting_to IS NULL THEN 1 ELSE 0 END) AS without_manager
           FROM employees e
          WHERE e.employee_id IN (${placeholders})`,
        employeeIds
      ),
      query(
        `SELECT COUNT(DISTINCT report.reporting_to) AS total_managers
           FROM employees report
           JOIN employees manager ON manager.employee_id = report.reporting_to
          WHERE report.employee_id IN (${placeholders})
            AND manager.employee_id IN (${placeholders})`,
        [...employeeIds, ...employeeIds]
      ),
      query(
        `SELECT COUNT(*) AS delegated_workflows
           FROM workflow_delegates d
          WHERE d.employee_id IN (${placeholders}) AND LOWER(d.status) = 'active'`,
        employeeIds
      ),
    ]);
    const totalEmployees = Number(employeeRows[0]?.total_employees || 0);
    const withoutManager = Number(employeeRows[0]?.without_manager || 0);
    const totalManagers = Number(managerRows[0]?.total_managers || 0);
    stats = {
      total_employees: totalEmployees,
      without_manager: withoutManager,
      total_managers: totalManagers,
      managers_no_team: Math.max(0, totalEmployees - totalManagers - withoutManager),
      delegated_workflows: Number(delegationRows[0]?.delegated_workflows || 0),
    };
  }
  new ApiResponse(200, stats, 'Dashboard stats fetched').send(res);
});
const getHierarchyTree = asyncHandler(async (req, res) => {
  const { department_id, status } = req.query;
  const tree = await orgHierarchyService.getHierarchyTree({ department_id, status });
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const result = companyId === null ? tree : filterTreeByCompany(tree, await getCompanyEmployeeIds(companyId, req.user));
  new ApiResponse(200, result, 'Org hierarchy fetched').send(res);
});
const getUnassigned = asyncHandler(async (req, res) => {
  const rows = await orgHierarchyService.getUnassigned();
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  new ApiResponse(200, await filterRowsByCompany(rows, companyId, req.user), 'Unassigned employees fetched').send(res);
});
const getManagers = asyncHandler(async (req, res) => {
  const rows = await orgHierarchyService.getManagers();
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  new ApiResponse(200, await filterRowsByCompany(rows, companyId, req.user), 'Managers list fetched').send(res);
});
const getManagerDetails = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const mgr = await orgHierarchyService.getManagerDetails(req.params.id);
  if (!mgr) throw ApiError.notFound('Manager not found');
  const companyId = resolveCompanyScope(req.user);
  if (companyId === null) return new ApiResponse(200, mgr, 'Manager details fetched').send(res);
  const allowedIds = await getCompanyEmployeeIds(companyId, req.user);
  const result = {
    ...mgr,
    direct_reports: (mgr.direct_reports || []).filter((row) => allowedIds.has(Number(row.employee_id))),
    indirect_reports: (mgr.indirect_reports || []).filter((row) => allowedIds.has(Number(row.employee_id))),
  };
  result.total_team = result.direct_reports.length + result.indirect_reports.length;
  new ApiResponse(200, result, 'Manager details fetched').send(res);
});
const searchEmployee = asyncHandler(async (req, res) => {
  const { q, department_id, designation_id, status } = req.query;
  if (!q || q.trim().length < 1) {
    return new ApiResponse(200, [], 'No query').send(res);
  }
  const rows = await orgHierarchyService.searchEmployee(q.trim(), { department_id, designation_id, status });
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  new ApiResponse(200, await filterRowsByCompany(rows, companyId, req.user), 'Search results').send(res);
});
const assignManager = asyncHandler(async (req, res) => {
  const { employee_id, new_manager_id, reason } = req.body;
  if (!employee_id || !new_manager_id) throw ApiError.badRequest('employee_id and new_manager_id are required');
  await assertSameCompanyEmployees(req.user, [employee_id, new_manager_id]);
  const result = await orgHierarchyService.assignManager(
    Number(employee_id), Number(new_manager_id), req.user.employeeId, reason
  );
  new ApiResponse(200, result, 'Reporting manager assigned').send(res);
});
const bulkAssign = asyncHandler(async (req, res) => {
  const { employee_ids, new_manager_id, reason } = req.body;
  if (!Array.isArray(employee_ids) || !employee_ids.length) throw ApiError.badRequest('employee_ids[] required');
  if (!new_manager_id) throw ApiError.badRequest('new_manager_id required');
  await assertSameCompanyEmployees(req.user, [...employee_ids, new_manager_id]);
  const result = await orgHierarchyService.bulkAssign(
    employee_ids.map(Number), Number(new_manager_id), req.user.employeeId, reason
  );
  new ApiResponse(200, result, 'Bulk assignment complete').send(res);
});
const transferManager = asyncHandler(async (req, res) => {
  const { old_manager_id, new_manager_id, reason } = req.body;
  if (!old_manager_id || !new_manager_id) throw ApiError.badRequest('old_manager_id and new_manager_id required');
  await assertSameCompanyEmployees(req.user, [old_manager_id, new_manager_id]);
  const teamRows = await query('SELECT employee_id FROM employees WHERE reporting_to = ?', [old_manager_id]);
  if (teamRows.length) await assertSameCompanyEmployees(req.user, teamRows.map((row) => row.employee_id));
  const result = await orgHierarchyService.transferManager(
    Number(old_manager_id), Number(new_manager_id), req.user.employeeId, reason
  );
  new ApiResponse(200, result, `${result.transferred} employees transferred`).send(res);
});
const createDelegation = asyncHandler(async (req, res) => {
  const { employee_id, delegate_employee_id, module, from_date, to_date, reason } = req.body;
  if (!employee_id || !delegate_employee_id || !from_date || !to_date) {
    throw ApiError.badRequest('employee_id, delegate_employee_id, from_date, to_date required');
  }
  await assertSameCompanyEmployees(req.user, [employee_id, delegate_employee_id]);
  const result = await orgHierarchyService.createDelegation({
    employee_id: Number(employee_id),
    delegate_employee_id: Number(delegate_employee_id),
    module, from_date, to_date, reason,
    created_by: req.user.employeeId,
  });
  new ApiResponse(201, result, 'Delegation created').send(res);
});
const listDelegations = asyncHandler(async (req, res) => {
  const { status, employee_id } = req.query;
  if (employee_id) await assertCompanyEmployee(req.user, employee_id);
  const rows = await orgHierarchyService.listDelegations({ status, employee_id });
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  new ApiResponse(200, await filterRowsByCompany(rows, companyId, req.user), 'Delegations fetched').send(res);
});
const cancelDelegation = asyncHandler(async (req, res) => {
  const delegate = await workflowDelegateService.getDetails(req.params.id);
  if (!delegate) throw ApiError.notFound('Delegation not found');
  await assertCompanyEmployee(req.user, delegate.employee_id);
  await assertSameCompanyEmployees(req.user, [delegate.employee_id, delegate.delegate_employee_id]);
  await workflowDelegateService.cancel(req.params.id);
  new ApiResponse(200, { cancelled: true }, 'Delegation cancelled').send(res);
});
const getHistory = asyncHandler(async (req, res) => {
  const { employee_id, manager_id, change_type, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  if (employee_id) await assertCompanyEmployee(req.user, employee_id);
  if (manager_id) await assertCompanyEmployee(req.user, manager_id);
  const result = await orgHierarchyService.getHistory({ employee_id, manager_id, change_type, limit, offset });
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const rows = companyId === null
    ? result.rows
    : await filterRowsByCompany(result.rows, companyId, req.user);
  new ApiResponse(200, rows, 'Reporting history fetched', {
    total: companyId === null ? result.total : rows.length,
    page: Number(page),
    limit: Number(limit),
  }).send(res);
});
module.exports = {
  getDashboardStats, getHierarchyTree, getUnassigned, getManagers,
  getManagerDetails, searchEmployee, assignManager, bulkAssign,
  transferManager, createDelegation, listDelegations, cancelDelegation, getHistory,
};
