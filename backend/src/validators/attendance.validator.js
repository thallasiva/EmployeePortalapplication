const Joi = require('joi');

const checkInSchema = Joi.object({
  date: Joi.date().iso().optional(),
  time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  shift_start: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
});

const checkOutSchema = Joi.object({
  date: Joi.date().iso().optional(),
  time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
});

const createRegularizationSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  attendance_date: Joi.date().iso().required(),
  requested_check_in: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional().allow(null),
  requested_check_out: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional().allow(null),
  reason: Joi.string().max(255).required(),
});

const reviewRegularizationSchema = Joi.object({
  decision: Joi.string().valid('Approved', 'Rejected').required(),
  remarks: Joi.string().max(255).optional().allow('', null),
});

module.exports = {
  checkInSchema,
  checkOutSchema,
  createRegularizationSchema,
  reviewRegularizationSchema,
};
