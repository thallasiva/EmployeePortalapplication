const BaseService = require('./base.service');
class OfficeService extends BaseService {
  constructor() {
    super('offices', 'office_id', [
      'company_id', 'office_name', 'location', 'address', 'holiday_calendar', 'timezone', 'status'
    ]);
  }
}
module.exports = new OfficeService();
