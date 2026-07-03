const { callProcedure } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");

class CandidateService extends BaseService {
  constructor() {
    super("rec_candidates", "candidate_id");
  }

  async list({ jobReqId, status, recruiterId, search, roleId, recEmpId, limit = 20, offset = 0 } = {}) {
    const results = await callProcedure(
      "sp_rec_list_candidates(?, ?, ?, ?, ?, ?, ?, ?)",
      [jobReqId || null, status || null, recruiterId || null, search || null, roleId || null, recEmpId || null, limit, offset]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getById(candidateId) {
    const results = await callProcedure("sp_rec_get_candidate(?)", [candidateId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new ApiError(404, "Candidate not found");
    return row;
  }

  async create(data, createdBy, ip) {
    const results = await callProcedure(
      "sp_rec_create_candidate(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @candidate_id, @candidate_code)",
      [
        data.jobReqId,
        data.name,
        data.email,
        data.mobile || null,
        data.gender || null,
        data.totalExperience || 0,
        data.relevantExperience || 0,
        data.currentCtc || 0,
        data.expectedCtc || 0,
        data.noticePeriodServing ? 1 : 0,
        data.lastWorkingDay || null,
        data.skillSet || null,
        data.source || null,
        data.pinCode || null,
        data.city || null,
        data.state || null,
        data.district || null,
        data.recruiterId,
        createdBy,
        ip,
      ]
    );
    return (results[0] ?? [])[0];
  }

  async updateStatus(candidateId, status, updatedBy, ip) {
    const results = await callProcedure(
      "sp_rec_update_candidate_status(?, ?, ?, ?)",
      [candidateId, status, updatedBy, ip]
    );
    return (results[0] ?? [])[0];
  }
}

module.exports = new CandidateService();
