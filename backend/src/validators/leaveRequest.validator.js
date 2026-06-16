const Joi = require('joi');

const applyLeaveSchema = Joi.object({
  leave_type_id: Joi.number().integer().required(),
  from_date: Joi.date().iso().required(),
  from_session: Joi.string().valid('Full Day', 'First Half', 'Second Half').optional().allow(null),
  to_date: Joi.date().iso().min(Joi.ref('from_date')).required(),
  to_session: Joi.string().valid('Full Day', 'First Half', 'Second Half').optional().allow(null),
  days: Joi.number().positive().required(),
  reason: Joi.string().max(255).optional().allow('', null),
});

const reviewLeaveSchema = Joi.object({
  decision: Joi.string().valid('Approved', 'Rejected').required(),
  remarks: Joi.string().max(255).optional().allow('', null),
});

module.exports = { applyLeaveSchema, reviewLeaveSchema };
