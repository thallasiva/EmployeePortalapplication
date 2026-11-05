const companyService = require('../services/company.service');
const { createCrudController } = require('./base.controller');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const controller = createCrudController(companyService, { entityName: 'Company' });

controller.getModules = asyncHandler(async (req, res) => {
  const company = await companyService.findById(req.params.id);
  if (!company) throw ApiError.notFound('Company not found');
  const modules = await companyService.getModules(req.params.id);
  new ApiResponse(200, modules, 'Company modules fetched').send(res);
});

controller.updateModules = asyncHandler(async (req, res) => {
  const company = await companyService.findById(req.params.id);
  if (!company) throw ApiError.notFound('Company not found');
  const modules = await companyService.updateModules(req.params.id, req.body.modules, req.user.employeeId);
  new ApiResponse(200, modules, 'Company modules updated').send(res);
});

module.exports = controller;
