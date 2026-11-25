const geographyService = require('../services/geography.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  listCountries: asyncHandler(async (req, res) => {
    const rows = await geographyService.listCountries({ status: req.query.status });
    new ApiResponse(200, rows, 'Countries fetched').send(res);
  }),
  createCountry: asyncHandler(async (req, res) => {
    const row = await geographyService.createCountry(req.body);
    new ApiResponse(201, row, 'Country created').send(res);
  }),
  updateCountry: asyncHandler(async (req, res) => {
    const row = await geographyService.updateCountry(req.params.id, req.body);
    new ApiResponse(200, row, 'Country updated').send(res);
  }),
  deleteCountry: asyncHandler(async (req, res) => {
    await geographyService.deleteCountry(req.params.id);
    new ApiResponse(200, null, 'Country deleted').send(res);
  }),
  listRegions: asyncHandler(async (req, res) => {
    const rows = await geographyService.listRegions(req.query);
    new ApiResponse(200, rows, 'Regions fetched').send(res);
  }),
  createRegion: asyncHandler(async (req, res) => {
    const row = await geographyService.createRegion(req.body);
    new ApiResponse(201, row, 'Region created').send(res);
  }),
  updateRegion: asyncHandler(async (req, res) => {
    const row = await geographyService.updateRegion(req.params.id, req.body);
    new ApiResponse(200, row, 'Region updated').send(res);
  }),
  deleteRegion: asyncHandler(async (req, res) => {
    await geographyService.deleteRegion(req.params.id);
    new ApiResponse(200, null, 'Region deleted').send(res);
  }),
};
