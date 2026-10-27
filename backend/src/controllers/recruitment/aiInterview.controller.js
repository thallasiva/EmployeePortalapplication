'use strict';

const asyncHandler   = require('express-async-handler');
const aiSvc          = require('../../services/recruitment/aiInterview.service');
const planSvc        = require('../../services/recruitment/interviewPlan.service');
const { callProcedure, query } = require('../../config/db');
const ApiResponse    = require('../../utils/ApiResponse');
const { sendMailNow } = require('../../services/email.service');

async function getCandidateResumeText(candidateId) {
  const dynamicRows = await query(
    `SELECT field_value
       FROM rec_candidate_dynamic_fields
      WHERE candidate_id = ? AND field_name IN ('rawText', 'resume_text', 'summary')
      ORDER BY created_date DESC, id DESC`,
    [candidateId]
  ).catch(() => []);

  for (const row of dynamicRows) {
    try {
      const value = JSON.parse(row.field_value);
      if (typeof value === 'string' && value.trim()) return value;
      if (value && typeof value.rawText === 'string' && value.rawText.trim()) return value.rawText;
    } catch {
      if (String(row.field_value || '').trim()) return String(row.field_value);
    }
  }

  const parserLogs = await query(
    `SELECT full_json
       FROM rec_parser_logs
      WHERE candidate_id = ? AND parser_status = 'SUCCESS'
      ORDER BY created_date DESC, log_id DESC
      LIMIT 1`,
    [candidateId]
  ).catch(() => []);

  try {
    const parsed = JSON.parse(parserLogs[0]?.full_json || '{}');
    return parsed.rawText || parsed.resume_text || parsed.summary || '';
  } catch {
    return '';
  }
}

// ── send invite email ──────────────────────────────────────────────────────
async function sendAIInterviewInvite({ candidateEmail, candidateName, jobTitle, token, expiresAt, recruiterName, durationMinutes }) {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ai-interview/${token}`;
  const expiryStr = new Date(expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return sendMailNow({
    to: candidateEmail,
    subject: `AI Interview Invitation — ${jobTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f8fafc;border-radius:10px;">
        <h2 style="color:#0E7C86;">AI Interview Invitation</h2>
        <p>Dear <strong>${candidateName}</strong>,</p>
        <p>You have been invited to complete an AI-powered first-round interview for the position of <strong>${jobTitle}</strong>.</p>
        <p>The AI interviewer asks one question at a time and adapts the next question to your answers. Start any time before the deadline; once started, it runs as a single timed session.</p>
        <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #0E7C86;margin:20px 0;">
          <p><strong>Interview Link:</strong><br/>
          <a href="${link}" style="color:#0E7C86;font-size:16px;">${link}</a></p>
          <p><strong>Deadline:</strong> ${expiryStr} IST</p>
          <p><strong>Duration:</strong> ${durationMinutes || 30} minutes once started</p>
        </div>
        <p style="color:#666;font-size:13px;">Please ensure you are in a quiet environment. Your answers will be evaluated by our AI system and reviewed by the recruitment team.</p>
        <p>Best of luck!<br/>${recruiterName || 'Recruitment Team'}</p>
      </div>
    `,
  });
}

// What a candidate may see of a question — never the scoring guide or plan ids.
function publicQuestion(q) {
  if (!q) return q;
  const { id, question, type, stage, timeLimit, problemSize, language, options } = q;
  return { id, question, type, stage, timeLimit, problemSize, language, options };
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

  // Candidates are only interviewed with an HR-approved question plan for the job.
  const plan = await planSvc.getApprovedForJob(Number(jobReqId));
  if (!plan) {
    return res.status(409).json({ success: false, code: 'PLAN_NOT_APPROVED', message: 'This job has no approved interview plan yet. Generate and approve one under Interview Plans first.' });
  }

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
    resume: candidate.resume_text || candidate.resume_summary || await getCandidateResumeText(Number(candidateId)) || candidate.skill_set || '',
  };
  const { token, expiresAt } = await aiSvc.createAdaptiveSession({
    candidateId:    Number(candidateId),
    jobReqId:       Number(jobReqId),
    recruiterId:    req.user.employeeId,
    candidateName:  candidate.name || candidate.candidate_name || 'Candidate',
    candidateEmail: candidate.email || candidate.candidate_email || '',
    jobTitle:       profile.jobTitle,
    profile,
    durationMinutes: Number(durationMinutes) || plan.duration_minutes || 30,
    expiresHours:   48,
    plan,
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
    });
    if (!inviteEmail.sent) {
      console.warn('[AIInterview] Invite not sent:', inviteEmail.error || 'SMTP unavailable');
    }
  } catch (err) {
    console.error('[AIInterview] Email delivery skipped:', err.message);
  }

  new ApiResponse(
    201,
    { token, expiresAt, durationMinutes: Number(durationMinutes) || 30, inviteEmail },
    inviteEmail.sent ? 'AI interview session created and invite sent' : 'AI interview session created; invite email was not sent'
  ).send(res);
});

// ── GET /ai-interviews  — recruiter lists sessions ─────────────────────────
const list = asyncHandler(async (req, res) => {
  // Admin and HR Manager oversee every recruiter's interviews.
  const seesAll = ['Admin', 'HR Manager'].includes(req.user.roleName);
  const sessions = await aiSvc.listByRecruiter({
    recruiterId: seesAll ? null : req.user.employeeId,
    limit:  Number(req.query.limit)  || 20,
    offset: Number(req.query.offset) || 0,
  });
  new ApiResponse(200, sessions, 'AI interview sessions fetched').send(res);
});

// ── GET /ai-interviews/report/:id  — recruiter views report ───────────────
const getReport = asyncHandler(async (req, res) => {
  const report = await aiSvc.getReport(Number(req.params.id));
  const seesAll = ['Admin', 'HR Manager'].includes(req.user.roleName);
  if (!report || (!seesAll && Number(report.recruiter_id) !== Number(req.user.employeeId))) {
    return res.status(404).json({ success: false, message: 'Report not found' });
  }

  // The *_json columns come back already parsed (MySQL JSON type).
  const answersRaw = aiSvc.parseJson(report.answers_json, []);
  const answers = Array.isArray(answersRaw) ? answersRaw : [];
  const evaluation = aiSvc.parseJson(report.evaluation_json, {}) || {};
  const state = aiSvc.parseState(report.questions_json);

  // Per-question score: prefer the evaluation made right after each answer (stored on the
  // transcript entry), then the final scorecard's entry for that question number.
  const questionScores = evaluation.questionScores || [];
  const questions = answers.map((entry, i) => {
    const qs = questionScores.find((s) => Number(s.questionId) === i + 1) || questionScores[i] || {};
    const perAnswer = entry.evaluation || {};
    const qText = typeof entry.question === 'object' ? entry.question?.question : String(entry.question || '');
    const score = Number.isFinite(Number(perAnswer.score)) ? Number(perAnswer.score) : (qs.score ?? null);
    return {
      question: qText,
      answer:   entry.answer || '',
      skill:    entry.question?.skill || qs.skill || '',
      expectedPoints: entry.question?.expectedPoints || [],
      pointsCovered: perAnswer.pointsCovered || [],
      pointsMissed: perAnswer.pointsMissed || [],
      score:    score == null ? null : Math.round(score * 10) / 10,
      feedback: perAnswer.assessment || qs.feedback || '',
      strengths: perAnswer.strengths || [],
      weaknesses: perAnswer.weaknesses || [],
      difficulty: entry.question?.difficulty || '',
      answerQuality: entry.answerQuality || qs.quality || '',
      timedOut: Boolean(entry.timedOut),
      integrity: entry.integrity || { score: 0, flags: [] },
      answerSource: entry.metrics
        ? { typed: entry.metrics.typedChars, pasted: entry.metrics.pastedChars, voice: entry.metrics.voiceChars }
        : null,
    };
  });
  // Recomputed on every view so camera episodes that finished as the interview
  // was being submitted are still counted.
  const integrity = aiSvc.summariseIntegrity({ transcript: answers, proctoringEvents: state.proctoringEvents || [] });

  const events = Array.isArray(state.proctoringEvents) ? state.proctoringEvents : [];
  const countOf = (name) => events.filter((e) => e.event === name).length;
  const startedAt = state.startedAt || null;
  const durationTakenSeconds = startedAt && report.submitted_at
    ? Math.max(0, Math.round((new Date(String(report.submitted_at).replace(' ', 'T')) - new Date(startedAt)) / 1000))
    : null;

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
    hiringRiskFactors: evaluation.hiringRiskFactors || [],
    nextSteps:      evaluation.nextSteps || [],
    experienceAlignment: evaluation.experienceAlignment,
    unverifiedSkills: evaluation.unverifiedSkills || [],
    scoringMode:    evaluation.scoringMode || 'ai',
    completionReason: evaluation.completionReason || '',
    startedAt,
    durationTakenSeconds,
    durationAllowedSeconds: state.durationSeconds || null,
    integrity,
    plan_id: report.plan_id || null,
    recruiter_decision: report.recruiter_decision || null,
    decision_notes: report.decision_notes || '',
    decided_at: report.decided_at || null,
    proctoring: {
      tabSwitches: countOf('TAB_SWITCH'),
      faceNotDetected: countOf('NO_FACE') + countOf('FACE_NOT_DETECTED'),
      multipleFaces: countOf('MULTIPLE_FACES'),
      lookingAway: countOf('LOOKING_AWAY'),
      cameraBlocked: countOf('CAMERA_BLOCKED'),
      faceCheckUnavailable: countOf('FACE_CHECK_UNAVAILABLE') > 0,
      totalEvents: events.length,
    },
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
    remainingSeconds: aiSvc.getRemainingSeconds(state),
    started: Boolean(state.startedAt),
    serverTranscription: aiSvc.transcriptionAvailable(),
  }, 'Session loaded').send(res);
});

// PUBLIC: POST /public/ai-interview/:token/transcribe — audio of one spoken answer
const transcribe = asyncHandler(async (req, res) => {
  if (!req.file?.buffer?.length) return res.status(400).json({ success: false, message: 'Audio is required' });
  const result = await aiSvc.transcribeAnswerAudio({ token: req.params.token, buffer: req.file.buffer, mimetype: req.file.mimetype });
  new ApiResponse(200, result, result.text ? 'Transcribed' : 'Transcription unavailable').send(res);
});

// PUBLIC: POST /public/ai-interview/:token/start
const start = asyncHandler(async (req, res) => {
  const started = await aiSvc.startAdaptiveSession(req.params.token);
  if (!started) return res.status(404).json({ success: false, message: 'Interview not found or expired' });
  const { session, state } = started;
  if (session.status === 'completed') return res.status(410).json({ success: false, message: 'This interview has already been submitted' });
  new ApiResponse(200, { question: publicQuestion(state.currentQuestion), questionNumber: state.transcript.length + 1, remainingSeconds: aiSvc.getRemainingSeconds(state), startedAt: state.startedAt, expiresAt: state.expiresAt }, 'Interview started').send(res);
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
  const result = await aiSvc.answerAdaptiveSessionV2({ token: req.params.token, answer: req.body.answer, questionId: req.body.questionId, metrics: req.body.metrics });
  if (!result) return res.status(410).json({ success: false, message: 'Interview is unavailable, expired, or already completed' });
  // SECURITY: never return evaluation/score data to candidate — strip it before responding
  const safeResult = result.complete
    ? { complete: true }
    : { complete: false, question: publicQuestion(result.question), questionNumber: result.questionNumber, remainingSeconds: result.remainingSeconds, expiresAt: result.expiresAt };
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
    durationMs: Math.min(Math.max(Number(req.body.durationMs) || 0, 0), 24 * 3600 * 1000),
    chars: Math.max(Number(req.body.chars) || 0, 0),
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

// ── POST /ai-interviews/:id/decision — recruiter shortlists / rejects / holds ─
const decide = asyncHandler(async (req, res) => {
  const { decision, notes } = req.body;
  const seesAll = ['Admin', 'HR Manager'].includes(req.user.roleName);
  const report = await aiSvc.getReport(Number(req.params.id));
  if (!report || (!seesAll && Number(report.recruiter_id) !== Number(req.user.employeeId))) {
    return res.status(404).json({ success: false, message: 'Interview not found' });
  }
  try {
    const result = await aiSvc.recordDecision({ sessionId: Number(req.params.id), decision, notes, user: req.user, ip: req.ip });
    new ApiResponse(200, result, 'Decision recorded').send(res);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    throw err;
  }
});

module.exports = { create, list, getReport, getSession, start, sendOtp, verifyOtp, answer, submit, logProctoring, saveDraft, transcribe, decide };
