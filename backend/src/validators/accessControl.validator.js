const Joi = require('joi');
const { SCOPE_TYPES } = require('../utils/accessScope');

const positiveId = Joi.number().integer().positive();
const scopeSchema = Joi.object({
  scope_type: Joi.string().valid(...SCOPE_TYPES).required(),
  company_id: Joi.when('scope_type', {
    is: 'COMPANY',
    then: positiveId.required(),
    otherwise: positiveId.optional(),
  }),
  region_id: Joi.when('scope_type', {
    is: 'REGION',
    then: positiveId.required(),
    otherwise: positiveId.optional(),
  }),
  branch_id: Joi.when('scope_type', {
    is: 'BRANCH',
    then: positiveId.required(),
    otherwise: positiveId.optional(),
  }),
  department_id: Joi.when('scope_type', {
    is: 'DEPARTMENT',
    then: positiveId.required(),
    otherwise: positiveId.optional(),
  }),
  team_id: Joi.when('scope_type', {
    is: 'TEAM',
    then: positiveId.optional(),
    otherwise: positiveId.optional(),
  }),
  resource_type: Joi.when('scope_type', {
    is: 'ASSIGNED_RESOURCE',
    then: Joi.string().trim().min(1).max(64).required(),
    otherwise: Joi.string().trim().max(64).optional(),
  }),
  resource_id: Joi.when('scope_type', {
    is: 'ASSIGNED_RESOURCE',
    then: Joi.alternatives().try(Joi.string().trim().min(1).max(128), positiveId).required(),
    otherwise: Joi.alternatives().try(Joi.string().trim().max(128), positiveId).optional(),
  }),
}).unknown(false);

const userRoleAssignmentsSchema = Joi.object({
  roles: Joi.array().items(
    Joi.object({
      roleId: positiveId.required(),
      scopes: Joi.array().items(scopeSchema).default([]),
    }).unknown(false)
  ).unique((a, b) => Number(a.roleId) === Number(b.roleId)).required(),
});

module.exports = { userRoleAssignmentsSchema };
