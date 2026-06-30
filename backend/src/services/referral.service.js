const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

class ReferralService extends BaseService {
  constructor() {
    super('referrals', 'referral_id', [
      'job_id', 'referred_by', 'candidate_name', 'candidate_email',
      'candidate_mobile', 'resume_url', 'status',
    ]);
  }

  async list({ referred_by, job_id, status, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_referrals(?, ?, ?, ?, ?)',
      [
        referred_by ?? null,
        job_id      ?? null,
        status      ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_referral(?)', [id]);
    return (results[0] ?? [])[0] ?? null;
  }

  async updateStatus(id, status) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Referral not found');
    await callProcedure('sp_update_referral_status(?, ?)', [id, status]);
    return this.getDetails(id);
  }
}

module.exports = new ReferralService();
