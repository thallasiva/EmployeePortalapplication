const Joi = require('joi');


const namedEntitySchema = (nameField = 'name', extra = {}) =>
Joi.object({
  [nameField]: Joi.string().max(150).required(),
  description: Joi.string().max(255).allow('', null),
  ...extra
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().required()
});

module.exports = { namedEntitySchema, idParamSchema };
