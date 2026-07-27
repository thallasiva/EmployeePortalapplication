const service = require('../services/salaryTemplate.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const list   = asyncHandler(async (req, res) => {
  const data = await service.list();
  new ApiResponse(200, data, 'Salary templates fetched').send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await service.get(req.params.id);
  new ApiResponse(200, data, 'Salary template fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body);
  new ApiResponse(201, data, 'Salary template created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  new ApiResponse(200, data, 'Salary template updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  new ApiResponse(200, null, 'Salary template deleted').send(res);
});

module.exports = { list, getOne, create, update, remove };
