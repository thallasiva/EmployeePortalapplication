const Joi = require('joi');

const createJobSchema = Joi.object({
  title: Joi.string().max(150).required(),
  department_id: Joi.number().integer().optional().allow(null),
  location: Joi.string().max(100).optional().allow('', null),
  employment_type: Joi.string().max(30).optional(),
  description: Joi.string().optional().allow('', null),
  status: Joi.string().valid('Open', 'Closed', 'On Hold').optional(),
  posted_on: Joi.date().iso().optional().allow(null),
  closing_date: Joi.date().iso().optional().allow(null),
});

const updateJobSchema = createJobSchema.fork(['title'], (s) => s.optional());

const createApplicationSchema = Joi.object({
  job_id: Joi.number().integer().required(),
  applicant_name: Joi.string().max(120).required(),
  email: Joi.string().email().optional().allow('', null),
  mobile: Joi.string().max(20).optional().allow('', null),
  resume_url: Joi.string().max(255).optional().allow('', null),
  source: Joi.string().max(50).optional().allow('', null),
  applicant_employee_id: Joi.number().integer().optional().allow(null),
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected', 'Hired').required(),
});

const createReferralSchema = Joi.object({
  job_id: Joi.number().integer().required(),
  candidate_name: Joi.string().max(120).required(),
  candidate_email: Joi.string().email().optional().allow('', null),
  candidate_mobile: Joi.string().max(20).optional().allow('', null),
  resume_url: Joi.string().max(255).optional().allow('', null),
});

const updateReferralStatusSchema = Joi.object({
  status: Joi.string().valid('Submitted', 'Shortlisted', 'Interview', 'Hired', 'Rejected').required(),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  createReferralSchema,
  updateReferralStatusSchema,
};
