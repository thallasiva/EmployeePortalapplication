const BaseService = require('./base.service');

class RoleService extends BaseService {
  constructor() {
    super('roles', 'role_id', ['role_name', 'description']);
  }
}

module.exports = new RoleService();
