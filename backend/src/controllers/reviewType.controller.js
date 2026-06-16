const reviewTypeService = require('../services/reviewType.service');
const { createCrudController } = require('./base.controller');

module.exports = createCrudController(reviewTypeService, { entityName: 'Review type' });
