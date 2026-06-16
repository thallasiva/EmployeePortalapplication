const documentCategoryService = require('../services/documentCategory.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(documentCategoryService, { entityName: 'Document category' });
