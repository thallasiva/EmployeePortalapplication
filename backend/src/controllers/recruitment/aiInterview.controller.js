'use strict';
const asyncHandler   = require('express-async-handler');
const aiSvc          = require('../../services/recruitment/aiInterview.service');
const { callProcedure, query } = require('../../config/db');
const ApiResponse    = require('../../utils/ApiResponse');
const { sendMailNow } = require('../../services/email.service');
async function queryOptional(sql, params) {
  try {
    return await query(sql, params);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return [];
    throw error;
  }
}
async function getCandidateResumeContext(candidateId) {
  const context = { text: '', skills: [] };
  const dynamicRows = await queryOptional(
    `SELECT field_name, field_value
       FROM rec_candidate_dynamic_fields
      WHERE candidate_id = ? AND field_name IN ('rawText', 'resume_text', 'summary', 'skills')
      ORDER BY created_date DESC, id DESC`,
    [candidateId]);
  for (const row of dynamicRows) {
    let value;
    try {
      value = JSON.parse(row.field_value);
    } catch {
      value = row.field_value;
    }
    if (row.field_name === 'skills') {
      context.skills.push(...(Array.isArray(value) ? value : String(value || '').split(/[,;|\n]+/)));
    } else if (typeof value === 'string' && value.trim() && !context.text) {
      context.text = value;
    } else if (value && typeof value === 'object') {
      if (Array.isArray(value.skills)) context.skills.push(...value.skills);
      if (!context.text) context.text = value.rawText || value.resume_text || value.summary || '';
    }
  }
  const normalizedSkills = await queryOptional(
    `SELECT skill_name FROM rec_candidate_skills WHERE candidate_id = ? AND source = 'resume' ORDER BY skill_name`,
    [candidateId]);
  context.skills.push(...normalizedSkills.map((row) => row.skill_name).filter(Boolean));
  const parserLogs = await queryOptional(
    `SELECT full_json
       FROM rec_parser_logs
      WHERE candidate_id = ? AND parser_status = 'SUCCESS'
      ORDER BY created_date DESC, log_id DESC
      LIMIT 1`,
    [candidateId]);
  try {
    const parsed = JSON.parse(parserLogs[0]?.full_json || '{}');
    if (!context.text) context.text = parsed.rawText || parsed.resume_text || parsed.summary || '';
    if (Array.isArray(parsed.skills)) context.skills.push(...parsed.skills);
  } catch {
    // The dynamic fields and normalized skills remain usable if an older parser log is malformed.
  }
  context.skills = [...new Set(context.skills.map((skill) => String(skill).trim()).filter(Boolean))];
  return context;
}
// ── send invite email ──────────────────────────────────────────────────────
async function sendAIInterviewInvite({ candidateEmail, candidateName, jobTitle, token, expiresAt, recruiterName, durationMinutes, questionCount }) {
  const link = `${process.env.FRONTEND_URL || 'https://d3snrdmpdzb1yf.cloudfront.net'}/ai-interview/${token}`;
  const expiryStr = new Date(expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return sendMailNow({
    to: candidateEmail,
    subject: `AI Interview Invitation — ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f8fafc;border-radius:10px;">
        <h2 style="color:#0E7C86;">AI Interview Invitation</h2>
        <p>Dear <strong>${candidateName}</strong>,</p>
        <p>You have been invited to complete an AI-powered interview for the position of <strong>${jobTitle}</strong>.</p>
        <p>The interview includes up to ${questionCount} role-specific questions and adaptive follow-ups based on your experience and responses. You can complete it at your own pace before the deadline.</p>
        <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #0E7C86;margin:20px 0;">
          <p><strong>Interview Link:</strong><br/>
          <a href="${link}" style="color:#0E7C86;font-size:16px;">${link}</a></p>
          <p><strong>Deadline:</strong> ${expiryStr} IST</p>
          <p><strong>Duration:</strong> Up to ${durationMinutes} minutes</p>
        </div>
        <p style="color:#666;font-size:13px;">Please ensure you are in a quiet environment. Your answers will be evaluated by our AI system and reviewed by the recruitment team.</p>
        <p>Best of luck!<br/>${recruiterName || 'Recruitment Team'}</p>
      </div>
    `,
  });
}
// ── POST /ai-interviews  — recruiter creates session ──────────────────────
const create = asyncHandler(async (req, res) => {
  const { candidateId, jobReqId, durationMinutes, questionCount, interviewMode, quickResponseTimeoutSeconds } = req.body;
  if (!candidateId || !jobReqId) {
    return res.status(400).json({ success: false, message: 'candidateId and jobReqId are required' });
  }
  const requestedQuestionCount = questionCount == null ? 8 : Number(questionCount);
  if (!Number.isInteger(requestedQuestionCount) || requestedQuestionCount < 3 || requestedQuestionCount > 20) {
    return res.status(400).json({ success: false, message: 'questionCount must be an integer between 3 and 20' });
  }
  const requestedQuickTimeout = quickResponseTimeoutSeconds == null ? 20 : Number(quickResponseTimeoutSeconds);
  if (![0, 20, 30, 45, 60, 90, 120].includes(requestedQuickTimeout)) {
    return res.status(400).json({ success: false, message: 'quickResponseTimeoutSeconds must be 0, 20, 30, 45, 60, 90, or 120' });
  }
  // Fetch candidate + job details
  const cRes = await callProcedure('sp_rec_get_candidate(?)', [Number(candidateId)]);
  const candidate = (cRes[0] ?? [])[0];
  const jRes = await callProcedure('sp_rec_get_job_request(?)', [Number(jobReqId)]);
  const job = (jRes[0] ?? [])[0];
  if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
  if (!job)       return res.status(404).json({ success: false, message: 'Job not found' });
  const resumeContext = await getCandidateResumeContext(Number(candidateId));
  // Store interview context only. The engine generates one question after
  // each response; candidates never receive a pre-generated question list.
  const profile = {
    jobTitle: job.title || job.job_title || 'Position',
    domain: job.domain || job.industry || '',
    jobDescription: job.description || job.job_description || '',
    requiredSkills: job.required_skills || job.skill_set || job.skills || '',
    preferredSkills: job.preferred_skills || job.preferred_skill_set || '',
    candidateSkills: candidate.skills || candidate.candidate_skills || candidate.skill_set || '',
    resumeSkills: resumeContext.skills,
    totalExperience: candidate.total_experience || '',
    relevantExperience: candidate.relevant_experience || '',
    resume: candidate.resume_text || candidate.resume_summary || resumeContext.text,
  };
  const { token, expiresAt } = await aiSvc.createAdaptiveSession({
    candidateId:    Number(candidateId),
    jobReqId:       Number(jobReqId),
    recruiterId:    req.user.employeeId,
    candidateName:  candidate.name || candidate.candidate_name || 'Candidate',
    candidateEmail: candidate.email || candidate.candidate_email || '',
    jobTitle:       profile.jobTitle,
    profile,
    durationMinutes: Number(durationMinutes) || 30,
    questionCount: requestedQuestionCount,
    quickResponseTimeoutSeconds: requestedQuickTimeout,
    interviewMode: ['screening', 'balanced', 'deep_dive'].includes(interviewMode) ? interviewMode : 'balanced',
    expiresHours:   48,
  });
  // Send email invite without blocking session creation when SMTP is unavailable.
  let inviteEmail = { sent: false, error: 'SMTP not configured' };
  try {
    inviteEmail = await sendAIInterviewInvite({
      candidateEmail: candidate.email || candidate.candidate_email,
      candidateName:  candidate.name  || candidate.candidate_name,
      jobTitle:       job.title || job.job_title,
      token,
      expiresAt,
      recruiterName:  req.user.name || 'Recruitment Team',
      durationMinutes: Number(durationMinutes) || 30,
      questionCount: requestedQuestionCount,
    });
    if (!inviteEmail.sent) {
      console.warn('[AIInterview] Invite not sent:', inviteEmail.error || 'SMTP unavailable');
    }
  } catch (err) {
    console.error('[AIInterview] Email delivery skipped:', err.message);
  }
  new ApiResponse(
    201,
    { token, expiresAt, durationMinutes: Number(durationMinutes) || 30, questionCount: requestedQuestionCount, quickResponseTimeoutSeconds: requestedQuickTimeout, inviteEmail },
    inviteEmail.sent ? 'AI interview session created and invite sent' : 'AI interview session created; invite email was not sent'
  ).send(res);
});
// ── GET /ai-interviews  — recruiter lists sessions ─────────────────────────
const list = asyncHandler(async (req, res) => {
  const sessions = await aiSvc.listByRecruiter({
    recruiterId: req.user.employeeId,
    limit:  Number(req.query.limit)  || 20,
    offset: Number(req.query.offset) || 0,
  });
  new ApiResponse(200, sessions, 'AI interview sessions fetched').send(res);
});
// ── GET /ai-interviews/report/:id  — recruiter views report ───────────────
const getReport = asyncHandler(async (req, res) => {
  const report = await aiSvc.getReport(Number(req.params.id));
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
  // Parse stored JSON blobs
  let answers = [];
  let evaluation = {};
  try { answers = JSON.parse(report.answers_json || '[]'); } catch {}
  try { evaluation = JSON.parse(report.evaluation_json || '{}'); } catch {}
  // Build merged questions array: Q text + candidate answer + AI score + feedback
  const questionScores = evaluation.questionScores || [];
  const questions = answers.map((entry, i) => {
    const qs = questionScores[i] || {};
    const qText = typeof entry.question === 'object' ? entry.question?.question : String(entry.question || '');
    return {
      question: qText,
      answer:   entry.answer || '',
      skill:    entry.question?.skill || qs.skill || '',
      score:    qs.score ?? null,
      feedback: qs.feedback || '',
      difficulty: entry.question?.difficulty || '',
      answerQuality: entry.answerQuality || '',
      answeredAt: entry.answeredAt || null,
      answerStatus: entry.status || 'answered',
      timedOut: Boolean(entry.timedOut),
    };
  });
  const payload = {
    session_id:     report.session_id,
    candidate_name: report.candidate_name,
    candidate_email:report.candidate_email,
    job_title:      report.job_title,
    status:         report.status,
    submitted_at:   report.submitted_at,
    overall_score:  report.overall_score,
    recommendation: report.recommendation,
    evaluationMethod: evaluation.evaluationMethod || 'unknown',
    evaluationNote: evaluation.evaluationNote || '',
    // Evaluation fields
    summary:        evaluation.summary || '',
    strengths:      evaluation.strengths || [],
    improvements:   evaluation.improvements || [],
    technicalSkills:    evaluation.technicalSkills,
    practicalExperience:evaluation.practicalExperience,
    problemSolving:     evaluation.problemSolving,
    domainKnowledge:    evaluation.domainKnowledge,
    communication:      evaluation.communication,
    roleFit:            evaluation.roleFit,
    experienceAlignment:evaluation.experienceAlignment,
    skillScores:        evaluation.skillScores || [],
    verifiedSkills:     evaluation.verifiedSkills || [],
    potentialSkillGaps: evaluation.potentialSkillGaps || [],
    resumeVsInterviewValidation: evaluation.resumeVsInterviewValidation || {},
    recommendationReason: evaluation.recommendationReason || '',
    hiringRisk:     evaluation.hiringRisk || '',
    nextSteps:      evaluation.nextSteps || [],
    questions,  // merged Q&A with scores
  };
  new ApiResponse(200, payload, 'Report fetched').send(res);
});
// ── PUBLIC: GET /public/ai-interview/:token  — candidate loads interview ──
const getSession = asyncHandler(async (req, res) => {
  const session = await aiSvc.getSession(req.params.token);
  if (!session) return res.status(404).json({ success: false, message: 'Interview not found or expired' });
  if (session.status === 'completed') return res.status(410).json({ success: false, message: 'This interview has already been submitted' });
  if (new Date(session.expires_at) < new Date()) return res.status(410).json({ success: false, message: 'This interview link has expired' });
  const state = aiSvc.parseState(session.questions_json);
  new ApiResponse(200, {
    sessionId:      session.session_id,
    candidateName:  session.candidate_name,
    candidateEmail: session.candidate_email,
    jobTitle:       session.job_title,
    expiresAt:      state.expiresAt || null,
    invitationExpiresAt: session.expires_at,
    durationSeconds: state.durationSeconds,
    totalQuestions: state.questionCount || 8,
    quickResponseTimeoutSeconds: state.quickResponseTimeoutSeconds ?? 20,
    remainingSeconds: aiSvc.getRemainingSeconds(state),
    started: Boolean(state.startedAt),
  }, 'Session loaded').send(res);
});
// PUBLIC: POST /public/ai-interview/:token/start
const start = asyncHandler(async (req, res) => {
  const started = await aiSvc.startAdaptiveSession(req.params.token);
  if (!started) return res.status(404).json({ success: false, message: 'Interview not found or expired' });
  const { session, state } = started;
  if (session.status === 'completed') return res.status(410).json({ success: false, message: 'This interview has already been submitted' });
  if (started.complete) return new ApiResponse(200, { complete: true }, 'Interview already completed').send(res);
  const savedDraft = String(state.currentDraft?.questionId || '') === String(state.currentQuestion?.id || '') ? state.currentDraft.draft : '';
  new ApiResponse(200, { question: state.currentQuestion, questionNumber: state.transcript.length + 1, remainingSeconds: aiSvc.getRemainingSeconds(state), startedAt: state.startedAt, expiresAt: state.expiresAt, savedDraft }, 'Interview started').send(res);
});
const sendOtp = asyncHandler(async (req, res) => {
  const result = await aiSvc.issueOtp(req.params.token);
  if (!result) return res.status(404).json({ success: false, message: 'Interview not found or expired' });
  if (!result.sent) {
    // In development, don't hard-block on undelivered email — let the candidate
    // proceed to the OTP screen and read the code from the server console / this
    // response. Production still returns 503 so a real email must be delivered.
    if (result.devCode) {
      return new ApiResponse(200, { sent: false, devMode: true, devCode: result.devCode },
        'SMTP not configured — dev code returned (check server console). Configure SMTP for real delivery.').send(res);
    }
    return res.status(503).json({ success: false, message: result.error || 'Verification email could not be sent' });
  }
  new ApiResponse(200, { sent: true }, 'Verification code sent').send(res);
});
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await aiSvc.verifyOtp(req.params.token, req.body.code);
  if (!result.valid) return res.status(400).json({ success: false, message: result.error });
  new ApiResponse(200, { verified: true }, 'Verification successful').send(res);
});
// PUBLIC: POST /public/ai-interview/:token/answer
const answer = asyncHandler(async (req, res) => {
  if (!String(req.body.answer || '').trim()) return res.status(400).json({ success: false, message: 'An answer is required' });
  const result = await aiSvc.answerAdaptiveSessionV2({ token: req.params.token, answer: req.body.answer, questionId: req.body.questionId });
  if (!result) return res.status(410).json({ success: false, message: 'Interview is unavailable, expired, or already completed' });
  if (result.conflict) return res.status(409).json({ success: false, message: 'This answer belongs to an outdated question. The current question has been restored.' });
  // SECURITY: never return evaluation/score data to candidate — strip it before responding
  const safeResult = result.complete
    ? { complete: true }
    : { complete: false, question: result.question, questionNumber: result.questionNumber, remainingSeconds: result.remainingSeconds, expiresAt: result.expiresAt };
  new ApiResponse(200, safeResult, result.complete ? 'Interview submitted successfully' : 'Next question ready').send(res);
});
// ── PUBLIC: POST /public/ai-interview/:token/submit  — candidate submits ──
const submit = asyncHandler(async (req, res) => {
  const completed = await aiSvc.completeAdaptiveSession(req.params.token, 'candidate_completed');
  if (!completed) return res.status(410).json({ success: false, message: 'Interview is unavailable or already completed' });
  // SECURITY: do not return evaluation data to the candidate
  new ApiResponse(200, { complete: true }, 'Interview submitted successfully. Thank you!').send(res);
});
// ── PUBLIC: POST /public/ai-interview/:token/proctoring ────────────────────
const logProctoring = asyncHandler(async (req, res) => {
  const { event, count, timestamp } = req.body;
  if (!event) return res.status(400).json({ success: false, message: 'event is required' });
  const result = await aiSvc.logProctoringEvent(req.params.token, {
    event: String(event).toUpperCase().slice(0, 40),
    count: Number(count) || 1,
    timestamp: timestamp || new Date().toISOString(),
    ip: req.ip,
  });
  if (result?.autoSubmitted) {
    return new ApiResponse(200, { autoSubmitted: true }, 'Interview auto-submitted due to proctoring violations').send(res);
  }
  new ApiResponse(200, result, 'Proctoring event logged').send(res);
});
// ── PUBLIC: POST /public/ai-interview/:token/draft ─────────────────────────
const saveDraft = asyncHandler(async (req, res) => {
  const { questionId, draft } = req.body;
  await aiSvc.saveDraft(req.params.token, questionId, draft || '');
  new ApiResponse(200, {}, 'Draft saved').send(res);
});
module.exports = { create, list, getReport, getSession, start, sendOtp, verifyOtp, answer, submit, logProctoring, saveDraft };
