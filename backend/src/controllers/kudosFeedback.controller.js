const service = require('../services/kudosFeedback.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === '1' && req.user.roleName === 'Admin';
  const rows = await service.listCategories({ type: req.query.type, includeInactive });
  new ApiResponse(200, rows, 'Categories fetched').send(res);
});

const createCategory = asyncHandler(async (req, res) => {
  const row = await service.createCategory(req.body);
  new ApiResponse(201, row, 'Category created').send(res);
});

const updateCategory = asyncHandler(async (req, res) => {
  const row = await service.updateCategory(req.params.id, req.body);
  new ApiResponse(200, row, 'Category updated').send(res);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await service.deleteCategory(req.params.id);
  new ApiResponse(200, null, 'Category deleted').send(res);
});

const listRecipients = asyncHandler(async (req, res) => {
  const rows = await service.listRecipients(req.user, { search: req.query.search, teamOnly: req.query.team === '1' });
  new ApiResponse(200, rows, 'Employees fetched').send(res);
});

const getSummary = asyncHandler(async (req, res) => {
  new ApiResponse(200, await service.getSummary(req.user), 'Summary fetched').send(res);
});

const listKudos = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 20, 100);
  const { rows, total } = await service.listKudos(req.user, {
    scope: req.query.scope,
    categoryId: req.query.category_id,
    departmentId: req.query.department_id,
    months: req.query.months,
    limit,
    offset
  });
  new ApiResponse(200, rows, 'Kudos fetched', buildMeta({ page, limit, total })).send(res);
});

const topRecognised = asyncHandler(async (req, res) => {
  const rows = await service.topRecognised({ months: req.query.months || 3, limit: 5 });
  new ApiResponse(200, rows, 'Top recognised fetched').send(res);
});

const giveKudos = asyncHandler(async (req, res) => {
  const result = await service.giveKudos(req.user, req.body);
  new ApiResponse(201, result, result.sent > 1 ? `Kudos sent to ${result.sent} people` : 'Kudos sent').send(res);
});

const listFeedback = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 20, 100);
  const { rows, total } = await service.listFeedback(req.user, {
    scope: req.query.scope,
    type: req.query.type,
    limit,
    offset
  });
  new ApiResponse(200, rows, 'Feedback fetched', buildMeta({ page, limit, total })).send(res);
});

const giveFeedback = asyncHandler(async (req, res) => {
  const result = await service.giveFeedback(req.user, req.body);
  new ApiResponse(201, result, 'Feedback sent').send(res);
});

const listRequests = asyncHandler(async (req, res) => {
  const rows = await service.listRequests(req.user, { scope: req.query.scope, status: req.query.status });
  new ApiResponse(200, rows, 'Feedback requests fetched').send(res);
});

const requestFeedback = asyncHandler(async (req, res) => {
  const result = await service.requestFeedback(req.user, req.body);
  new ApiResponse(201, result, `Feedback requested from ${result.sent} ${result.sent > 1 ? 'people' : 'person'}`).send(res);
});

const declineRequest = asyncHandler(async (req, res) => {
  await service.declineRequest(req.user, req.params.id);
  new ApiResponse(200, null, 'Request declined').send(res);
});

const getTeam = asyncHandler(async (req, res) => {
  new ApiResponse(200, await service.getTeam(req.user), 'Team fetched').send(res);
});

const getReport = asyncHandler(async (req, res) => {
  const report = await service.getReport(req.user, {
    months: req.query.months,
    departmentId: req.query.department_id,
    type: req.query.type
  });
  new ApiResponse(200, report, 'Report fetched').send(res);
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listRecipients,
  getSummary,
  listKudos,
  topRecognised,
  giveKudos,
  listFeedback,
  giveFeedback,
  listRequests,
  requestFeedback,
  declineRequest,
  getTeam,
  getReport
};
