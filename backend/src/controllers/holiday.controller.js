const holidayService = require('../services/holiday.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/** GET /holidays — list with optional year / shift / location / calendar filters */
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { year, holiday_calendar, shift, location } = req.query;
  const { rows, total } = await holidayService.list({
    year, holiday_calendar, shift, location, limit, offset,
  });
  new ApiResponse(200, rows, 'Holidays fetched', buildMeta({ page, limit, total })).send(res);
});

/** GET /holidays/locations — distinct location values for filter dropdown */
const listLocations = asyncHandler(async (req, res) => {
  const locations = await holidayService.listLocations();
  new ApiResponse(200, locations, 'Locations fetched').send(res);
});

/** GET /holidays/:id */
const getOne = asyncHandler(async (req, res) => {
  const record = await holidayService.getById(req.params.id);
  if (!record) throw ApiError.notFound('Holiday not found');
  new ApiResponse(200, record, 'Holiday fetched').send(res);
});

/** POST /holidays */
const create = asyncHandler(async (req, res) => {
  const record = await holidayService.create(req.body);
  new ApiResponse(201, record, 'Holiday created').send(res);
});

/** POST /holidays/import */
const importHolidays = asyncHandler(async (req, res) => {
  const { holidays } = req.body;
  const result = await holidayService.bulkCreate(holidays);
  new ApiResponse(201, result, `${result.imported} holiday(s) imported`).send(res);
});

/** PUT /holidays/:id */
const update = asyncHandler(async (req, res) => {
  const existing = await holidayService.getById(req.params.id);
  if (!existing) throw ApiError.notFound('Holiday not found');
  const record = await holidayService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Holiday updated').send(res);
});

/** DELETE /holidays/:id */
const remove = asyncHandler(async (req, res) => {
  const existing = await holidayService.getById(req.params.id);
  if (!existing) throw ApiError.notFound('Holiday not found');
  await holidayService.delete(req.params.id);
  new ApiResponse(200, null, 'Holiday deleted').send(res);
});

module.exports = { list, listLocations, getOne, create, update, remove, importHolidays };
