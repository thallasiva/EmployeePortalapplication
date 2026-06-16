const officeService = require('../services/office.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(officeService, { entityName: 'Office' });
