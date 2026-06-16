const companyService = require('../services/company.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(companyService, { entityName: 'Company' });
