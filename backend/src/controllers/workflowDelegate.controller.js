const workflowDelegateService = require('../services/workflowDelegate.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status } = req.query;
  const { rows, total } = await workflowDelegateService.list({ employee_id, status, limit, offset });
  new ApiResponse(200, rows, 'Workflow delegations fetched', buildMeta({ page, limit, total })).send(res);
});

const myDelegations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await workflowDelegateService.list({ employee_id: req.user.employeeId, limit, offset });
  new ApiResponse(200, rows, 'Workflow delegations fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await workflowDelegateService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Delegation not found');
  new ApiResponse(200, record, 'Delegation fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const record = await workflowDelegateService.create({
    ...req.body,
    employee_id: req.body.employee_id || req.user.employeeId,
    status: 'Active',
  });
  new ApiResponse(201, record, 'Delegation created').send(res);
});

const cancel = asyncHandler(async (req, res) => {
  const exists = await workflowDelegateService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Delegation not found');
  const record = await workflowDelegateService.cancel(req.params.id);
  new ApiResponse(200, record, 'Delegation cancelled').send(res);
});

module.exports = { list, myDelegations, getOne, create, cancel };
