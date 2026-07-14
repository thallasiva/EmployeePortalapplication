const { callProcedure } = require('../../config/db');
const BaseService = require('../base.service');
const ApiError = require('../../utils/ApiError');
const notify = require('../mailNotify.service');

class InterviewService extends BaseService {
  constructor() {
    super('rec_interviews', 'interview_id');
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
    return (results[0] ?? [])[0];
  }

  async submitFeedback(interviewId, { feedbackStatus, feedbackComments, shortlisted }, submittedBy, ip) {
    const results = await callProcedure(
      'sp_rec_submit_feedback(?, ?, ?, ?, ?, ?)',
      [interviewId, feedbackStatus, feedbackComments || null, shortlisted ? 1 : 0, submittedBy, ip]
    );
    const row = (results[0] ?? [])[0];

    if (row && (row.candidate_email || row.email)) {
      const email    = row.candidate_email || row.email;
      const name     = row.candidate_name  || row.name || 'Candidate';
      const jobTitle = row.job_title       || row.position_name || '';
      if (shortlisted) {
        notify.candidateShortlisted({ candidateEmail: email, candidateName: name, jobTitle });
      } else if (feedbackStatus && feedbackStatus.toLowerCase().includes('reject')) {
        notify.candidateRejected({ candidateEmail: email, candidateName: name, jobTitle });
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
