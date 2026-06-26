const Joi = require('joi');

const TEAMS = ['IT Team', 'Admin Team', 'HR Team', 'Finance Team'];

const createTicketSchema = Joi.object({
  category:       Joi.string().max(60).optional(),
  subject:        Joi.string().max(150).required(),
  description:    Joi.string().optional().allow('', null),
  priority:       Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
  attachment_url: Joi.string().max(255).optional().allow('', null),
});

/* Admin / support agent — generic status update */
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Open', 'Forwarded', 'In Progress', 'Reopened', 'Resolved', 'Closed', 'Rejected')
    .required(),
});

/* Employee — reopen a resolved ticket */
const reopenTicketSchema = Joi.object({
  comment: Joi.string().min(1).optional().allow('', null),
});

/**
 * Manager approve/reject.
 * On approve: forwarded_to_team is required.
 * On reject:  comment is required.
 */
const managerActionSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),

  forwarded_to_team: Joi.string().valid(...TEAMS)
    .when('action', { is: 'approve', then: Joi.required(), otherwise: Joi.optional().allow('', null) }),

  comment: Joi.string().min(1)
    .when('action', { is: 'reject', then: Joi.required(), otherwise: Joi.optional().allow('', null) }),
});

const assignTicketSchema = Joi.object({
  assigned_to: Joi.number().integer().required(),
});

const addCommentSchema = Joi.object({
  comment: Joi.string().min(1).required(),
});

module.exports = {
  createTicketSchema,
  updateStatusSchema,
  reopenTicketSchema,
  managerActionSchema,
  assignTicketSchema,
  addCommentSchema,
};
