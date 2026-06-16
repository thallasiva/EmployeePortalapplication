const BaseService = require('./base.service');

class OfficeService extends BaseService {
  constructor() {
    super('offices', 'office_id', ['office_name', 'location', 'address', 'holiday_calendar']);
  }
}

module.exports = new OfficeService();
