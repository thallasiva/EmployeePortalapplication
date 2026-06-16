const Joi = require('joi');

const createHolidaySchema = Joi.object({
  holiday_name: Joi.string().max(100).required(),
  holiday_date: Joi.date().iso().required(),
  holiday_calendar: Joi.string().max(100).optional(),
  is_restricted: Joi.boolean().optional(),
});

const updateHolidaySchema = createHolidaySchema.fork(['holiday_name', 'holiday_date'], (s) => s.optional());

const importHolidaysSchema = Joi.object({
  holidays: Joi.array().items(createHolidaySchema).min(1).required(),
});

module.exports = { createHolidaySchema, updateHolidaySchema, importHolidaysSchema };
