const BaseService = require('./base.service');

class DepartmentService extends BaseService {
  constructor() {
    super('departments', 'department_id', ['department_name', 'company_id']);
  }
}

module.exports = new DepartmentService();
