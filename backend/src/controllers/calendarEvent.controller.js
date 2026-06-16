const calendarEventService = require('../services/calendarEvent.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { month, year, event_type } = req.query;
  const { rows, total } = await calendarEventService.list({ month, year, event_type, limit, offset });
  new ApiResponse(200, rows, 'Calendar events fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await calendarEventService.findById(req.params.id);
  if (!record) throw ApiError.notFound('Calendar event not found');
  new ApiResponse(200, record, 'Calendar event fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const record = await calendarEventService.create({ ...req.body, created_by: req.user.employeeId });
  new ApiResponse(201, record, 'Calendar event created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const exists = await calendarEventService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Calendar event not found');
  const record = await calendarEventService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Calendar event updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const exists = await calendarEventService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Calendar event not found');
  await calendarEventService.remove(req.params.id);
  new ApiResponse(200, null, 'Calendar event deleted').send(res);
});

module.exports = { list, getOne, create, update, remove };
