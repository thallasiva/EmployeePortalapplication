const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');

class JobService extends BaseService {
  constructor() {
    super('jobs', 'job_id', [
      'title', 'department_id', 'location', 'employment_type', 'description',
      'status', 'posted_on', 'closing_date', 'created_by',
    ]);
  }

  async list({ status, department_id, search, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_jobs(?, ?, ?, ?, ?)',
      [
        status        ?? null,
        department_id ?? null,
        search        ? `%${search}%` : null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_job(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }
}

module.exports = new JobService();
