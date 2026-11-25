const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/geography.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePlatformAdmin } = require('../utils/companyScope');
const router = express.Router();

const countrySchema = Joi.object({
  country_code: Joi.string().trim().max(3).uppercase().required(),
  country_name: Joi.string().trim().max(120).required(),
  default_currency: Joi.string().length(3).uppercase().allow('', null),
  default_timezone: Joi.string().max(64).allow('', null),
  status: Joi.string().valid('Active', 'Inactive'),
});
const regionSchema = Joi.object({
  country_id: Joi.number().integer().positive().required(),
  region_code: Joi.string().trim().max(32).required(),
  region_name: Joi.string().trim().max(120).required(),
  status: Joi.string().valid('Active', 'Inactive'),
});

router.use(authenticate);
router.get('/countries', controller.listCountries);
router.post('/countries', requirePlatformAdmin, validate(countrySchema), controller.createCountry);
router.put('/countries/:id', requirePlatformAdmin, validate(countrySchema.fork(['country_code', 'country_name'], (field) => field.optional())), controller.updateCountry);
router.delete('/countries/:id', requirePlatformAdmin, controller.deleteCountry);
router.get('/regions', controller.listRegions);
router.post('/regions', requirePlatformAdmin, validate(regionSchema), controller.createRegion);
router.put('/regions/:id', requirePlatformAdmin, validate(regionSchema.fork(['country_id', 'region_code', 'region_name'], (field) => field.optional())), controller.updateRegion);
router.delete('/regions/:id', requirePlatformAdmin, controller.deleteRegion);

module.exports = router;
