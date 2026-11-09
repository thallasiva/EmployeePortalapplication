const reviewService = require('../services/review.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { assertCompanyEmployee } = require('../middleware/rbac');
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, reviewer_id, status, review_type_id } = req.query;
  const { rows, total } = await reviewService.list({
    employee_id, reviewer_id, status, review_type_id, limit, offset, companyId: req.user.companyId
  });
  new ApiResponse(200, rows, 'Reviews fetched', buildMeta({ page, limit, total })).send(res);
});
const myReviews = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status } = req.query;
  const { rows, total } = await reviewService.list({
    employee_id: req.user.employeeId, status, limit, offset, companyId: req.user.companyId
  });
  new ApiResponse(200, rows, 'Reviews fetched', buildMeta({ page, limit, total })).send(res);
});
const reviewsToGive = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status } = req.query;
  const { rows, total } = await reviewService.list({
    reviewer_id: req.user.employeeId, status, limit, offset, companyId: req.user.companyId
  });
  new ApiResponse(200, rows, 'Reviews fetched', buildMeta({ page, limit, total })).send(res);
});
const getOne = asyncHandler(async (req, res) => {
  const record = await reviewService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Review not found');
  await assertCompanyEmployee(req.user, record.employee_id);
  new ApiResponse(200, record, 'Review fetched').send(res);
});
const create = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.body.employee_id);
  if (req.body.reviewer_id != null) {
    await assertCompanyEmployee(req.user, req.body.reviewer_id);
  }
  const record = await reviewService.create({ ...req.body, status: 'Pending' });
  new ApiResponse(201, record, 'Review created').send(res);
});
const update = asyncHandler(async (req, res) => {
  const existing = await reviewService.getDetails(req.params.id);
  if (!existing) throw ApiError.notFound('Review not found');
  await assertCompanyEmployee(req.user, existing.employee_id);
  if (req.body.employee_id != null) {
    await assertCompanyEmployee(req.user, req.body.employee_id);
  }
  if (req.body.reviewer_id != null) {
    await assertCompanyEmployee(req.user, req.body.reviewer_id);
  }
  const record = await reviewService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Review updated').send(res);
});
const submit = asyncHandler(async (req, res) => {
  const existing = await reviewService.getDetails(req.params.id);
  if (!existing) throw ApiError.notFound('Review not found');
  await assertCompanyEmployee(req.user, existing.employee_id);
  const record = await reviewService.submit(req.params.id, req.body);
  new ApiResponse(200, record, 'Review submitted').send(res);
});
const complete = asyncHandler(async (req, res) => {
  const existing = await reviewService.getDetails(req.params.id);
  if (!existing) throw ApiError.notFound('Review not found');
  await assertCompanyEmployee(req.user, existing.employee_id);
  const record = await reviewService.complete(req.params.id);
  new ApiResponse(200, record, 'Review marked as completed').send(res);
});
const remove = asyncHandler(async (req, res) => {
  const existing = await reviewService.getDetails(req.params.id);
  if (!existing) throw ApiError.notFound('Review not found');
  await assertCompanyEmployee(req.user, existing.employee_id);
  await reviewService.remove(req.params.id);
  new ApiResponse(200, null, 'Review deleted').send(res);
});
module.exports = { list, myReviews, reviewsToGive, getOne, create, update, submit, complete, remove };
