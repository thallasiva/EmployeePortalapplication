const BaseService = require('./base.service');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

function toRoleKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

class RoleService extends BaseService {
  constructor() {
    super('roles', 'role_id', ['role_name', 'role_key', 'description']);
  }
  async create(data) {
    const roleKey = toRoleKey(data.role_key || data.role_name);
    if (!roleKey) throw ApiError.badRequest('A valid role name is required');
    return super.create({ ...data, role_key: roleKey });
  }
  async update(id, data) {
    const current = await this.findById(id);
    if (!current) throw ApiError.notFound('Role not found');
    if (current.role_key === 'SUPER_ADMIN' && data.role_name && data.role_name !== current.role_name) {
      throw ApiError.forbidden('The Super Admin role name cannot be changed');
    }
    const payload = { ...data };
    if (payload.role_name || payload.role_key) {
      payload.role_key = toRoleKey(payload.role_key || payload.role_name);
    }
    return super.update(id, payload);
  }
  async remove(id) {
    const role = await this.findById(id);
    if (!role) return false;
    if (role.role_key === 'SUPER_ADMIN') {
      throw ApiError.forbidden('The Super Admin role cannot be deleted');
    }
    const assignments = await query(
      'SELECT 1 FROM user_roles WHERE role_id = ? AND is_active = 1 LIMIT 1',
      [id]
    );
    if (assignments.length) throw ApiError.conflict('Revoke this role from users before deleting it');
    return super.remove(id);
  }
}
module.exports = new RoleService();
