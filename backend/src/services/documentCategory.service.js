const BaseService = require('./base.service');

class DocumentCategoryService extends BaseService {
  constructor() {
    super('document_categories', 'category_id', ['category_name']);
  }
}

module.exports = new DocumentCategoryService();
