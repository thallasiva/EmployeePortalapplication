const Joi = require('joi');

const createDocumentCategorySchema = Joi.object({
  category_name: Joi.string().max(60).required(),
});

const updateDocumentCategorySchema = createDocumentCategorySchema;

const createDocumentSchema = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().max(255).optional().allow('', null),
  category_id: Joi.number().integer().optional().allow(null),
  visibility: Joi.string().valid('all', 'admin', 'employee').optional(),
  employee_id: Joi.number().integer().optional().allow(null),
});

const updateDocumentSchema = Joi.object({
  title: Joi.string().max(150).optional(),
  description: Joi.string().max(255).optional().allow('', null),
  category_id: Joi.number().integer().optional().allow(null),
  visibility: Joi.string().valid('all', 'admin', 'employee').optional(),
  employee_id: Joi.number().integer().optional().allow(null),
});

module.exports = {
  createDocumentCategorySchema,
  updateDocumentCategorySchema,
  createDocumentSchema,
  updateDocumentSchema,
};
