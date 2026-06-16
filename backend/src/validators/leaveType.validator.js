const Joi = require('joi');

const createLeaveTypeSchema = Joi.object({
  leave_type_name: Joi.string().max(60).required(),
  annual_quota: Joi.number().min(0).optional(),
  carry_forward_limit: Joi.number().min(0).optional(),
  requires_proof: Joi.boolean().optional(),
  description: Joi.string().max(255).optional().allow('', null),
});

const updateLeaveTypeSchema = createLeaveTypeSchema.fork(['leave_type_name'], (s) => s.optional());

module.exports = { createLeaveTypeSchema, updateLeaveTypeSchema };
