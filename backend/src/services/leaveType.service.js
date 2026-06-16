const BaseService = require('./base.service');

class LeaveTypeService extends BaseService {
  constructor() {
    super('leave_types', 'leave_type_id', [
      'leave_type_name', 'annual_quota', 'carry_forward_limit', 'requires_proof', 'description',
    ]);
  }
}

module.exports = new LeaveTypeService();
