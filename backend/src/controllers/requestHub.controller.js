const requestHubService = require('../services/requestHub.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status, request_type } = req.query;
  const { rows, total } = await requestHubService.list({ employee_id, status, request_type, limit, offset });
  new ApiResponse(200, rows, 'Requests fetched', buildMeta({ page, limit, total })).send(res);
});

const myRequests = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, request_type } = req.query;
  const { rows, total } = await requestHubService.list({ employee_id: req.user.employeeId, status, request_type, limit, offset });
  new ApiResponse(200, rows, 'Requests fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await requestHubService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Request not found');
  new ApiResponse(200, record, 'Request fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const record = await requestHubService.create({ ...req.body, employee_id: req.user.employeeId, status: 'Pending' });
  new ApiResponse(201, record, 'Request submitted').send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const record = await requestHubService.updateStatus(req.params.id, req.body.status, req.user.employeeId);
  new ApiResponse(200, record, 'Request status updated').send(res);
});

module.exports = { list, myRequests, getOne, create, updateStatus };
