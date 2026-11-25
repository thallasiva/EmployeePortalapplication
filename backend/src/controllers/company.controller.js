const companyService = require('../services/company.service');
const { createCrudController } = require('./base.controller');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { resolveCompanyScope, isPlatformAdmin } = require('../utils/companyScope');
const { assertCompanyAccess } = require('../middleware/rbac');
const controller = createCrudController(companyService, { entityName: 'Company' });

controller.list = asyncHandler(async (req, res) => {
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const rows = companyId === null
    ? await companyService.findAll()
    : await companyService.findAll({ where: 'company_id = ?', params: [companyId] });
  new ApiResponse(200, rows, 'Company list fetched').send(res);
});

controller.getOne = asyncHandler(async (req, res) => {
  await assertCompanyAccess(req.user, req.params.id);
  const company = await companyService.findById(req.params.id);
  new ApiResponse(200, company, 'Company fetched').send(res);
});

controller.create = asyncHandler(async (req, res) => {
  if (!isPlatformAdmin(req.user)) {
    throw ApiError.forbidden('Only a platform administrator can create a company');
  }
  const company = await companyService.create(req.body);
  new ApiResponse(201, company, 'Company created').send(res);
});

controller.update = asyncHandler(async (req, res) => {
  await assertCompanyAccess(req.user, req.params.id);
  const company = await companyService.update(req.params.id, req.body);
  new ApiResponse(200, company, 'Company updated').send(res);
});

controller.remove = asyncHandler(async (req, res) => {
  await assertCompanyAccess(req.user, req.params.id);
  const company = await companyService.update(req.params.id, { status: 'Inactive' });
  new ApiResponse(200, company, 'Company deactivated; historical records were retained').send(res);
});

controller.getModules = asyncHandler(async (req, res) => {
  await assertCompanyAccess(req.user, req.params.id);
  const modules = await companyService.getModules(req.params.id);
  new ApiResponse(200, modules, 'Company modules fetched').send(res);
});

controller.updateModules = asyncHandler(async (req, res) => {
  await assertCompanyAccess(req.user, req.params.id);
  const modules = await companyService.updateModules(req.params.id, req.body.modules, req.user.employeeId);
  new ApiResponse(200, modules, 'Company modules updated').send(res);
});

module.exports = controller;
