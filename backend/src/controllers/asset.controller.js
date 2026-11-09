'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const svc = require('../services/asset.service');

exports.list = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.list(req.user.companyId), 'Assets fetched').send(res);
});
exports.dashboard = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.dashboard(req.user.companyId), 'Asset dashboard fetched').send(res);
});
exports.create = asyncHandler(async (req, res) => {
  new ApiResponse(201, await svc.create(req.body, req.user.companyId, req.user.employeeId), 'Asset created').send(res);
});
exports.assign = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.assign(Number(req.params.id), Number(req.body.employee_id), req.user.companyId, req.user.employeeId), 'Asset assigned').send(res);
});
exports.returnAsset = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.returnAsset(Number(req.params.id), req.body.return_condition, req.user.companyId, req.user.employeeId), 'Asset returned').send(res);
});
exports.setStatus = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.setStatus(Number(req.params.id), req.body.status, req.user.companyId), 'Asset status updated').send(res);
});
exports.mine = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.listMine(req.user.employeeId, req.user.companyId), 'My assets fetched').send(res);
});
exports.categories = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.categories(req.user.companyId, req.query.include_inactive !== 'false'), 'Asset categories fetched').send(res);
});
exports.saveCategory = asyncHandler(async (req, res) => {
  const category = await svc.saveCategory(req.params.id || null, req.body, req.user.companyId);
  new ApiResponse(req.params.id ? 200 : 201, category, 'Asset category saved').send(res);
});
exports.allocations = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.allocations(req.user.companyId, {
    employeeId: req.query.employee_id,
    categoryId: req.query.category_id,
    search: req.query.search,
  }), 'Asset allocations fetched').send(res);
});
exports.returns = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.returns(req.user.companyId), 'Asset returns fetched').send(res);
});
exports.requests = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.requests(req.user.companyId), 'Asset requests fetched').send(res);
});
exports.myRequests = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.requests(req.user.companyId, req.user.employeeId), 'My asset requests fetched').send(res);
});
exports.createRequest = asyncHandler(async (req, res) => {
  new ApiResponse(201, await svc.createRequest(req.body, req.user.companyId, req.user.employeeId), 'Asset request submitted').send(res);
});
exports.reviewRequest = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.reviewRequest(
    Number(req.params.id), req.body.decision, req.body.review_notes,
    req.user.companyId, req.user.employeeId
  ), 'Asset request reviewed').send(res);
});
exports.fulfillRequest = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.fulfillRequest(
    Number(req.params.id), Number(req.body.asset_id), req.user.companyId, req.user.employeeId
  ), 'Asset request fulfilled').send(res);
});
exports.maintenance = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.maintenance(req.user.companyId), 'Maintenance records fetched').send(res);
});
exports.createMaintenance = asyncHandler(async (req, res) => {
  const rows = await svc.createMaintenance(req.body, req.user.companyId, req.user.employeeId);
  new ApiResponse(201, rows, 'Maintenance request created').send(res);
});
exports.updateMaintenance = asyncHandler(async (req, res) => {
  const rows = await svc.updateMaintenance(
    Number(req.params.id), req.body.status, req.body.resolution_notes,
    req.user.companyId, req.user.employeeId
  );
  new ApiResponse(200, rows, 'Maintenance record updated').send(res);
});
exports.transfer = asyncHandler(async (req, res) => {
  const rows = await svc.transfer(
    Number(req.params.assetId), Number(req.body.to_employee_id), req.body.remarks,
    req.user.companyId, req.user.employeeId
  );
  new ApiResponse(200, rows, 'Asset transferred').send(res);
});
exports.transfers = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.transfers(req.user.companyId), 'Asset transfers fetched').send(res);
});
exports.report = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.report(req.user.companyId, {
    type: req.query.type,
    categoryId: req.query.category_id,
    status: req.query.status,
    fromDate: req.query.from_date,
    toDate: req.query.to_date,
  }), 'Asset report generated').send(res);
});
