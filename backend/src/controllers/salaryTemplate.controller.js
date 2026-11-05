const service = require('../services/salaryTemplate.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const list   = asyncHandler(async (req, res) => {
  const data = await service.list(req.user.companyId);
  new ApiResponse(200, data, 'Salary templates fetched').send(res);
});
const getOne = asyncHandler(async (req, res) => {
  const data = await service.get(req.params.id, req.user.companyId);
  new ApiResponse(200, data, 'Salary template fetched').send(res);
});
const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body, req.user.companyId);
  new ApiResponse(201, data, 'Salary template created').send(res);
});
const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body, req.user.companyId);
  new ApiResponse(200, data, 'Salary template updated').send(res);
});
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user.companyId);
  new ApiResponse(200, null, 'Salary template deleted').send(res);
});
module.exports = { list, getOne, create, update, remove };
