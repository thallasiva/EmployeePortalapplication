const Joi = require('joi');

const createTeamSchema = Joi.object({
  team_name: Joi.string().max(100).required(),
  department_id: Joi.number().integer().optional().allow(null),
  description: Joi.string().max(255).optional().allow('', null),
  lead_employee_id: Joi.number().integer().optional().allow(null),
});

const updateTeamSchema = createTeamSchema.fork(['team_name'], (s) => s.optional());

const addMemberSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  title: Joi.string().max(100).optional().allow('', null),
  is_lead: Joi.boolean().optional(),
});

const updateMemberSchema = Joi.object({
  title: Joi.string().max(100).optional().allow('', null),
  is_lead: Joi.boolean().optional(),
});

module.exports = { createTeamSchema, updateTeamSchema, addMemberSchema, updateMemberSchema };
