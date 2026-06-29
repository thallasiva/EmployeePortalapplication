const orgHierarchyService = require('../services/orgHierarchy.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await orgHierarchyService.getDashboardStats();
  new ApiResponse(200, stats, 'Dashboard stats fetched').send(res);
});

const getHierarchyTree = asyncHandler(async (req, res) => {
  const { department_id, status } = req.query;
  const tree = await orgHierarchyService.getHierarchyTree({ department_id, status });
  new ApiResponse(200, tree, 'Org hierarchy fetched').send(res);
});

const getUnassigned = asyncHandler(async (req, res) => {
  const rows = await orgHierarchyService.getUnassigned();
  new ApiResponse(200, rows, 'Unassigned employees fetched').send(res);
});

const getManagers = asyncHandler(async (req, res) => {
  const rows = await orgHierarchyService.getManagers();
  new ApiResponse(200, rows, 'Managers list fetched').send(res);
});

const getManagerDetails = asyncHandler(async (req, res) => {
  const mgr = await orgHierarchyService.getManagerDetails(req.params.id);
  if (!mgr) throw ApiError.notFound('Manager not found');
  new ApiResponse(200, mgr, 'Manager details fetched').send(res);
});

const searchEmployee = asyncHandler(async (req, res) => {
  const { q, department_id, designation_id, status } = req.query;
  if (!q || q.trim().length < 1) {
    return new ApiResponse(200, [], 'No query').send(res);
  }
  const rows = await orgHierarchyService.searchEmployee(q.trim(), { department_id, designation_id, status });
  new ApiResponse(200, rows, 'Search results').send(res);
});

const assignManager = asyncHandler(async (req, res) => {
  const { employee_id, new_manager_id, reason } = req.body;
  if (!employee_id || !new_manager_id) throw ApiError.badRequest('employee_id and new_manager_id are required');
  const result = await orgHierarchyService.assignManager(
    Number(employee_id), Number(new_manager_id), req.user.employeeId, reason
  );
  new ApiResponse(200, result, 'Reporting manager assigned').send(res);
});

const bulkAssign = asyncHandler(async (req, res) => {
  const { employee_ids, new_manager_id, reason } = req.body;
  if (!Array.isArray(employee_ids) || !employee_ids.length) throw ApiError.badRequest('employee_ids[] required');
  if (!new_manager_id) throw ApiError.badRequest('new_manager_id required');
  const result = await orgHierarchyService.bulkAssign(
    employee_ids.map(Number), Number(new_manager_id), req.user.employeeId, reason
  );
  new ApiResponse(200, result, 'Bulk assignment complete').send(res);
});

const transferManager = asyncHandler(async (req, res) => {
  const { old_manager_id, new_manager_id, reason } = req.body;
  if (!old_manager_id || !new_manager_id) throw ApiError.badRequest('old_manager_id and new_manager_id required');
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
  const rows = await orgHierarchyService.listDelegations({ status, employee_id });
  new ApiResponse(200, rows, 'Delegations fetched').send(res);
});

const cancelDelegation = asyncHandler(async (req, res) => {
  const { query } = require('../config/db');
  await query(`UPDATE workflow_delegates SET status = 'Cancelled' WHERE id = ?`, [req.params.id]);
  new ApiResponse(200, { cancelled: true }, 'Delegation cancelled').send(res);
});

const getHistory = asyncHandler(async (req, res) => {
  const { employee_id, manager_id, change_type, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const result = await orgHierarchyService.getHistory({ employee_id, manager_id, change_type, limit, offset });
  new ApiResponse(200, result.rows, 'Reporting history fetched', { total: result.total, page: Number(page), limit: Number(limit) }).send(res);
});

module.exports = {
  getDashboardStats, getHierarchyTree, getUnassigned, getManagers,
  getManagerDetails, searchEmployee, assignManager, bulkAssign,
  transferManager, createDelegation, listDelegations, cancelDelegation, getHistory,
};
