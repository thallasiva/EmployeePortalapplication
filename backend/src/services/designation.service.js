const BaseService = require('./base.service');
const { query } = require('../config/db');

class DesignationService extends BaseService {
  constructor() {
    super('designations', 'designation_id', ['designation_name', 'department_id']);
  }

  async findAll(opts = {}) {
    if (opts.department_id) {
      return query(
        'SELECT * FROM designations WHERE department_id = ? ORDER BY designation_name',
        [opts.department_id]
      );
    }
    return super.findAll({ orderBy: 'designation_name' });
  }
}

module.exports = new DesignationService();
