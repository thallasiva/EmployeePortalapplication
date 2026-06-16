const BaseService = require('./base.service');

class ReviewTypeService extends BaseService {
  constructor() {
    super('review_types', 'review_type_id', ['name', 'description', 'frequency']);
  }
}

module.exports = new ReviewTypeService();
