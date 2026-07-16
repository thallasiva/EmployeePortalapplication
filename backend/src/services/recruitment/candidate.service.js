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

  /** Fetch recruiter's own email + TL email in one parallel call */
  async _getRecruiterContacts(recruiterId) {
    if (!recruiterId) return {};
    const [recRows, tl] = await Promise.all([
      callProcedure('sp_rec_get_recruiter_notification_targets(?)', [JSON.stringify([recruiterId])])
        .then((r) => (r[0] ?? [])[0] ?? {}),
      this._getRecruiterTL(recruiterId),
    ]);
    return {
      recruiterEmail: recRows.email || '',
      recruiterName:  recRows.name  || '',
      tlEmail:        tl.tl_email       || '',
      tlName:         tl.tl_name        || '',
    };
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

    // Step 2: Notify HR Manager (TL) when recruiter submits a new candidate
    if (row && data.recruiterId) {
      const candidateName = row.name || data.name || 'Candidate';
      const jobTitle      = row.job_title || '';
      const candidateCode = row.candidate_code || '';
      this._getRecruiterTL(data.recruiterId).then((tl) => {
        if (tl.tl_email) {
          notify.candidateSubmittedToHR({
            hrEmail:       tl.tl_email,
            hrName:        tl.tl_name        || 'HR Manager',
            recruiterName: tl.recruiter_name  || 'Recruiter',
            candidateName,
            jobTitle,
            candidateCode,
          });
        }
      }).catch(() => {});
    }

    return row;
  }

  async updateStatus(candidateId, status, updatedBy, ip) {
    // Run the update (returns minimal: candidate_id, candidate_code, name, status only)
    await callProcedure(
      "sp_rec_update_candidate_status(?, ?, ?, ?)",
      [candidateId, status, updatedBy, ip]
    );

    // Fetch full candidate so we have email, job_title, recruiter_id for notifications
    const fullResults = await callProcedure('sp_rec_get_candidate(?)', [candidateId]);
    const row = (fullResults[0] ?? [])[0];

    if (row) {
      const name        = row.name || 'Candidate';
      const jobTitle    = row.job_title || '';
      const email       = row.email || '';
      const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
      const s           = (status || '').toLowerCase();
      const isShort     = s === 'shortlisted' || s === 'selected';
      const isReject    = s === 'rejected' || s === 'not selected';

      // Notify candidate on shortlist / rejection
      if (email) {
        if (isShort)   notify.candidateShortlisted({ candidateEmail: email, candidateName: name, jobTitle });
        else if (isReject) notify.candidateRejected({ candidateEmail: email, candidateName: name, jobTitle });
      }

      // Steps 3 & 6: Notify Recruiter of status change; also TL on shortlist/rejection
      if (recruiterId) {
        this._getRecruiterContacts(recruiterId).then(({ recruiterEmail, recruiterName, tlEmail, tlName }) => {
          // Notify recruiter of every status change
          if (recruiterEmail) {
            notify.candidateStatusToRecruiter({
              recruiterEmail,
              recruiterName: recruiterName || 'Recruiter',
              candidateName: name,
              jobTitle,
              status,
            });
          }
          // Notify TL on shortlist / rejection
          if (tlEmail && (isShort || isReject)) {
            notify.tlCandidateUpdate({
              tlEmail,
              tlName:        tlName         || 'Team Lead',
              recruiterName: recruiterName  || 'Recruiter',
              candidateName: name,
              jobTitle,
              status: isShort ? 'Shortlisted' : 'Rejected',
            });
          }
        }).catch(() => {});
      }

      // Step 8: Notify Admin when candidate is Selected
      if (s === 'selected') {
        notify.candidateSelectedAdmin({
          candidateName: name,
          jobTitle,
          recruiterName: row.recruiter_name || 'Recruiter',
        });
      }
    }

    return row;
  }
}

module.exports = new CandidateService();
