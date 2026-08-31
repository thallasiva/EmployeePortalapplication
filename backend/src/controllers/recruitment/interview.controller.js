'use strict';

const asyncHandler = require("express-async-handler");
const interviewSvc = require("../../services/recruitment/interview.service");
const teamsSvc     = require("../../services/teams.service");
const googleMeetSvc = require("../../services/googleMeet.service");
const zoomSvc      = require("../../services/zoom.service");
const { sendInterviewInvite } = require("../../services/interviewMailer.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse  = require("../../utils/ApiResponse");

// ── helpers ────────────────────────────────────────────────────────────────
function buildDateTimes(dateStr, timeStr, durationMins) {
  let year;
  let month;
  let day;
  if (dateStr instanceof Date && !Number.isNaN(dateStr.getTime())) {
    // Joi parses date-only ISO input at UTC midnight. Preserve that date.
    year = dateStr.getUTCFullYear();
    month = dateStr.getUTCMonth() + 1;
    day = dateStr.getUTCDate();
  } else {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ''));
    if (!match) throw new Error('Interview date must be a valid ISO date.');
    [, year, month, day] = match.map(Number);
  }
  const timeMatch = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(timeStr || '09:00');
  if (!timeMatch) throw new Error('Interview time must be in HH:mm format.');
  const h = Number(timeMatch[1]);
  const m = Number(timeMatch[2]);
  if (h > 23 || m > 59) throw new Error('Interview time must be in HH:mm format.');
  // Build using explicit numeric components — avoids all string-parsing ambiguity
  const startDt = new Date(year, month - 1, day, h, m, 0);
  if (Number.isNaN(startDt.getTime()) || startDt.getFullYear() !== year || startDt.getMonth() !== month - 1 || startDt.getDate() !== day) {
    throw new Error('Interview date is invalid.');
  }
  const endDt   = new Date(startDt.getTime() + (durationMins || 60) * 60000);
  const pad = n => String(n).padStart(2, '0');
  const toLocalISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  return { startDt, endDt, startISO: toLocalISO(startDt), endISO: toLocalISO(endDt), dateOnly: `${year}-${pad(month)}-${pad(day)}` };
}

// ── list ───────────────────────────────────────────────────────────────────
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await interviewSvc.list({
    candidateId: req.query.candidateId ? Number(req.query.candidateId) : undefined,
    jobReqId:    req.query.jobReqId    ? Number(req.query.jobReqId)    : undefined,
    level:       req.query.level,
    status:      req.query.status,
    search:      req.query.search,
    roleId:      user.roleId,
    recEmpId:    user.employeeId,
    limit,
    offset,
  });
  new ApiResponse(200, rows, 'Interviews fetched', buildMeta({ page, limit, total })).send(res);
});

// ── getOne ─────────────────────────────────────────────────────────────────
const getOne = asyncHandler(async (req, res) => {
  const data = await interviewSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, 'Interview fetched').send(res);
});

// ── schedule ───────────────────────────────────────────────────────────────
const schedule = asyncHandler(async (req, res) => {
  const interview    = await interviewSvc.schedule(req.body, req.user.userId, req.ip);
  const interviewType = req.body.interviewType;          // "Teams" | "GoogleMeet" | "Zoom" | "InPerson" | "Phone"
  const dateStr       = req.body.interviewDate;
  const timeStr       = req.body.interviewTime || '09:00';
  const durationMins  = Number(req.body.durationMinutes) || 60;

  // Fire-and-forget meeting creation + email for online platforms
  if (['Teams', 'GoogleMeet', 'Zoom'].includes(interviewType)) {
    setImmediate(async () => {
      try {
        const { startISO, endISO, dateOnly } = buildDateTimes(dateStr, timeStr, durationMins);
        let joinUrl = '';
        let zoomMeetingId = '';

        // ── Microsoft Teams ────────────────────────────────────────────────
        if (interviewType === 'Teams') {
          const result = await teamsSvc.createTeamsMeeting({
            subject:       req.body.teamsSubject || `Interview — ${interview.candidate_name}`,
            startDateTime: startISO,
            endDateTime:   endISO,
            candidateName: interview.candidate_name || 'Candidate',
          });
          joinUrl = result.joinUrl;
        }

        // ── Google Meet ────────────────────────────────────────────────────
        else if (interviewType === 'GoogleMeet') {
          const result = await googleMeetSvc.createGoogleMeetMeeting({
            summary:       `Interview — ${interview.candidate_name} | ${interview.job_title || ''}`,
            startDateTime: startISO,
            endDateTime:   endISO,
            candidateName: interview.candidate_name || 'Candidate',
            candidateEmail: interview.candidate_email || '',
          });
          joinUrl = result.joinUrl;
        }

        // ── Zoom ───────────────────────────────────────────────────────────
        else if (interviewType === 'Zoom') {
          const result = await zoomSvc.createZoomMeeting({
            topic:         `Interview — ${interview.candidate_name} | ${interview.job_title || ''}`,
            startDateTime: startISO,
            durationMins,
            candidateName: interview.candidate_name || 'Candidate',
            candidateEmail: interview.candidate_email || '',
          });
          joinUrl = result.joinUrl;
          zoomMeetingId = result.meetingId;
        }

        // Persist join URL
        if (joinUrl) await interviewSvc.setJoinUrl(interview.interview_id, joinUrl);
        if (zoomMeetingId) await interviewSvc.setZoomMeetingDetails(interview.interview_id, zoomMeetingId, joinUrl);

        // Collect all recipients: candidate + any extra addresses from toAddresses field
        const extraEmails = (req.body.toAddresses || '')
          .split(';').map(e => e.trim()).filter(e => e && e !== interview.candidate_email);
        const allRecipients = [interview.candidate_email, ...extraEmails].filter(Boolean);

        // Send email invite to all recipients
        for (const recipientEmail of allRecipients) {
          await sendInterviewInvite({
            candidateName:   interview.candidate_name,
            candidateEmail:  recipientEmail,
            interviewDate:   dateOnly,
            interviewTime:   timeStr,
            durationMinutes: durationMins,
            level:           req.body.level,
            interviewType,
            interviewer:     req.body.interviewer || '',
            jobTitle:        interview.job_title  || '',
            joinUrl,
            recruiterName:   req.user.name || 'Recruitment Team',
          });
        }

        console.log(`[${interviewType}] Meeting created + invite sent to: ${allRecipients.join(', ')}`);
      } catch (err) {
        console.error(`[${interviewType}] Failed to create meeting or send email:`, err.message);
        // Fallback: send basic scheduling email without a link so candidate is not left in the dark
        try {
          const { sendMail } = require("../../services/email.service");
          const notify = require("../../services/mailNotify.service");
          if (interview.candidate_email) {
            notify.interviewScheduledCandidate({
              candidateEmail: interview.candidate_email,
              candidateName:  interview.candidate_name,
              jobTitle:       interview.job_title || '',
              level:          req.body.level,
              interviewDate:  buildDateTimes(dateStr, timeStr, durationMins).dateOnly,
              interviewTime:  timeStr,
              interviewType,
              interviewer:    req.body.interviewer || '',
            });
          }
        } catch (fallbackErr) {
          console.error('[interview] Fallback email also failed:', fallbackErr.message);
        }
      }
    });
  }

  new ApiResponse(201, interview, 'Interview scheduled').send(res);
});

// ── feedback ───────────────────────────────────────────────────────────────
const submitFeedback = asyncHandler(async (req, res) => {
  const data = await interviewSvc.submitFeedback(
    Number(req.params.id), req.body, req.user.userId, req.ip
  );
  new ApiResponse(200, data, 'Feedback submitted').send(res);
});

const submitRecruiterFeedback = asyncHandler(async (req, res) => {
  const data = await interviewSvc.submitRecruiterFeedback(
    Number(req.params.id), req.body, req.user.userId, req.ip
  );
  new ApiResponse(200, data, 'Recruiter feedback submitted').send(res);
});

const cancel = asyncHandler(async (req, res) => {
  const current = await interviewSvc.getById(Number(req.params.id));
  if (current.interview_type === 'Zoom' && current.zoom_meeting_id) {
    await zoomSvc.cancelZoomMeeting(current.zoom_meeting_id);
  }
  const data = await interviewSvc.cancel(Number(req.params.id), req.user.userId, req.ip);
  new ApiResponse(200, data, 'Interview cancelled').send(res);
});

module.exports = { list, getOne, schedule, submitFeedback, submitRecruiterFeedback, cancel };
