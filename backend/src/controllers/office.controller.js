const officeService = require('../services/office.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await officeService.listBranches(req.user, req.query);
  new ApiResponse(200, result.rows, 'Branch list fetched', {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / result.limit),
  }).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const branch = await officeService.getBranch(req.user, req.params.id);
  new ApiResponse(200, branch, 'Branch fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const branch = await officeService.createBranch(req.user, req.body);
  new ApiResponse(201, branch, 'Branch created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const branch = await officeService.updateBranch(req.user, req.params.id, req.body);
  new ApiResponse(200, branch, 'Branch updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await officeService.deleteBranch(req.user, req.params.id);
  new ApiResponse(200, null, 'Branch deleted').send(res);
});

const listDepartments = asyncHandler(async (req, res) => {
  const rows = await officeService.listBranchDepartments(req.user, req.params.id);
  new ApiResponse(200, rows, 'Branch departments fetched').send(res);
});

const setDepartments = asyncHandler(async (req, res) => {
  const rows = await officeService.setBranchDepartments(req.user, req.params.id, req.body.department_ids);
  new ApiResponse(200, rows, 'Branch departments updated').send(res);
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  listDepartments,
  setDepartments,
};
