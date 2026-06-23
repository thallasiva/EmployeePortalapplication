const Joi = require('joi');

/**
 * Strong password rule:
 *   - 8–100 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one digit
 *   - At least one special character  !@#$%^&*()-_=+[]{}|;:,.<>?
 */
const strongPassword = Joi.string()
  .min(8)
  .max(100)
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/[0-9]/, 'number')
  .pattern(/[^A-Za-z0-9]/, 'special character')
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
    'string.min': 'Password must be at least 8 characters',
  });

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: strongPassword.required(),
  firstName: Joi.string().max(80).required(),
  lastName: Joi.string().max(80).allow('', null),
  mobile: Joi.string().max(20).allow('', null),
  roleId: Joi.number().integer().valid(1, 2, 3).default(2),
  departmentId: Joi.number().integer().allow(null),
  designationId: Joi.number().integer().allow(null),
  empJobTitle: Joi.string().max(100).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: strongPassword.required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: strongPassword.required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
