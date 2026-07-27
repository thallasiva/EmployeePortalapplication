'use strict';

const asyncHandler = require("express-async-handler");
const interviewSvc = require("../../services/recruitment/interview.service");
const teamsSvc = require("../../services/teams.service");
const { sendInterviewInvite } = require("../../services/interviewMailer.service");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await interviewSvc.list({
    candidateId: req.query.candidateId ? Number(req.query.candidateId) : undefined,
    jobReqId: req.query.jobReqId ? Number(req.query.jobReqId) : undefined,
    level: req.query.level,
    status: req.query.status,
    search: req.query.search,
    roleId: user.roleId,
    recEmpId: user.employeeId,
    limit,
    offset
  });
  new ApiResponse(200, rows, "Interviews fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await interviewSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Interview fetched").send(res);
});

const schedule = asyncHandler(async (req, res) => {

  const interview = await interviewSvc.schedule(req.body, req.user.userId, req.ip);


  if (req.body.interviewType === "Teams") {
    setImmediate(async () => {
      try {

        const dateStr = req.body.interviewDate;
        const timeStr = req.body.interviewTime || "09:00";
        const durationMins = Number(req.body.durationMinutes) || 60;
        const [h, m] = timeStr.split(":").map(Number);
        const startDt = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
        const endDt = new Date(startDt.getTime() + durationMins * 60000);
        const toISO = (d) => d.toISOString().replace(/\.\d{3}Z$/, "");

        const { joinUrl } = await teamsSvc.createTeamsMeeting({
          subject: req.body.teamsSubject || `Interview — ${interview.candidate_name}`,
          startDateTime: toISO(startDt),
          endDateTime: toISO(endDt),
          candidateName: interview.candidate_name || "Candidate"
        });


        await interviewSvc.setJoinUrl(interview.interview_id, joinUrl);


        await sendInterviewInvite({
          candidateName: interview.candidate_name,
          candidateEmail: interview.candidate_email,
          interviewDate: dateStr,
          interviewTime: timeStr,
          durationMinutes: durationMins,
          level: req.body.level,
          interviewType: req.body.interviewType,
          interviewer: req.body.interviewer || "",
          jobTitle: interview.job_title || "",
          joinUrl,
          recruiterName: req.user.name || "Recruitment Team"
        });

        console.log(`[Teams] Meeting created + invite sent to ${interview.candidate_email}`);
      } catch (err) {

        console.error("[Teams] Failed to create meeting or send email:", err.message);
      }
    });
  }

  new ApiResponse(201, interview, "Interview scheduled").send(res);
});

const submitFeedback = asyncHandler(async (req, res) => {
  const data = await interviewSvc.submitFeedback(
    Number(req.params.id),
    req.body,
    req.user.userId,
    req.ip
  );
  new ApiResponse(200, data, "Feedback submitted").send(res);
});

const submitRecruiterFeedback = asyncHandler(async (req, res) => {
  const data = await interviewSvc.submitRecruiterFeedback(
    Number(req.params.id),
    req.body,
    req.user.userId,
    req.ip
  );
  new ApiResponse(200, data, "Recruiter feedback submitted").send(res);
});

const cancel = asyncHandler(async (req, res) => {
  const data = await interviewSvc.cancel(Number(req.params.id), req.user.userId, req.ip);
  new ApiResponse(200, data, "Interview cancelled").send(res);
});

module.exports = { list, getOne, schedule, submitFeedback, submitRecruiterFeedback, cancel };
