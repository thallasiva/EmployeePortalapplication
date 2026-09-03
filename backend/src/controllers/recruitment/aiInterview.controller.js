'use strict';

const asyncHandler   = require('express-async-handler');
const aiSvc          = require('../../services/recruitment/aiInterview.service');
const { callProcedure } = require('../../config/db');
const ApiResponse    = require('../../utils/ApiResponse');
const nodemailer     = require('nodemailer');
const { email: emailCfg } = require('../../config/env');

// ── send invite email ──────────────────────────────────────────────────────
async function sendAIInterviewInvite({ candidateEmail, candidateName, jobTitle, token, expiresAt, recruiterName }) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ai-interview/${token}`;
  const transporter = nodemailer.createTransport({
    host: emailCfg.host, port: emailCfg.port, secure: emailCfg.secure,
    auth: { user: emailCfg.user, pass: emailCfg.pass },
  });
  const expiryStr = new Date(expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  await transporter.sendMail({
    from: emailCfg.from,
    to: candidateEmail,
    subject: `AI Interview Invitation — ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f8fafc;border-radius:10px;">
        <h2 style="color:#0E7C86;">AI Interview Invitation</h2>
        <p>Dear <strong>${candidateName}</strong>,</p>
        <p>You have been invited to complete an AI-powered first-round interview for the position of <strong>${jobTitle}</strong>.</p>
        <p>This interview consists of 8 questions covering technical, behavioral, and situational topics. You can complete it at your own pace before the deadline.</p>
        <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #0E7C86;margin:20px 0;">
          <p><strong>Interview Link:</strong><br/>
          <a href="${link}" style="color:#0E7C86;font-size:16px;">${link}</a></p>
          <p><strong>Deadline:</strong> ${expiryStr} IST</p>
          <p><strong>Duration:</strong> Approximately 30–45 minutes</p>
        </div>
        <p style="color:#666;font-size:13px;">Please ensure you are in a quiet environment. Your answers will be evaluated by our AI system and reviewed by the recruitment team.</p>
        <p>Best of luck!<br/>${recruiterName || 'Recruitment Team'}</p>
      </div>
    `,
  });
}

// ── POST /ai-interviews  — recruiter creates session ──────────────────────
const create = asyncHandler(async (req, res) => {
  const { candidateId, jobReqId, durationMinutes } = req.body;
  if (!candidateId || !jobReqId) {
    return res.status(400).json({ success: false, message: 'candidateId and jobReqId are required' });
  }

  // Fetch candidate + job details
  const cRes = await callProcedure('sp_rec_get_candidate(?)', [Number(candidateId)]);
  const candidate = (cRes[0] ?? [])[0];
  const jRes = await callProcedure('sp_rec_get_job_request(?)', [Number(jobReqId)]);
  const job = (jRes[0] ?? [])[0];

  if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
  if (!job)       return res.status(404).json({ success: false, message: 'Job not found' });

  // Store interview context only. The engine generates one question after
  // each response; candidates never receive a pre-generated question list.
  const profile = {
    jobTitle: job.title || job.job_title || 'Position',
    domain: job.domain || job.industry || '',
    jobDescription: job.description || '',
    requiredSkills: job.required_skills || candidate.skills || candidate.skill_set || '',
    preferredSkills: job.preferred_skills || '',
    totalExperience: candidate.total_experience || '',
    relevantExperience: candidate.relevant_experience || '',
    resume: candidate.resume_text || candidate.resume_summary || candidate.skill_set || '',
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
    expiresHours:   48,
  });

  // Send email invite
  try {
    await sendAIInterviewInvite({
      candidateEmail: candidate.email || candidate.candidate_email,
      candidateName:  candidate.name  || candidate.candidate_name,
      jobTitle:       job.title || job.job_title,
      token,
      expiresAt,
      recruiterName:  req.user.name || 'Recruitment Team',
    });
  } catch (err) {
    console.error('[AIInterview] Email send failed:', err.message);
  }

  new ApiResponse(201, { token, expiresAt, durationMinutes: Number(durationMinutes) || 30 }, 'AI interview session created and invite sent').send(res);
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

  const state = (() => { try { return JSON.parse(session.questions_json || '{}'); } catch { return {}; } })();
  new ApiResponse(200, {
    sessionId:      session.session_id,
    candidateName:  session.candidate_name,
    candidateEmail: session.candidate_email,
    jobTitle:       session.job_title,
    expiresAt:      state.expiresAt || null,
    invitationExpiresAt: session.expires_at,
    durationSeconds: state.durationSeconds,
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
  new ApiResponse(200, { question: state.currentQuestion, questionNumber: state.transcript.length + 1, remainingSeconds: aiSvc.getRemainingSeconds(state), startedAt: state.startedAt, expiresAt: state.expiresAt }, 'Interview started').send(res);
});

// PUBLIC: POST /public/ai-interview/:token/answer
const answer = asyncHandler(async (req, res) => {
  if (!String(req.body.answer || '').trim()) return res.status(400).json({ success: false, message: 'An answer is required' });
  const result = await aiSvc.answerAdaptiveSessionV2({ token: req.params.token, answer: req.body.answer, questionId: req.body.questionId });
  if (!result) return res.status(410).json({ success: false, message: 'Interview is unavailable, expired, or already completed' });
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

module.exports = { create, list, getReport, getSession, start, answer, submit, logProctoring, saveDraft };
