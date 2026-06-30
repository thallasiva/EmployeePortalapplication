const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class RequestHubService extends BaseService {
  constructor() {
    super('request_hub', 'request_id', [
      'employee_id', 'request_type', 'title', 'description', 'status', 'reviewed_by',
    ]);
  }

  async list({ employee_id, status, request_type, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_request_hub(?, ?, ?, ?, ?)',
      [
        employee_id   ?? null,
        status        ?? null,
        request_type  ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_request_hub(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }

  async updateStatus(id, status, reviewedBy) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Request not found');
    await callProcedure('sp_update_request_hub_status(?, ?, ?)', [id, status, reviewedBy || null]);
    return this.getDetails(id);
  }
}

module.exports = new RequestHubService();
