const departmentService = require('../services/department.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(departmentService, { entityName: 'Department' });
