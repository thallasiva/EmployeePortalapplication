const Joi = require('joi');

const updateRolePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(
      Joi.object({
        module: Joi.string().required(),
        action: Joi.string().required(),
        allowed: Joi.boolean().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { updateRolePermissionsSchema };
