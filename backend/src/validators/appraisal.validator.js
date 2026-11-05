const Joi = require('joi');

const cycleSchema = Joi.object({
  fy_label: Joi.string().trim().max(50).required(),
  deadline: Joi.date().iso().allow('', null).optional(),
  cycle_type: Joi.string().valid('monthly', 'quarterly', 'half_yearly', 'yearly').optional(),
  parameters: Joi.array().items(Joi.object({
    key: Joi.string().pattern(/^[a-z][a-z0-9_]{0,49}$/).required(),
    label: Joi.string().trim().max(255).required()
  })).min(1).max(20).optional()
});

const cycleSettingsSchema = Joi.object({
  fy_label: Joi.string().trim().max(50).allow('', null).optional(),
  deadline: Joi.date().iso().allow('', null).optional(),
  cycle_type: Joi.string().valid('monthly', 'quarterly', 'half_yearly', 'yearly').allow(null).optional(),
  parameters: Joi.array().items(Joi.object({
    key: Joi.string().pattern(/^[a-z][a-z0-9_]{0,49}$/).required(),
    label: Joi.string().trim().max(255).required()
  })).min(1).max(20).optional()
}).min(1);

const goalSchema = Joi.object({
  title: Joi.string().trim().max(255).allow('').optional(),
  description: Joi.string().allow('', null).optional(),
  success_metrics: Joi.string().allow('', null).optional(),
  self_progress: Joi.string().allow('', null).optional(),
  evidence_url: Joi.string().uri({ scheme: ['http', 'https'] }).allow('', null).optional()
});

const saveSelfAppraisalSchema = Joi.object({
  ratings: Joi.array().items(Joi.object({
    parameter_key: Joi.string().max(50).required(),
    parameter_label: Joi.string().max(255).allow('', null).optional(),
    self_rating: Joi.number().integer().min(0).max(5).allow(null).optional(),
    self_comments: Joi.string().allow('', null).optional()
  })).optional(),
  goals: Joi.array().items(goalSchema).max(20).optional(),
  overall_comments: Joi.string().allow('', null).optional(),
  submit: Joi.boolean().default(false)
});

const managerRatingSchema = Joi.object({
  ratings: Joi.array().items(Joi.object({
    parameter_key: Joi.string().max(50).required(),
    manager_rating: Joi.number().integer().min(1).max(5).allow(null).optional(),
    manager_comments: Joi.string().allow('', null).optional()
  })).optional(),
  goals: Joi.array().items(Joi.object({
    goal_id: Joi.number().integer().required(),
    manager_feedback: Joi.string().allow('', null).optional()
  })).optional(),
  manager_feedback: Joi.string().allow('', null).optional(),
  submit: Joi.boolean().default(false)
});

const workflowActionSchema = Joi.object({
  action: Joi.string().valid('request_changes', 'share', 'decision', 'close', 'reopen').required(),
  reason: Joi.string().trim().max(2000).when('action', {
    is: Joi.valid('request_changes', 'reopen'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  hr_feedback: Joi.string().allow('', null).optional(),
  decision_type: Joi.string().valid('development', 'promotion', 'increment', 'no_change').when('action', {
    is: 'decision',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  decision_notes: Joi.string().allow('', null).optional(),
  decision_ctc_annual: Joi.number().positive().allow(null).optional(),
  decision_effective_date: Joi.date().iso().allow(null).optional()
});

module.exports = {
  cycleSchema,
  cycleSettingsSchema,
  saveSelfAppraisalSchema,
  managerRatingSchema,
  workflowActionSchema
};
