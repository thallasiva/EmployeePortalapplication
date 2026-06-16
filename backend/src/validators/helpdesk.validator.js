const Joi = require('joi');

const createTicketSchema = Joi.object({
  category: Joi.string().max(60).optional(),
  subject: Joi.string().max(150).required(),
  description: Joi.string().optional().allow('', null),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
  attachment_url: Joi.string().max(255).optional().allow('', null),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Open', 'In Progress', 'Resolved', 'Closed').required(),
});

const assignTicketSchema = Joi.object({
  assigned_to: Joi.number().integer().required(),
});

const addCommentSchema = Joi.object({
  comment: Joi.string().min(1).required(),
});

module.exports = { createTicketSchema, updateStatusSchema, assignTicketSchema, addCommentSchema };
