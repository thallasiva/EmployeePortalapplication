const BaseService = require('./base.service');

class CompanyService extends BaseService {
  constructor() {
    super('companies', 'company_id', ['company_name', 'address', 'email', 'phone']);
  }
}

module.exports = new CompanyService();
