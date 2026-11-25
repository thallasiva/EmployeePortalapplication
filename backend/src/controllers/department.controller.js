const departmentService = require('../services/department.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../config/db');
const { getPagination, buildMeta } = require('../utils/pagination');
const { resolveCompanyScope } = require('../utils/companyScope');
const accessControlService = require('../services/accessControl.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const scoped = companyId !== null;
  let rows = await departmentService.findAll({
    where: scoped ? 'company_id = ?' : '1 = 1',
    params: scoped ? [companyId] : [],
    orderBy: 'department_name ASC',
  });
  if (scoped && req.user.roleIds?.length) {
    const allowedIds = new Set(await accessControlService.getAllowedDepartmentIds(req.user, companyId));
    rows = rows.filter((row) => allowedIds.has(Number(row.department_id)));
  }
  const total = rows.length;
  new ApiResponse(200, rows.slice(offset, offset + limit), 'Department list fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const row = await departmentService.findById(req.params.id);
  if (!row) throw ApiError.notFound('Department not found');
  await accessControlService.assertDepartmentScope(req.user, row.department_id);
  new ApiResponse(200, row, 'Department fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const companyId = resolveCompanyScope(req.user, req.body.company_id);
  if (companyId === null) throw ApiError.badRequest('company_id is required');
  await accessControlService.assertCompanyScope(req.user, companyId);
  const row = await departmentService.create({ ...req.body, company_id: companyId });
  new ApiResponse(201, row, 'Department created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const existing = await departmentService.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Department not found');
  await accessControlService.assertDepartmentScope(req.user, existing.department_id);
  const payload = { ...req.body };
  delete payload.company_id;
  const row = await departmentService.update(req.params.id, payload);
  new ApiResponse(200, row, 'Department updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const existing = await departmentService.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Department not found');
  await accessControlService.assertDepartmentScope(req.user, existing.department_id);
  const refs = await query(
    `SELECT
       (SELECT COUNT(*) FROM employees WHERE department_id = ?) AS employee_count,
       (SELECT COUNT(*) FROM branch_departments WHERE department_id = ?) AS branch_count`,
    [req.params.id, req.params.id]
  );
  if (Object.values(refs[0] || {}).some((count) => Number(count) > 0)) {
    throw ApiError.conflict('This department has dependent records and cannot be deleted');
  }
  await departmentService.remove(req.params.id);
  new ApiResponse(200, null, 'Department deleted').send(res);
});

module.exports = { list, getOne, create, update, remove };
