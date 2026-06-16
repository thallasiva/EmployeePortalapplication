const Joi = require('joi');

const createReviewTypeSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(255).optional().allow('', null),
  frequency: Joi.string().max(30).optional(),
});

const updateReviewTypeSchema = createReviewTypeSchema.fork(['name'], (s) => s.optional());

const createReviewSchema = Joi.object({
  review_type_id: Joi.number().integer().required(),
  employee_id: Joi.number().integer().required(),
  reviewer_id: Joi.number().integer().optional().allow(null),
  cycle_start: Joi.date().iso().optional().allow(null),
  cycle_end: Joi.date().iso().optional().allow(null),
  due_date: Joi.date().iso().optional().allow(null),
});

const updateReviewSchema = createReviewSchema.fork(['review_type_id', 'employee_id'], (s) => s.optional()).keys({
  status: Joi.string().valid('Pending', 'In Progress', 'Submitted', 'Completed').optional(),
});

const submitReviewSchema = Joi.object({
  overall_rating: Joi.number().min(0).max(5).required(),
  comments: Joi.string().optional().allow('', null),
});

module.exports = {
  createReviewTypeSchema,
  updateReviewTypeSchema,
  createReviewSchema,
  updateReviewSchema,
  submitReviewSchema,
};
