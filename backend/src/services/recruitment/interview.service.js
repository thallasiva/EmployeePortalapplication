const { callProcedure, query } = require('../../config/db');
const BaseService = require('../base.service');
const ApiError = require('../../utils/ApiError');
const notify = require('../mailNotify.service');

class InterviewService extends BaseService {
  constructor() {
    super('rec_interviews', 'interview_id');
  }

  /** Recruiter's TL (HR Manager) email + name via reporting_to */
  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const rows = await query(
      `SELECT tl.email AS tl_email,
              CONCAT(tl.first_name, ' ', IFNULL(tl.last_name, '')) AS tl_name
         FROM employees r
         LEFT JOIN employees tl ON tl.employee_id = r.reporting_to
        WHERE r.employee_id = ? LIMIT 1`,
      [recruiterId]
    );
    return rows[0] ?? {};
  }

  /** Get HR Manager (TL) info for a candidate's recruiter */
  async _getHRManagerForCandidate(candidateId) {
    if (!candidateId) return {};
    const res  = await callProcedure('sp_rec_get_candidate(?)', [candidateId]);
    const cand = (res[0] ?? [])[0];
    if (!cand) return {};
    const recruiterId = cand.recruiter_id || cand.recruiter_employee_id || null;
    return this._getRecruiterTL(recruiterId);
  }

  async list({ candidateId, jobReqId, level, status, search, roleId, recEmpId, limit = 20, offset = 0 } = {}) {
    const results = await callProcedure(
      'sp_rec_list_interviews(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [candidateId || null, jobReqId || null, level || null, status || null, search || null, roleId || null, recEmpId || null, limit, offset]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getById(interviewId) {
    const results = await callProcedure('sp_rec_get_interview(?)', [interviewId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new ApiError(404, 'Interview not found');
    return row;
  }

  async schedule(data, scheduledBy, ip) {
    const results = await callProcedure(
      'sp_rec_schedule_interview(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @interview_id, @interview_code)',
      [
        data.candidateId,
        data.jobReqId,
        data.level,
        data.interviewType,
        data.interviewDate,
        data.interviewTime || null,
        data.durationMinutes || null,
        data.interviewer || null,
        data.candidateType || 'External',
        data.teamsSubject || null,
        data.teamsParticipants || null,
        data.teamsStart || null,
        data.teamsEnd || null,
        scheduledBy,
        ip,
      ]
    );
    const row = (results[0] ?? [])[0];

    // Steps 4 & 7: Notify candidate + HR Manager when interview scheduled
    if (row) {
      const candidateEmail  = row.candidate_email || '';
      const candidateName   = row.candidate_name  || 'Candidate';
      const jobTitle        = row.job_title        || '';
      const level           = row.level            || '';
      const interviewDate   = row.interview_date   || null;
      const interviewTime   = row.interview_time   || '';
      const interviewType   = row.interview_type   || '';
      const interviewer     = row.interviewer       || '';
      const scheduledByName = row.scheduled_by_name || '';

      // Notify candidate
      if (candidateEmail) {
        notify.interviewScheduledCandidate({
          candidateEmail, candidateName, jobTitle, level,
          interviewDate, interviewTime, interviewType, interviewer,
        });
      }

      // Notify HR Manager (TL of candidate's recruiter)
      if (data.candidateId) {
        this._getHRManagerForCandidate(data.candidateId).then(({ tl_email: tlEmail, tl_name: tlName }) => {
          if (tlEmail) {
            notify.interviewScheduledHR({
              hrEmail: tlEmail,
              hrName:  tlName || 'HR Manager',
              candidateName, jobTitle, level,
              interviewDate, interviewTime, interviewType, interviewer, scheduledByName,
            });
          }
        }).catch(() => {});
      }
    }

    return row;
  }

  async submitFeedback(interviewId, { feedbackStatus, feedbackComments, shortlisted }, submittedBy, ip) {
    const results = await callProcedure(
      'sp_rec_submit_feedback(?, ?, ?, ?, ?, ?)',
      [interviewId, feedbackStatus, feedbackComments || null, shortlisted ? 1 : 0, submittedBy, ip]
    );
    const row = (results[0] ?? [])[0];

    if (row) {
      const email       = row.candidate_email || row.email || '';
      const name        = row.candidate_name  || row.name  || 'Candidate';
      const jobTitle    = row.job_title        || '';
      const level       = row.level            || '';
      const interviewer = row.interviewer       || '';
      const candidateId = row.candidate_id     || null;

      // Notify candidate on shortlist / rejection
      if (email) {
        if (shortlisted) {
          notify.candidateShortlisted({ candidateEmail: email, candidateName: name, jobTitle });
        } else if (feedbackStatus && feedbackStatus.toLowerCase().includes('reject')) {
          notify.candidateRejected({ candidateEmail: email, candidateName: name, jobTitle });
        }
      }

      // Step 5: Notify HR Manager of interview feedback
      if (candidateId) {
        this._getHRManagerForCandidate(candidateId).then(({ tl_email: tlEmail, tl_name: tlName }) => {
          if (tlEmail) {
            notify.interviewFeedbackToHR({
              hrEmail:         tlEmail,
              hrName:          tlName || 'HR Manager',
              candidateName:   name,
              jobTitle,
              level,
              feedbackStatus,
              feedbackComments,
              interviewerName: interviewer,
            });
          }
        }).catch(() => {});
      }
    }

    return row;
  }

  async setJoinUrl(interviewId, joinUrl) {
    await callProcedure('sp_rec_set_interview_join_url(?, ?)', [interviewId, joinUrl]);
  }

  async cancel(interviewId, cancelledBy, ip) {
    const results = await callProcedure(
      'sp_rec_cancel_interview(?, ?, ?)',
      [interviewId, cancelledBy, ip]
    );
    return (results[0] ?? [])[0];
  }
}

module.exports = new InterviewService();
