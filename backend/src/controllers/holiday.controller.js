const holidayService = require('../services/holiday.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { year, holiday_calendar } = req.query;
  const { rows, total } = await holidayService.list({ year, holiday_calendar, limit, offset });
  new ApiResponse(200, rows, 'Holidays fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await holidayService.findById(req.params.id);
  if (!record) throw ApiError.notFound('Holiday not found');
  new ApiResponse(200, record, 'Holiday fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const record = await holidayService.create(req.body);
  new ApiResponse(201, record, 'Holiday created').send(res);
});

const importHolidays = asyncHandler(async (req, res) => {
  const { holidays } = req.body;
  const result = await holidayService.bulkCreate(holidays);
  new ApiResponse(201, result, `${result.imported} holiday(s) imported`).send(res);
});

const update = asyncHandler(async (req, res) => {
  const exists = await holidayService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Holiday not found');
  const record = await holidayService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Holiday updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  const exists = await holidayService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Holiday not found');
  await holidayService.remove(req.params.id);
  new ApiResponse(200, null, 'Holiday deleted').send(res);
});

module.exports = { list, getOne, create, update, remove, importHolidays };
