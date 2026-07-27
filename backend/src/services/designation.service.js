const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class DesignationService extends BaseService {
  constructor() {
    super('designations', 'designation_id', ['designation_name', 'department_id']);
  }


  async findAll({ department_id } = {}) {
    const results = await callProcedure('sp_list_designations(?)', [department_id ?? null]);
    return results[0] ?? [];
  }


  async findById(id) {
    const results = await callProcedure('sp_get_designation(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }


  async create(data) {
    if (!data.designation_name) throw ApiError.badRequest('designation_name is required');
    const results = await callProcedure(
      'sp_create_designation(?, ?, @p_id)',
      [data.designation_name, data.department_id ?? null]
    );
    return (results[0] ?? [])[0] ?? null;
  }


  async update(id, data) {
    const results = await callProcedure(
      'sp_update_designation(?, ?, ?)',
      [id, data.designation_name ?? null, data.department_id ?? null]
    );
    return (results[0] ?? [])[0] ?? null;
  }


  async remove(id) {
    const results = await callProcedure('sp_delete_designation(?)', [id]);
    return ((results[0] ?? [])[0]?.affected ?? 0) > 0;
  }


  async existsById(id) {
    const row = await this.findById(id);
    return !!row;
  }
}

module.exports = new DesignationService();
