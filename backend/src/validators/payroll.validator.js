const Joi = require('joi');

const createSalaryStructureSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  basic: Joi.number().min(0).optional(),
  hra: Joi.number().min(0).optional(),
  conveyance: Joi.number().min(0).optional(),
  medical_allowance: Joi.number().min(0).optional(),
  special_allowance: Joi.number().min(0).optional(),
  pf_employee: Joi.number().min(0).optional(),
  pf_employer: Joi.number().min(0).optional(),
  professional_tax: Joi.number().min(0).optional(),
  income_tax: Joi.number().min(0).optional(),
  ctc: Joi.number().min(0).optional(),
  effective_from: Joi.date().iso().required(),
});

const updateSalaryStructureSchema = createSalaryStructureSchema.fork(
  ['employee_id', 'effective_from'],
  (s) => s.optional()
);

const generatePayslipSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).required(),
});

const generateMyPayslipSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2000).optional(),
});

const generateAllPayslipsSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).required(),
});

const runPayrollSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).required(),
});

const importSalaryStructureRowSchema = Joi.object({
  emp_code: Joi.string().required(),
  basic: Joi.number().min(0).optional().allow('', null),
  hra: Joi.number().min(0).optional().allow('', null),
  conveyance: Joi.number().min(0).optional().allow('', null),
  medical_allowance: Joi.number().min(0).optional().allow('', null),
  special_allowance: Joi.number().min(0).optional().allow('', null),
  pf_employee: Joi.number().min(0).optional().allow('', null),
  pf_employer: Joi.number().min(0).optional().allow('', null),
  professional_tax: Joi.number().min(0).optional().allow('', null),
  income_tax: Joi.number().min(0).optional().allow('', null),
  ctc: Joi.number().min(0).optional().allow('', null),
  effective_from: Joi.date().iso().required(),
});

const importSalaryStructuresSchema = Joi.object({
  items: Joi.array().items(importSalaryStructureRowSchema).min(1).required(),
});

module.exports = {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  generatePayslipSchema,
  generateMyPayslipSchema,
  generateAllPayslipsSchema,
  runPayrollSchema,
  importSalaryStructuresSchema,
};
