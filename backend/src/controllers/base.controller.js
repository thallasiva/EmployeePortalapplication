const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

/**
 * Builds a standard set of list/get/create/update/remove handlers for a
 * BaseService-derived service. Modules can spread these into their own
 * controller object and add bespoke handlers alongside.
 *
 * @param {import('../services/base.service')} service
 * @param {object} [options]
 * @param {string} [options.entityName] human-readable name for messages
 */
function createCrudController(service, options = {}) {
  const entityName = options.entityName || 'Record';

  return {
    list: asyncHandler(async (req, res) => {
      const { page, limit, offset } = getPagination(req.query);
      const [rows, total] = await Promise.all([
        service.findAll({ limit, offset }),
        service.count(),
      ]);
      new ApiResponse(200, rows, `${entityName} list fetched`, buildMeta({ page, limit, total })).send(res);
    }),

    getOne: asyncHandler(async (req, res) => {
      const record = await service.findById(req.params.id);
      if (!record) throw ApiError.notFound(`${entityName} not found`);
      new ApiResponse(200, record, `${entityName} fetched`).send(res);
    }),

    create: asyncHandler(async (req, res) => {
      const record = await service.create(req.body);
      new ApiResponse(201, record, `${entityName} created`).send(res);
    }),

    update: asyncHandler(async (req, res) => {
      const exists = await service.existsById(req.params.id);
      if (!exists) throw ApiError.notFound(`${entityName} not found`);
      const record = await service.update(req.params.id, req.body);
      new ApiResponse(200, record, `${entityName} updated`).send(res);
    }),

    remove: asyncHandler(async (req, res) => {
      const exists = await service.existsById(req.params.id);
      if (!exists) throw ApiError.notFound(`${entityName} not found`);
      await service.remove(req.params.id);
      new ApiResponse(200, null, `${entityName} deleted`).send(res);
    }),
  };
}

module.exports = { createCrudController };
