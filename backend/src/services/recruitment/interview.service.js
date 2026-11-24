const crypto = require('crypto');
const { callProcedure, query, pool } = require('../../config/db');
const BaseService = require('../base.service');
const ApiError = require('../../utils/ApiError');
const notify = require('../mailNotify.service');
const interviewerAvailabilitySvc = require('./interviewerAvailability.service');
const { candidateLockName } = require('./candidatePipeline.service');
class InterviewService extends BaseService {
  constructor() {
    super('rec_interviews', 'interview_id');
  }
  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const results = await callProcedure('sp_rec_get_recruiter_team_lead(?)', [recruiterId]);
    return (results[0] ?? [])[0] ?? {};
  }
  async _getHRManagerForCandidate(candidateId) {
    if (!candidateId) return {};
    const res = await callProcedure('sp_rec_get_candidate(?)', [candidateId]);
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
    const rows = results[0] ?? [];
    if (rows.length) {
      const ratings = await query(
        'SELECT interview_id, feedback_rating FROM rec_interviews WHERE interview_id IN (?)',
        [rows.map((row) => row.interview_id)]
      );
      const ratingById = new Map(ratings.map((row) => [Number(row.interview_id), row.feedback_rating]));
      rows.forEach((row) => { row.feedback_rating = ratingById.get(Number(row.interview_id)) ?? null; });
    }
    return { rows, total: (results[1] ?? [])[0]?.total ?? 0 };
  }
  async getById(interviewId) {
    const results = await callProcedure('sp_rec_get_interview(?)', [interviewId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new ApiError(404, 'Interview not found');
    const [rating] = await query('SELECT feedback_rating FROM rec_interviews WHERE interview_id = ?', [interviewId]);
    row.feedback_rating = rating?.feedback_rating ?? null;
    return row;
  }
  async schedule(data, scheduledBy, ip) {
    const connection = await pool.getConnection();
    const interviewer = String(data.interviewer || '').trim().toLowerCase();
    const lockName = `rec_iv_${crypto.createHash('sha256').update(interviewer).digest('hex').slice(0, 40)}`;
    const lockNames = [candidateLockName(data.candidateId), lockName].sort();
    const acquiredLocks = [];
    let row;
    try {
      for (const name of lockNames) {
        const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [name]);
        if (Number(lockRows[0]?.acquired) !== 1) {
          throw new ApiError(409, 'Could not reserve this candidate’s or interviewer’s schedule. Please try again.');
        }
        acquiredLocks.push(name);
      }
      const [candidates] = await connection.query(
        'SELECT status FROM rec_candidates WHERE candidate_id = ? AND deleted_at IS NULL LIMIT 1',
        [data.candidateId]
      );
      if (!candidates.length) throw new ApiError(404, 'Candidate not found');
      if (!['Applied', 'Work in Progress', 'Screening', 'Schedule Interview', 'Interview Scheduled'].includes(candidates[0].status)) {
        throw new ApiError(409, 'Interviews can only be scheduled for candidates in an active screening or interview stage.');
      }
      const [activeInterviews] = await connection.query(
        "SELECT interview_id FROM rec_interviews WHERE candidate_id = ? AND status = 'Scheduled' LIMIT 1",
        [data.candidateId]
      );
      if (activeInterviews.length) {
        throw new ApiError(409, 'Complete or cancel the candidate’s active interview before scheduling another round.');
      }
      await interviewerAvailabilitySvc.assertSlotAvailable(connection, {
        interviewer,
        interviewDate: data.interviewDate,
        interviewTime: data.interviewTime || '09:00',
        durationMinutes: Number(data.durationMinutes) || 60,
      });
      const [results] = await connection.query(
        'CALL sp_rec_schedule_interview(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @interview_id, @interview_code)',
        [
      data.candidateId,
      data.jobReqId,
      data.level,
      data.interviewType,
      data.interviewDate,
      // interview_time and interviewer are NOT NULL; mirror the controller's 09:00 default.
      data.interviewTime || '09:00',
      data.durationMinutes || null,
      data.interviewer || '',
      data.candidateType || 'External',
      data.teamsSubject || null,
      data.teamsParticipants || null,
      data.teamsStart || null,
      data.teamsEnd || null,
      scheduledBy,
       ip]
      );
      row = (results[0] ?? [])[0];
    } finally {
      try {
        for (const name of acquiredLocks.reverse()) {
          await connection.query('SELECT RELEASE_LOCK(?)', [name]);
        }
      } finally {
        connection.release();
      }
    }
    if (row) {
      const candidateEmail = row.candidate_email || '';
      const candidateName = row.candidate_name || 'Candidate';
      const jobTitle = row.job_title || '';
      const level = row.level || '';
      const interviewDate = row.interview_date || null;
      const interviewTime = row.interview_time || '';
      const interviewType = row.interview_type || '';
      const interviewer = row.interviewer || '';
      const scheduledByName = row.scheduled_by_name || '';
      // For online meeting types (GoogleMeet/Zoom/Teams), skip the basic email here —
      // the controller setImmediate sends a richer invite WITH the meeting link.
      const onlineMeetingTypes = ["Teams", "GoogleMeet", "Zoom"];
      // Use data.interviewType from request body — row.interview_type may be null if proc does not return it
      const effectiveType = data.interviewType || interviewType;
      if (candidateEmail && !onlineMeetingTypes.includes(effectiveType)) {
        notify.interviewScheduledCandidate({
          candidateEmail, candidateName, jobTitle, level,
          interviewDate, interviewTime, interviewType, interviewer
        });
      }
      if (data.candidateId) {
        this._getHRManagerForCandidate(data.candidateId).then(({ tl_email: tlEmail, tl_name: tlName }) => {
          if (tlEmail) {
            notify.interviewScheduledHR({
              hrEmail: tlEmail,
              hrName: tlName || 'HR Manager',
              candidateName, jobTitle, level,
              interviewDate, interviewTime, interviewType, interviewer, scheduledByName
            });
          }
        }).catch(() => {});
      }
    }
    return row;
  }
  async submitFeedback(interviewId, { feedbackStatus, feedbackComments, feedbackRating, shortlisted }, submittedBy, ip) {
    const [existing] = await query('SELECT status FROM rec_interviews WHERE interview_id = ? LIMIT 1', [interviewId]);
    if (existing?.status === 'Completed') {
      await query(
        `UPDATE rec_interviews
            SET feedback_comments = ?, feedback_rating = COALESCE(?, feedback_rating)
          WHERE interview_id = ? AND status = 'Completed'`,
        [feedbackComments || null, feedbackRating == null ? null : Number(feedbackRating), interviewId]
      );
      return this.getById(interviewId);
    }
    const actionMap = {
      'Shortlist': { feedbackStatus: 'Selected', shortlisted: true, candidateStatus: 'Shortlisted' },
      'Move to Next Round': { feedbackStatus: 'Selected', shortlisted: false, candidateStatus: 'Schedule Interview' },
      'Reject / Drop': { feedbackStatus: 'Not Selected', shortlisted: false, candidateStatus: 'Rejected' },
    };
    const action = actionMap[feedbackStatus];
    if (!action) throw new ApiError(400, 'Invalid interview feedback action');
    const [interviewRef] = await query(
      "SELECT candidate_id FROM rec_interviews WHERE interview_id = ? AND status = 'Scheduled' LIMIT 1",
      [interviewId]
    );
    if (!interviewRef) throw new ApiError(404, 'Scheduled interview not found');

    const connection = await pool.getConnection();
    const lockName = candidateLockName(interviewRef.candidate_id);
    let lockAcquired = false;
    let row;
    try {
      const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
      if (Number(lockRows[0]?.acquired) !== 1) {
        throw new ApiError(409, 'Could not reserve this candidate’s pipeline update. Please try again.');
      }
      lockAcquired = true;
      const [candidate] = await connection.query(
        `SELECT c.status
           FROM rec_interviews i
           JOIN rec_candidates c ON c.candidate_id = i.candidate_id
          WHERE i.interview_id = ? AND i.status = 'Scheduled'
          LIMIT 1`,
        [interviewId]
      );
      if (!candidate.length) throw new ApiError(404, 'Scheduled interview not found');
      if (!['Interview Scheduled', 'Schedule Interview'].includes(candidate[0].status)) {
        throw new ApiError(409, 'Candidate is no longer in an active interview stage.');
      }
      const [results] = await connection.query(
        'CALL sp_rec_submit_feedback(?, ?, ?, ?, ?, ?)',
        [interviewId, action.feedbackStatus, feedbackComments || null, action.shortlisted ? 1 : 0, submittedBy, ip]
      );
      row = (results[0] ?? [])[0];
      if (row && feedbackRating != null) {
        await connection.query('UPDATE rec_interviews SET feedback_rating = ? WHERE interview_id = ?', [Number(feedbackRating), interviewId]);
        row.feedback_rating = Number(feedbackRating);
      }
      if (row) {
        await connection.query(
          'CALL sp_rec_update_candidate_status(?, ?, ?, ?)',
          [row.candidate_id, action.candidateStatus, submittedBy, ip]
        );
      }
    } finally {
      try {
        if (lockAcquired) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
      } finally {
        connection.release();
      }
    }
    if (row) {
      const email = row.candidate_email || row.email || '';
      const name = row.candidate_name || row.name || 'Candidate';
      const jobTitle = row.job_title || '';
      const level = row.level || '';
      const interviewer = row.interviewer || '';
      const candidateId = row.candidate_id || null;
      if (email) {
        if (action.candidateStatus === 'Rejected') {
          notify.candidateRejected({ candidateEmail: email, candidateName: name, jobTitle });
        }
      }
      if (candidateId) {
        this._getHRManagerForCandidate(candidateId).then(({ tl_email: tlEmail, tl_name: tlName }) => {
          if (tlEmail) {
            notify.interviewFeedbackToHR({
              hrEmail: tlEmail,
              hrName: tlName || 'HR Manager',
              candidateName: name,
              jobTitle,
              level,
              feedbackStatus,
              feedbackComments,
              interviewerName: interviewer
            });
          }
        }).catch(() => {});
      }
    }
    return row;
  }
  async submitRecruiterFeedback(interviewId, { feedbackStatus, feedbackComments }, submittedBy, ip) {
    const results = await callProcedure(
      'sp_rec_submit_recruiter_feedback(?, ?, ?, ?, ?)',
      [interviewId, feedbackStatus, feedbackComments || null, submittedBy, ip]
    );
    return (results[0] ?? [])[0];
  }
  async setJoinUrl(interviewId, joinUrl) {
    await callProcedure('sp_rec_set_interview_join_url(?, ?)', [interviewId, joinUrl]);
  }
  async setZoomMeetingDetails(interviewId, meetingId, joinUrl) {
    await callProcedure('sp_rec_set_zoom_meeting_details(?, ?, ?)', [interviewId, meetingId, joinUrl]);
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
