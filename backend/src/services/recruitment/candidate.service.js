const { callProcedure, query } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");
const notify = require("../mailNotify.service");

class CandidateService extends BaseService {
  constructor() {
    super("rec_candidates", "candidate_id");
  }

  /** Fetch the recruiter's Team Lead email + name via reporting_to */
  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const rows = await query(
      `SELECT tl.email AS tl_email,
              CONCAT(tl.first_name, ' ', IFNULL(tl.last_name, '')) AS tl_name,
              CONCAT(r.first_name,  ' ', IFNULL(r.last_name,  '')) AS recruiter_name
         FROM employees r
         LEFT JOIN employees tl ON tl.employee_id = r.reporting_to
        WHERE r.employee_id = ? LIMIT 1`,
      [recruiterId]
    );
    return rows[0] ?? {};
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
    const row = (results[0] ?? [])[0];

    // Acknowledge application receipt (fire-and-forget)
    if (data.email && data.name) {
      notify.applicationAcknowledgment({
        candidateEmail: data.email,
        candidateName:  data.name,
        jobTitle:       row?.job_title || row?.position_name || '',
      });
    }
    return row;
  }

  async updateStatus(candidateId, status, updatedBy, ip) {
    const results = await callProcedure(
      "sp_rec_update_candidate_status(?, ?, ?, ?)",
      [candidateId, status, updatedBy, ip]
    );
    const row = (results[0] ?? [])[0];

    if (row && row.email) {
      const name      = row.name || row.candidate_name || 'Candidate';
      const jobTitle  = row.job_title || row.position_name || '';
      const s         = (status || '').toLowerCase();
      const isShort   = s === 'shortlisted' || s === 'selected';
      const isReject  = s === 'rejected' || s === 'not selected';

      // Notify candidate
      if (isShort) notify.candidateShortlisted({ candidateEmail: row.email, candidateName: name, jobTitle });
      else if (isReject) notify.candidateRejected({ candidateEmail: row.email, candidateName: name, jobTitle });

      // Notify Recruiter Manager (TL) about team activity
      if (isShort || isReject) {
        const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
        this._getRecruiterTL(recruiterId).then((tl) => {
          if (tl.tl_email) {
            notify.tlCandidateUpdate({
              tlEmail:       tl.tl_email,
              tlName:        tl.tl_name       || 'Team Lead',
              recruiterName: tl.recruiter_name || 'Recruiter',
              candidateName: name,
              jobTitle,
              status: isShort ? 'Shortlisted' : 'Rejected',
            });
          }
        }).catch(() => {});
      }
    }
    return row;
  }
}

module.exports = new CandidateService();
