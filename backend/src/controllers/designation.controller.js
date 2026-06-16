const designationService = require('../services/designation.service');
const { createCrudController } = require('./base.controller');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const base = createCrudController(designationService, { entityName: 'Designation' });

const list = asyncHandler(async (req, res) => {
  const rows = await designationService.findAll({ department_id: req.query.department_id });
  new ApiResponse(200, rows, 'Designation list fetched').send(res);
});

module.exports = { ...base, list };
