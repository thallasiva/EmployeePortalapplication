const roleService = require('../services/role.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(roleService, { entityName: 'Role' });
