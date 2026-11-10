const BaseService = require('./base.service');
class OfficeService extends BaseService {
  constructor() {
    super('offices', 'office_id', [
      'company_id', 'office_name', 'location', 'address', 'holiday_calendar', 'timezone', 'status',
      'geo_latitude', 'geo_longitude', 'geo_radius_meters', 'geo_fence_enabled'
    ]);
  }
}
module.exports = new OfficeService();
