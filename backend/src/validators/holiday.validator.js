const Joi = require('joi');

const SHIFTS = ['general', 'mid', 'night'];


const flexDate = Joi.alternatives().try(
  Joi.date().iso(),
  Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
);

const createHolidaySchema = Joi.object({
  holiday_name: Joi.string().max(100).required(),
  holiday_date: flexDate.required(),
  holiday_calendar: Joi.string().max(100).optional(),
  shift: Joi.string().valid(...SHIFTS).default('general'),
  location: Joi.string().max(100).allow('', null).optional(),
  is_restricted: Joi.boolean().optional()
});

const updateHolidaySchema = Joi.object({
  holiday_name: Joi.string().max(100).optional(),
  holiday_date: flexDate.optional(),
  holiday_calendar: Joi.string().max(100).optional(),
  shift: Joi.string().valid(...SHIFTS).optional(),
  location: Joi.string().max(100).allow('', null).optional(),
  is_restricted: Joi.boolean().optional()
});


const importHolidaysSchema = Joi.object({
  holidays: Joi.array().items(createHolidaySchema).min(1).required()
});

module.exports = { createHolidaySchema, updateHolidaySchema, importHolidaysSchema };
