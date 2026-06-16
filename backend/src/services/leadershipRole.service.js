const BaseService = require('./base.service');

class LeadershipRoleService extends BaseService {
  constructor() {
    super('leadership_roles', 'leadership_role_id', ['role_name', 'description']);
  }
}

module.exports = new LeadershipRoleService();
