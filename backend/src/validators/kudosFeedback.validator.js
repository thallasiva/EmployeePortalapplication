const Joi = require('joi');
const FEEDBACK_TYPES = ['Positive', 'Constructive', 'Developmental'];
const id = Joi.number().integer().positive();
const giveKudosSchema = Joi.object({
  to_employee_ids: Joi.array().items(id).min(1).max(25).required(),
  category_id: id.allow(null).optional(),
  message: Joi.string().trim().min(5).max(1000).required(),
  is_public: Joi.boolean().default(true)
});
const giveFeedbackSchema = Joi.object({
  to_employee_id: id.required(),
  feedback_type: Joi.string().valid(...FEEDBACK_TYPES).required(),
  category_id: id.allow(null).optional(),
  message: Joi.string().trim().min(5).max(2000).required(),
  is_anonymous: Joi.boolean().default(false),
  request_id: id.allow(null).optional()
});
const requestFeedbackSchema = Joi.object({
  reviewer_employee_ids: Joi.array().items(id).min(1).max(10).required(),
  topic: Joi.string().trim().min(3).max(150).required(),
  message: Joi.string().trim().max(1000).allow('', null).optional()
});
const categoryFields = {
  category_name: Joi.string().trim().min(2).max(60),
  description: Joi.string().trim().max(255).allow('', null),
  color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
  category_type: Joi.string().valid('kudos', 'feedback'),
  is_active: Joi.boolean()
};
const createCategorySchema = Joi.object({
  ...categoryFields,
  category_name: categoryFields.category_name.required(),
  color: categoryFields.color.default('#f18200'),
  category_type: categoryFields.category_type.default('kudos'),
  is_active: categoryFields.is_active.default(true)
});
const updateCategorySchema = Joi.object(categoryFields).min(1);
module.exports = {
  giveKudosSchema,
  giveFeedbackSchema,
  requestFeedbackSchema,
  createCategorySchema,
  updateCategorySchema
};
