const { callProcedure, query, pool } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");
const notify = require("../mailNotify.service");
const { assertAllowedStatusTransition, candidateLockName } = require("./candidatePipeline.service");
class CandidateService extends BaseService {
  constructor() {
    super("rec_candidates", "candidate_id");
  }
  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const results = await callProcedure('sp_rec_get_recruiter_team_lead(?)', [recruiterId]);
    return (results[0] ?? [])[0] ?? {};
  }
  async _getRecruiterContacts(recruiterId) {
    if (!recruiterId) return {};
    const [recRows, tl] = await Promise.all([
    callProcedure('sp_rec_get_recruiter_notification_targets(?)', [JSON.stringify([recruiterId])]).
    then((r) => (r[0] ?? [])[0] ?? {}),
    this._getRecruiterTL(recruiterId)]
    );
    return {
      recruiterEmail: recRows.email || '',
      recruiterName: recRows.name || '',
      tlEmail: tl.tl_email || '',
      tlName: tl.tl_name || ''
    };
  }
  async list({ jobReqId, status, recruiterId, search, roleId, recEmpId, limit = 20, offset = 0, skill, minExperience, maxExperience, role, source } = {}) {
    const hasStructuredFilters = [skill, minExperience, maxExperience, role, source].some((value) => value !== undefined && value !== null && value !== '');
    if (hasStructuredFilters) {
      const conditions = ['c.deleted_at IS NULL'];
      const params = [];
      if (jobReqId) {
        conditions.push('c.job_req_id = ?');
        params.push(jobReqId);
      }
      if (status) {
        conditions.push('c.status = ?');
        params.push(status);
      }
      if (recruiterId) {
        conditions.push('c.recruiter_id = ?');
        params.push(recruiterId);
      }
      if (roleId === 5) {
        conditions.push('c.recruiter_id = ?');
        params.push(recEmpId);
      }
      if (search) {
        conditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.candidate_code LIKE ?)');
        params.push(...Array(3).fill(`%${search}%`));
      }
      if (skill) {
        conditions.push(`(c.skill_set LIKE ? OR EXISTS (
          SELECT 1 FROM rec_candidate_skills cs
           WHERE cs.candidate_id = c.candidate_id AND cs.skill_name LIKE ?
        ))`);
        params.push(`%${skill}%`, `%${skill}%`);
      }
      if (minExperience !== undefined && minExperience !== null && minExperience !== '') {
        conditions.push('COALESCE(c.total_experience, c.relevant_experience, 0) >= ?');
        params.push(minExperience);
      }
      if (maxExperience !== undefined && maxExperience !== null && maxExperience !== '') {
        conditions.push('COALESCE(c.total_experience, c.relevant_experience, 0) <= ?');
        params.push(maxExperience);
      }
      if (role) {
        conditions.push('j.title LIKE ?');
        params.push(`%${role}%`);
      }
      if (source) {
        conditions.push('c.source LIKE ?');
        params.push(`%${source}%`);
      }
      const where = conditions.join(' AND ');
      const [rows, count] = await Promise.all([
        query(
          `SELECT c.candidate_id, c.candidate_code, c.job_req_id, c.name, c.email,
                  c.mobile, c.gender, c.total_experience, c.relevant_experience,
                  c.current_ctc, c.expected_ctc, c.notice_period_serving,
                  c.last_working_day, c.skill_set, c.source, c.city, c.state,
                  c.status, c.recruiter_id, c.resume_path, c.created_at, c.updated_at,
                  j.title AS job_title, j.client AS job_client, j.job_req_code,
                  CONCAT(re.first_name, ' ', re.last_name) AS recruiter_name,
                  (SELECT iv.feedback_status FROM rec_interviews iv
                    WHERE iv.candidate_id = c.candidate_id AND iv.status = 'Completed'
                    ORDER BY iv.interview_date DESC, iv.interview_id DESC LIMIT 1) AS last_interview_feedback
             FROM rec_candidates c
             LEFT JOIN rec_job_requests j ON j.job_req_id = c.job_req_id
             LEFT JOIN employees re ON re.employee_id = c.recruiter_id
            WHERE ${where}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        ),
        query(
          `SELECT COUNT(*) AS total
             FROM rec_candidates c
             LEFT JOIN rec_job_requests j ON j.job_req_id = c.job_req_id
             LEFT JOIN employees re ON re.employee_id = c.recruiter_id
            WHERE ${where}`,
          params
        )
      ]);
      return { rows, total: Number(count[0]?.total || 0) };
    }
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
      ip]
    );
    const row = (results[0] ?? [])[0];
    if (row && data.recruiterId) {
      const candidateName = row.name || data.name || 'Candidate';
      const jobTitle = row.job_title || '';
      const candidateCode = row.candidate_code || '';
      this._getRecruiterTL(data.recruiterId).then((tl) => {
        if (tl.tl_email) {
          notify.candidateSubmittedToHR({
            hrEmail: tl.tl_email,
            hrName: tl.tl_name || 'HR Manager',
            recruiterName: tl.recruiter_name || 'Recruiter',
            candidateName,
            jobTitle,
            candidateCode
          });
        }
      }).catch(() => {});
    }
    return row;
  }
  async updateStatus(candidateId, status, updatedBy, ip) {
    const connection = await pool.getConnection();
    const lockName = candidateLockName(candidateId);
    let lockAcquired = false;
    let row;
    try {
      const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
      if (Number(lockRows[0]?.acquired) !== 1) {
        throw new ApiError(409, 'Could not reserve this candidate’s pipeline update. Please try again.');
      }
      lockAcquired = true;
      const [currentResults] = await connection.query('CALL sp_rec_get_candidate(?)', [candidateId]);
      const current = (currentResults[0] ?? [])[0];
      if (!current) throw new ApiError(404, 'Candidate not found');
      assertAllowedStatusTransition(current.status, status);
      if (current.status === status) return current;
      if (['Schedule Interview', 'Shortlisted'].includes(status) &&
          ['Interview Scheduled', 'Schedule Interview'].includes(current.status)) {
        const [latestInterview] = await connection.query(
          `SELECT status, feedback_status
             FROM rec_interviews
            WHERE candidate_id = ?
            ORDER BY interview_date DESC, interview_id DESC
            LIMIT 1`,
          [candidateId]
        );
        if (latestInterview[0]?.status !== 'Completed' || latestInterview[0]?.feedback_status !== 'Selected') {
          throw new ApiError(409, 'The latest interview must be completed with positive feedback before advancing this candidate.');
        }
      }
      if (status === 'Offer Released') {
        const [releasedOffer] = await connection.query(
          "SELECT offer_id FROM rec_offers WHERE candidate_id = ? AND status = 'Released' LIMIT 1",
          [candidateId]
        );
        if (!releasedOffer.length) throw new ApiError(409, 'Release an offer before moving this candidate to the offer stage.');
      }
      await connection.query(
        'CALL sp_rec_update_candidate_status(?, ?, ?, ?)',
        [candidateId, status, updatedBy, ip]
      );
      const [fullResults] = await connection.query('CALL sp_rec_get_candidate(?)', [candidateId]);
      row = (fullResults[0] ?? [])[0];
      if (!row) throw new ApiError(404, 'Candidate not found');
    } finally {
      try {
        if (lockAcquired) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
      } finally {
        connection.release();
      }
    }
    if (row) {
      const name = row.name || 'Candidate';
      const jobTitle = row.job_title || '';
      const email = row.email || '';
      const recruiterId = row.recruiter_id || row.recruiter_employee_id || null;
      const s = (status || '').toLowerCase();
      const isShort = s === 'shortlisted' || s === 'selected';
      const isReject = s === 'rejected' || s === 'not selected';
      if (email) {
        if (isReject) notify.candidateRejected({ candidateEmail: email, candidateName: name, jobTitle });
      }
      if (recruiterId) {
        this._getRecruiterContacts(recruiterId).then(({ recruiterEmail, recruiterName, tlEmail, tlName }) => {
          if (recruiterEmail) {
            notify.candidateStatusToRecruiter({
              recruiterEmail,
              recruiterName: recruiterName || 'Recruiter',
              candidateName: name,
              jobTitle,
              status
            });
          }
          if (tlEmail && (isShort || isReject)) {
            notify.tlCandidateUpdate({
              tlEmail,
              tlName: tlName || 'Team Lead',
              recruiterName: recruiterName || 'Recruiter',
              candidateName: name,
              jobTitle,
              status: isShort ? 'Shortlisted' : 'Rejected'
            });
          }
        }).catch(() => {});
      }
      if (s === 'selected') {
        notify.candidateSelectedAdmin({
          candidateName: name,
          jobTitle,
          recruiterName: row.recruiter_name || 'Recruiter'
        });
      }
    }
    return row;
  }
}
module.exports = new CandidateService();
