const leaveTypeService = require('../services/leaveType.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(leaveTypeService, { entityName: 'Leave type' });
