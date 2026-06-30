const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class JobApplicationService extends BaseService {
  constructor() {
    super('job_applications', 'application_id', [
      'job_id', 'applicant_name', 'email', 'mobile', 'resume_url',
      'status', 'source', 'applicant_employee_id',
    ]);
  }

  async list({ job_id, status, search, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_job_applications(?, ?, ?, ?, ?)',
      [
        job_id  ?? null,
        status  ?? null,
        search  ? `%${search}%` : null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_job_application(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }

  async updateStatus(id, status) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Application not found');
    await callProcedure('sp_update_job_application_status(?, ?)', [id, status]);
    return this.getDetails(id);
  }
}

module.exports = new JobApplicationService();
