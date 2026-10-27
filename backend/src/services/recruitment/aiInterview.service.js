'use strict';
/**
 * AI Interview Service
 * Uses direct SQL queries — no stored procedures needed.
 */

const crypto = require('crypto');
const OpenAI = require('openai');
const { query } = require('../../config/db');
const { sendMailNow } = require('../email.service');
const { buildQuestionPlan, hashString } = require('./interviewQuestionBank');

let _openai = null;
function getOpenAI() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your-openai-api-key-here') return null;
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

function getModel() { return process.env.OPENAI_MODEL || 'gpt-4o-mini'; }

// ── Generate questions ─────────────────────────────────────────────────────
async function generateQuestions({ jobTitle, jobDescription, requiredSkills, experienceLevel, numQuestions = 8 }) {
  const openai = getOpenAI();
  const skillsText = Array.isArray(requiredSkills) ? requiredSkills.join(', ') : (requiredSkills || '');

  const prompt = `You are an expert technical interviewer. Generate exactly ${numQuestions} interview questions for the following role.

Role: ${jobTitle}
Experience Level: ${experienceLevel || 'Mid-level'}
Required Skills: ${skillsText}
Job Description: ${jobDescription || 'Not provided'}

Requirements:
- Mix of technical, situational, and behavioral questions
- Questions should be answerable in 2-5 minutes each
- Vary difficulty: 3 easy, 3 medium, 2 hard
- Return ONLY a JSON array of objects, no markdown, no explanation

Format:
[
  { "id": 1, "question": "...", "type": "technical|behavioral|situational", "difficulty": "easy|medium|hard", "expectedTopics": ["..."] }
]`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: getModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });
      const text = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || Object.values(parsed)[0]);
      if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, numQuestions);
    } catch (err) {
      console.warn('[AIInterview] OpenAI question generation failed, using fallback:', err.message);
    }
  }

  return buildFallbackQuestions(jobTitle, skillsText, numQuestions);
}

function buildFallbackQuestions(jobTitle, skills, n) {
  const base = [
    { type: 'behavioral',  difficulty: 'easy',   question: `Tell me about yourself and why you applied for the ${jobTitle} role.` },
    { type: 'technical',   difficulty: 'easy',   question: `What are your strongest technical skills relevant to this position?` },
    { type: 'situational', difficulty: 'medium', question: `Describe a challenging project you worked on. What was your role and how did you overcome obstacles?` },
    { type: 'technical',   difficulty: 'medium', question: `How do you approach debugging a complex issue in production?` },
    { type: 'behavioral',  difficulty: 'medium', question: `Tell me about a time you disagreed with a team member. How did you resolve it?` },
    { type: 'technical',   difficulty: 'hard',   question: `Walk me through your approach to designing a scalable system for high traffic.` },
    { type: 'situational', difficulty: 'hard',   question: `You are given a tight deadline but requirements keep changing. How do you manage this?` },
    { type: 'behavioral',  difficulty: 'easy',   question: `Where do you see yourself in 3 years, and how does this role fit your goals?` },
    { type: 'technical',   difficulty: 'medium', question: `Explain a technical concept from your expertise to a non-technical stakeholder.` },
    { type: 'situational', difficulty: 'medium', question: `How do you prioritize tasks when everything seems urgent?` },
  ];
  return base.slice(0, n).map((q, i) => ({ id: i + 1, ...q, expectedTopics: [] }));
}

// ── Evaluate answers ───────────────────────────────────────────────────────
async function evaluateAnswers({ jobTitle, questions, answers }) {
  const openai = getOpenAI();

  const pairs = questions.map((q, i) => ({
    question: q.question,
    answer:   answers[i]?.answer || '(no answer provided)',
    type:     q.type,
    difficulty: q.difficulty,
    expectedTopics: q.expectedTopics || [],
  }));

  const prompt = `You are an expert interviewer evaluating a candidate for the role of ${jobTitle}.
Evaluate each answer and return a JSON object.

Q&A:
${pairs.map((p, i) => `Q${i+1} [${p.type}/${p.difficulty}]: ${p.question}\nA${i+1}: ${p.answer}`).join('\n\n')}

Return ONLY valid JSON (no markdown):
{
  "overallScore": <0-100>,
  "recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<area1>", "<area2>"],
  "questionScores": [
    { "questionId": 1, "score": <0-10>, "feedback": "<brief feedback>", "keyPoints": ["<point>"] }
  ]
}`;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: getModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      });
      const text = completion.choices[0]?.message?.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('[AIInterview] OpenAI evaluation failed, using fallback:', err.message);
    }
  }

  return buildFallbackEvaluation(pairs);
}

function buildFallbackEvaluation(pairs) {
  const scores = pairs.map((p, i) => {
    const words = (p.answer || '').split(/\s+/).filter(Boolean).length;
    // Prefer the score already given to this answer (scored against its expected points).
    const score = Number.isFinite(Number(p.score)) ? Number(p.score) : Math.min(10, Math.max(1, Math.round(words / 15)));
    return { questionId: i + 1, score, feedback: '', keyPoints: [] };
  });
  const avg = scores.length ? Math.round(scores.reduce((s, q) => s + q.score, 0) / scores.length * 10) : 0;
  return {
    overallScore: avg,
    recommendation: avg >= 70 ? 'Hire' : avg >= 50 ? 'Maybe' : 'No Hire',
    summary: '',
    strengths: [],
    improvements: [],
    questionScores: scores,
  };
}

// ── DB operations (raw SQL — no stored procedures) ─────────────────────────
async function createSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, questions, expiresHours = 48, planId = null }) {
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresHours * 3600 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');
  const qJson = JSON.stringify(questions);

  const result = await query(
    `INSERT INTO ai_interview_sessions
       (token, candidate_id, job_req_id, plan_id, recruiter_id, candidate_name, candidate_email, job_title, questions_json, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [token, candidateId, jobReqId, planId, recruiterId, candidateName, candidateEmail, jobTitle, qJson, expiresAt]
  );

  return { token, expiresAt, sessionId: result.insertId };
}

async function getSession(token) {
  // Expire stale sessions first
  await query(
    `UPDATE ai_interview_sessions SET status = 'expired'
     WHERE status = 'pending' AND expires_at < NOW()`
  );
  const rows = await query(
    `SELECT * FROM ai_interview_sessions WHERE token = ? LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

async function issueOtp(token) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return null;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const state = parseState(session.questions_json);
  state.otpHash = crypto.createHash('sha256').update(code).digest('hex');
  state.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  state.otpAttempts = 0;
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ?', [JSON.stringify(state), token]);
  const result = await sendMailNow({
    to: session.candidate_email,
    subject: 'Your AI interview verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>AI Interview Verification</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p></div>`,
  });
  // Development fallback: when SMTP can't deliver the email (or is not configured),
  // surface the code so local testing is not blocked. NEVER in production.
  const isProd = String(process.env.NODE_ENV).toLowerCase() === 'production';
  if (!isProd) {
    console.warn(`[AIInterview][DEV] OTP for ${session.candidate_email} = ${code} (expires in 10 min)`);
  }
  return {
    sent: Boolean(result.sent),
    error: result.error || null,
    devCode: (!isProd && !result.sent) ? code : undefined,
  };
}

async function verifyOtp(token, code) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return { valid: false, error: 'Interview unavailable' };
  const state = parseState(session.questions_json);
  if (Number(state.otpAttempts || 0) >= 5) return { valid: false, error: 'Too many attempts. Request a new code.' };
  if (!state.otpExpiresAt || new Date(state.otpExpiresAt) < new Date()) return { valid: false, error: 'Code expired. Request a new code.' };
  state.otpAttempts = Number(state.otpAttempts || 0) + 1;
  const valid = crypto.createHash('sha256').update(String(code || '')).digest('hex') === state.otpHash;
  if (valid) state.otpVerifiedAt = new Date().toISOString();
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ?', [JSON.stringify(state), token]);
  return valid ? { valid: true } : { valid: false, error: 'Invalid verification code.' };
}

async function submitSession({ token, answers, evaluation }) {
  const score = normaliseScore(evaluation?.overallScore);
  const rec   = normaliseRecommendation(evaluation?.recommendation, score);
  const aJson = JSON.stringify(answers);
  const eJson = JSON.stringify({ ...evaluation, overallScore: score });

  await query(
    `UPDATE ai_interview_sessions
     SET answers_json = ?, evaluation_json = ?, overall_score = ?, recommendation = ?,
         status = 'completed', submitted_at = NOW()
     WHERE token = ? AND status = 'pending'`,
    [aJson, eJson, score, rec, token]
  );
}

async function listByRecruiter({ recruiterId, limit = 20, offset = 0 }) {
  return query(
    `SELECT session_id, token, candidate_name, candidate_email, job_title,
            status, overall_score, recommendation, expires_at, submitted_at, created_at,
            JSON_UNQUOTE(JSON_EXTRACT(evaluation_json, '$.integrity.risk')) AS integrity_risk,
            plan_id, recruiter_decision, decided_at
     FROM ai_interview_sessions
     ${recruiterId == null ? '' : 'WHERE recruiter_id = ?'}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    recruiterId == null ? [limit, offset] : [recruiterId, limit, offset]
  );
}

async function getReport(sessionId) {
  const rows = await query(
    `SELECT * FROM ai_interview_sessions WHERE session_id = ? LIMIT 1`,
    [sessionId]
  );
  return rows[0] || null;
}

// The *_json columns are MySQL JSON, which mysql2 already returns parsed;
// older rows / other drivers may still hand back a string.
function parseJson(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function parseState(raw) {
  const parsed = parseJson(raw, null);
  if (Array.isArray(parsed)) return { profile: {}, transcript: parsed, durationSeconds: 1800 };
  if (!parsed || typeof parsed !== 'object') return { profile: {}, transcript: [], durationSeconds: 1800 };
  return { profile: {}, transcript: [], skillsAssessed: [], durationSeconds: 1800, ...parsed };
}

const RECOMMENDATIONS = ['Strong Hire', 'Hire', 'Maybe', 'No Hire'];

// overall_score is TINYINT 0-100 and recommendation an ENUM, so normalise whatever
// the model (or fallback) produced before it reaches the database.
function normaliseScore(value) {
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || String(value ?? '').trim() === '') return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function normaliseRecommendation(value, score) {
  const key = String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
  const map = { STRONGHIRE: 'Strong Hire', HIRE: 'Hire', FURTHEREVALUATION: 'Maybe', MAYBE: 'Maybe', REJECT: 'No Hire', NOHIRE: 'No Hire' };
  if (map[key]) return map[key];
  if (score == null) return null;
  return score >= 85 ? 'Strong Hire' : score >= 70 ? 'Hire' : score >= 50 ? 'Maybe' : 'No Hire';
}

function getRemainingSeconds(state, now = Date.now()) {
  if (!state?.expiresAt) return Math.max(0, Number(state?.durationSeconds) || 0);
  return Math.max(0, Math.ceil((new Date(state.expiresAt).getTime() - now) / 1000));
}

function questionTimeLimit(question) {
  const type = String(question?.type || '').toUpperCase();
  if (type === 'CODING' || type === 'CODE') return question?.timeLimit || (question?.problemSize === 'large' ? 1200 : 600);
  if (type === 'SCENARIO' || question?.stage === 'scenario') return question?.timeLimit || 300;
  if (type === 'SYSTEM_DESIGN' || question?.stage === 'system_design') return question?.timeLimit || 900;
  return question?.timeLimit || 180;
}

// Extra time the server allows beyond the visible limit: the question is read aloud
// before the candidate's clock starts, and the answer still has to reach the server.
const ANSWER_GRACE_SECONDS = 90;

const normaliseQuestion = (q) => String(q || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const isSkippedAnswer = (a) => /^\((skipped|time expired)/i.test(String(a || '').trim());

// Used when no LLM is configured (or it fails). Walks a fixed interview plan and never
// repeats a question already asked in this session.
const FALLBACK_PLAN = [
  { stage: 'introduction', type: 'experience', text: () => 'Could you briefly introduce yourself and explain your current role, responsibilities, and the project you work on?' },
  { stage: 'resume_validation', type: 'resume_probe', text: (s) => `Walk me through the most recent project where you used ${s}. What was the architecture, and which part did you personally build?` },
  { stage: 'technical', type: 'technical', text: (s) => `What are the most common mistakes or pitfalls you have seen with ${s}, and how do you avoid them?` },
  { stage: 'technical', type: 'practical', text: (s) => `How do you test and debug code that uses ${s}? Describe the tools and the approach you follow.` },
  { stage: 'scenario', type: 'scenario', text: () => 'A production issue is reported just before a release and the root cause is unclear. Walk me through exactly what you would do in the first hour.' },
  { stage: 'technical', type: 'practical', text: (s) => `How would you improve the performance of an application built with ${s}? What would you measure first?` },
  { stage: 'scenario', type: 'scenario', text: (s) => `You need to deliver a new feature using ${s} with a tight deadline and unclear requirements. How do you plan and deliver it?` },
  { stage: 'technical', type: 'practical', text: (s) => `How do you keep code written with ${s} secure? Give concrete practices you follow.` },
  { stage: 'domain', type: 'experience', text: () => 'Tell me about a time you disagreed with a teammate or lead on a technical decision. How was it resolved?' },
  { stage: 'technical', type: 'practical', text: (s) => `Describe how you would design the data model and APIs for a small module using ${s}. What trade-offs would you consider?` },
  { stage: 'domain', type: 'experience', text: () => 'What is a technical skill you improved in the last year, and how did you go about learning it?' },
  { stage: 'domain', type: 'experience', text: () => 'Why are you interested in this role, and what would you want to achieve in your first six months?' },
];

function fallbackNextQuestion({ profile, transcript, seed }) {
  const n = transcript.length + 1;
  const asked = new Set(transcript.map((t) => normaliseQuestion(t.question?.question)));
  const difficulty = Number(profile.relevantExperience || 0) >= 5 ? 'advanced' : 'intermediate';

  // Role-specific plan chosen from the job title/skills, mixed per candidate (seed).
  // Short or skipped answers are accepted as given (they simply score lower);
  // the interview always moves on to the next new question.
  const { plan } = buildQuestionPlan(profile, seed);
  const next = plan.find((q) => !asked.has(normaliseQuestion(q.question)));
  if (next) return { id: n, difficulty, skill: '', ...next };

  // Plan exhausted (or an older session): fall back to the generic list.
  const skills = (Array.isArray(profile.requiredSkills) ? profile.requiredSkills : String(profile.requiredSkills || '').split(','))
    .map((s) => String(s).trim()).filter(Boolean);
  const skillFor = (i) => skills[i % Math.max(skills.length, 1)] || profile.jobTitle || 'your main technology';
  for (let i = 0; i < FALLBACK_PLAN.length; i += 1) {
    const step = FALLBACK_PLAN[i];
    const question = step.text(skillFor(i));
    if (!asked.has(normaliseQuestion(question))) {
      return { id: n, stage: step.stage, type: step.type, skill: step.text.length ? skillFor(i) : '', difficulty, question };
    }
  }
  return { nextAction: 'END_INTERVIEW', reason: 'question_plan_complete' };
}

// ── Enterprise Adaptive Question Engine ───────────────────────────────────
function _buildEnterpriseSystemPrompt(profile) {
  const difficulty = _calibratedDifficulty(profile);
  const mode = String(profile.interviewMode || profile.interview_mode || 'balanced').toLowerCase();
  const hintsAllowed = Boolean(profile.hintsAllowed ?? profile.hints_allowed ?? false);
  const domain = (profile.domain || '').toLowerCase();
  const domainCtx = domain.includes('bank') || domain.includes('financ')
    ? 'Domain: Banking/Finance — ask about regulatory compliance, transaction integrity, audit trails, risk controls.'
    : domain.includes('health') || domain.includes('medic')
    ? 'Domain: Healthcare — ask about HIPAA/HL7/FHIR, patient data privacy, EMR integrations, clinical workflow.'
    : domain.includes('hr') || domain.includes('payroll')
    ? 'Domain: HR/Payroll — ask about data privacy, payroll accuracy, compliance, HRIS integrations.'
    : domain.includes('retail') || domain.includes('ecommerce')
    ? 'Domain: Retail/eCommerce — ask about inventory, order management, payment processing, scalability.'
    : '';

  return `You are an Enterprise AI Recruiter conducting a structured technical interview. Your role is adaptive, professional, and evidence-based.

## CORE PRINCIPLES
- Ask exactly ONE question per turn — never multiple questions
- Never reveal scoring criteria, grading, or upcoming question plans
- Use only job-relevant evidence; never reference gender, age, nationality, or other protected attributes
- Adapt difficulty dynamically based on the CONTENT QUALITY of candidate answers (not answer length):
  * Excellent answer (A) → step UP one rung on the difficulty ladder, ask a deeper follow-up or a new advanced topic
  * Good answer (B) → maintain level, explore another required skill
  * Adequate answer (C) → maintain level and move to a NEW topic or a new real-world scenario
  * Weak answer (D) → step DOWN one rung and ask a simpler NEW question
  * Very weak / blank / skipped (E) → step DOWN one rung and move to a different skill area
- Short answers are the candidate's choice: accept them as final and score them as given. NEVER ask the candidate to expand, elaborate, repeat, or give an example for an answer they already gave, and never re-ask an earlier question (even reworded)
- Difficulty ladder (easiest → hardest): fundamental → intermediate → proficient → advanced → senior
- A long but generic, incorrect, or evasive answer is NOT a good answer — judge substance, correctness, and depth, never word count
- Prioritize: required skills > preferred skills > general engineering depth

## JOB CONTEXT
Role: ${profile.jobTitle || 'Not specified'}
${domainCtx}
Job Description: ${(profile.jobDescription || 'Not provided').slice(0, 800)}
Required Skills (highest priority): ${profile.requiredSkills || 'Not specified'}
Preferred Skills: ${profile.preferredSkills || 'None'}
Total Experience: ${profile.totalExperience || 'Unknown'} years | Relevant: ${profile.relevantExperience || 'Unknown'} years
Calibrated Difficulty (starting point): ${difficulty}

## INTERVIEW MODE
Mode: ${mode} (screening = broader coverage with fewer follow-ups; balanced = standard depth; deep_dive = fewer skills explored more thoroughly).
Hints: ${hintsAllowed
    ? 'ALLOWED — if the candidate is clearly stuck, you may offer ONE small nudge before moving on. Never give the full answer.'
    : 'NOT ALLOWED — do not provide hints, partial answers, or leading information.'}

## CANDIDATE PROFILE
${profile.resume ? `Resume Summary:\n${String(profile.resume).slice(0, 600)}` : 'Resume: Not provided'}

## INTERVIEW STRUCTURE (adapt as needed)
Q1 → Introduction: candidate background, current role, recent project (always start here)
Q2-Q3 → Resume Validation: verify claims from resume, project details, technologies used
Q4-Q6 → Core Technical: required skills, depth of knowledge, architecture decisions
Q7-Q8 → Real-World Scenario: production problem-solving, debugging, trade-offs
Q9+ (if maxQ > 8) → Domain/Advanced: domain-specific, leadership, system design

## QUESTION QUALITY RULES
- Prefer specific, scenario-based questions over generic definitions
- Ask about real projects: "In your last role…", "Walk me through a time when…"
- Technical questions should test depth: architecture, trade-offs, failure recovery, scaling
- Avoid yes/no questions — all questions must require a substantive answer`;
}

// 5-tier difficulty ladder, easiest → hardest.
const DIFFICULTY_LADDER = ['fundamental', 'intermediate', 'proficient', 'advanced', 'senior'];

// Starting difficulty calibrated to declared experience.
function _calibratedDifficulty(profile) {
  const yrs = Number(profile.relevantExperience || profile.totalExperience || 0);
  if (yrs >= 10) return 'senior';
  if (yrs >= 6) return 'advanced';
  if (yrs >= 3) return 'proficient';
  if (yrs >= 1) return 'intermediate';
  return 'fundamental';
}

// Move one rung on the ladder based on the latest answer quality (A..E).
function _adaptDifficulty(current, quality) {
  let base = DIFFICULTY_LADDER.indexOf(String(current || '').toLowerCase());
  if (base < 0) base = 1; // default to 'intermediate' if unknown
  const delta = quality === 'A' ? 1 : (quality === 'D' || quality === 'E') ? -1 : 0;
  const next = Math.min(DIFFICULTY_LADDER.length - 1, Math.max(0, base + delta));
  return DIFFICULTY_LADDER[next];
}

// Map a content-based 0-10 evaluation score to an A..E quality grade.
function _qualityFromScore(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  if (s >= 8.5) return 'A';
  if (s >= 6.5) return 'B';
  if (s >= 4.5) return 'C';
  if (s >= 2) return 'D';
  return 'E';
}

// Grade the most recent answer. Prefers the content-aware per-answer
// evaluation (LLM-scored on correctness/depth/etc.); only falls back to a
// length heuristic when no evaluation has been attached yet.
function _scoreLastAnswer(transcript) {
  if (!transcript.length) return null;
  const last = transcript[transcript.length - 1];
  const fromEval = _qualityFromScore(last.evaluation?.score);
  if (fromEval) return fromEval;
  const answer = (last.answer || '').trim();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 'E';
  if (wordCount < 15) return 'D';
  if (wordCount < 40) return 'C';
  if (wordCount < 80) return 'B';
  return 'A';
}

async function generateNextQuestion({ profile, transcript, durationSeconds, expiresAt, skillsAssessed = [], seed, planQuestions }) {
  // HR-approved plan: ask its questions in order and nothing else; finish when they run out.
  if (Array.isArray(planQuestions) && planQuestions.length) {
    const askedIds = new Set(transcript.map((t) => t.question?.planQuestionId).filter(Boolean));
    const next = planQuestions.find((q) => !askedIds.has(q.planQuestionId));
    if (!next) return { nextAction: 'END_INTERVIEW', reason: 'plan_complete' };
    return { ...next, id: transcript.length + 1, nextAction: 'ASK_QUESTION' };
  }
  // Older sessions have no stored seed; derive a stable one so their plan doesn't shift.
  const planSeed = seed ?? hashString(`${profile?.jobTitle}|${expiresAt || ''}`);
  const openai = getOpenAI();
  if (!openai) return fallbackNextQuestion({ profile, transcript, seed: planSeed });

  const qNum = transcript.length + 1;
  const answerQuality = _scoreLastAnswer(transcript);
  const remainingSeconds = getRemainingSeconds({ durationSeconds, expiresAt });
  const systemPrompt = _buildEnterpriseSystemPrompt(profile);

  const lastEntry = transcript[transcript.length - 1] || null;
  const lastEval = lastEntry?.evaluation || null;
  const lastDifficulty = lastEntry?.question?.difficulty || _calibratedDifficulty(profile);
  // Content-aware difficulty target: prefer the per-answer LLM recommendation,
  // otherwise step the ladder from the last question based on answer quality.
  const suggestedDifficulty = (lastEval && DIFFICULTY_LADDER.includes(String(lastEval.recommendedDifficulty || '').toLowerCase()))
    ? String(lastEval.recommendedDifficulty).toLowerCase()
    : answerQuality
      ? _adaptDifficulty(lastDifficulty, answerQuality)
      : _calibratedDifficulty(profile);

  const transcriptSummary = transcript.map((t, i) => ({
    q: i + 1,
    stage: t.question?.stage || 'technical',
    skill: t.question?.skill || '',
    quality: t.answerQuality || '?',
    score: t.evaluation?.score ?? null,
    difficulty: t.question?.difficulty || '',
    question: t.question?.question || '',
    answer: (t.answer || '').slice(0, 1200) + ((t.answer || '').length > 1200 ? '…' : ''),
  }));

  const contentEval = lastEval
    ? `Score: ${lastEval.score ?? '?'}/10 | Correctness: ${lastEval.correctness ?? '?'} | Depth: ${lastEval.technicalDepth ?? '?'} | ProblemSolving: ${lastEval.problemSolving ?? '?'} | Communication: ${lastEval.communication ?? '?'}
Weaknesses observed: ${(lastEval.weaknesses || []).join('; ') || 'none noted'}
Model-recommended next difficulty: ${lastEval.recommendedDifficulty || 'auto'}`
    : 'No content evaluation available for the last answer yet.';

  const userMsg = `## TIME AND COVERAGE
Duration: ${durationSeconds} seconds. Remaining: ${remainingSeconds} seconds (server-enforced hard limit).
Skills assessed: ${skillsAssessed.join(', ') || 'None'}

## TRANSCRIPT SO FAR (${transcript.length} answered)
${JSON.stringify(transcriptSummary, null, 2)}

## LAST ANSWER — QUALITY GRADE: ${answerQuality || 'N/A'}
(A=excellent, B=good, C=adequate, D=weak, E=blank/very weak — this grade is derived from the CONTENT evaluation below, not answer length.)

## LAST ANSWER — CONTENT EVALUATION
${contentEval}

## DIFFICULTY GUIDANCE
Last question difficulty: ${lastDifficulty}
Suggested difficulty for the NEXT question (ladder fundamental→intermediate→proficient→advanced→senior): ${suggestedDifficulty}
Use the content evaluation and this suggestion to set difficulty; step up on a strong (A) answer, step down on a weak (D/E) answer.

## TASK
Decide the best next action. Do not end before at least two substantive answers unless time has expired. Do not start a long exercise under five minutes. Prioritize unassessed required skills and avoid substantially repeating prior questions unless it is an intentional follow-up.

Return ONLY valid JSON — no markdown, no explanation:
{
  "nextAction": "ASK_QUESTION|END_INTERVIEW",
  "id": ${qNum},
  "stage": "introduction|resume_validation|technical|scenario|domain",
  "type": "experience|resume_probe|technical|practical|scenario|system_design|coding|clarification",
  "problemSize": "small|large|null",
  "timeLimit": "120 for normal, 300 for scenario, 600 for normal coding, 1200 for large coding, 900 for system design",
  "skill": "<primary skill being assessed>",
  "difficulty": "fundamental|intermediate|proficient|advanced|senior",
  "rationale": "<1 sentence: why this question now, based on adaptive logic>",
  "question": "<the actual interview question>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.35,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    const q = JSON.parse(completion.choices[0]?.message?.content || '{}');
    if (q?.nextAction === 'END_INTERVIEW') return { nextAction: 'END_INTERVIEW', reason: q.reason || 'Sufficient evidence collected.' };
    // Guard against the model re-asking an earlier question verbatim.
    const alreadyAsked = transcript.some((t) => normaliseQuestion(t.question?.question) === normaliseQuestion(q?.question));
    if (q?.question && !alreadyAsked) return { ...q, nextAction: 'ASK_QUESTION', id: qNum, answerQuality };
  } catch (err) {
    console.warn('[AIInterview] enterprise question generation failed:', err.message);
  }
  return fallbackNextQuestion({ profile, transcript, seed: planSeed });
}

// Which expected points an answer mentions, by overlap of their key words.
const STOP_WORDS = new Set('the and for with that this from your their they them have has are was were what when which while into about there clearly gives give given uses using used real own work works explains explain mentions mention describes describe specific concrete example examples'.split(' '));
function rubricCoverage(answer, points) {
  const text = ` ${String(answer || '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')} `;
  const covered = [];
  const missed = [];
  for (const point of points) {
    const keys = String(point).toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').split(' ')
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const hits = keys.filter((k) => text.includes(` ${k.replace(/s$/, '')}`)).length;
    (keys.length && hits / keys.length >= 0.34 ? covered : missed).push(point);
  }
  return { covered, missed, ratio: points.length ? covered.length / points.length : 0 };
}

async function evaluateAnswer({ profile, question, answer, transcript }) {
  if (isSkippedAnswer(answer)) {
    return { score: 0, correctness: 0, technicalDepth: 0, practicalKnowledge: 0, problemSolving: 0, communication: 0, confidence: 0, strengths: [], weaknesses: ['No answer given'], assessment: 'Question was not answered.', recommendedDifficulty: 'fundamental' };
  }
  // Without an LLM: score by how many of the question's expected points the answer
  // touches (tempered by length); with no scoring guide, by length alone.
  const words = String(answer || '').trim().split(/\s+/).filter(Boolean).length;
  const guide = Array.isArray(question?.expectedPoints) ? question.expectedPoints : [];
  const coverage = guide.length ? rubricCoverage(answer, guide) : null;
  const fallbackScore = coverage
    ? Math.min(10, Math.max(1, Math.round(2 + coverage.ratio * 6 + Math.min(words / 60, 1) * 2)))
    : Math.min(10, Math.max(1, Math.round(words / 15)));
  const fallback = { pointsCovered: coverage?.covered || [], pointsMissed: coverage?.missed || [], score: fallbackScore, correctness: fallbackScore, technicalDepth: fallbackScore, practicalKnowledge: fallbackScore, problemSolving: fallbackScore, communication: fallbackScore, confidence: fallbackScore, strengths: [], weaknesses: [], assessment: fallbackScore >= 7 ? 'Strong answer' : 'Answer needs further validation', recommendedDifficulty: fallbackScore >= 7 ? 'advanced' : 'intermediate' };
  const openai = getOpenAI();
  if (!openai) return fallback;

  const qType = String(question?.type || '').toUpperCase();
  const isCoding = qType === 'CODING' || qType === 'CODE' || qType === 'SYSTEM_DESIGN'
    || question?.stage === 'system_design' || question?.stage === 'coding';

  const baseSchema = {
    score: '0-10 overall',
    correctness: '0-10 — is the answer factually/technically correct',
    technicalDepth: '0-10 — depth of understanding shown',
    practicalKnowledge: '0-10 — hands-on/real-world grounding',
    problemSolving: '0-10 — reasoning and approach',
    communication: '0-10 — clarity and structure',
    confidence: '0-10 — conviction without over-claiming',
    strengths: [],
    weaknesses: [],
    assessment: 'string — 1-2 sentence justification referencing what was said',
    recommendedDifficulty: 'fundamental|intermediate|proficient|advanced|senior',
    aiGeneratedLikelihood: '0-100 — likelihood this answer was written by an AI assistant rather than the candidate in a live interview. Signals: textbook-perfect or encyclopedic phrasing, heavy bullet/heading structure, generic content with no personal project specifics, style sharply different from the candidate\'s other answers, answering a broader question than asked. A concise, specific, first-person answer is NOT evidence of AI.',
    aiGeneratedReason: 'string — short evidence for the likelihood (empty if low)',
    ...(guide.length ? {
      pointsCovered: ['<expected point the answer covered, copied from expectedPoints>'],
      pointsMissed: ['<expected point the answer did not cover>'],
    } : {}),
  };
  // For coding / system-design answers, add an algorithmic rubric.
  const codingSchema = isCoding ? {
    codeEvaluation: {
      correctnessNote: 'string — does the solution actually solve the problem',
      timeComplexity: 'string — e.g. O(n), O(n log n); or "not stated"',
      spaceComplexity: 'string — e.g. O(1), O(n); or "not stated"',
      edgeCasesHandled: ['<edge case the candidate addressed>'],
      edgeCasesMissed: ['<important edge case the candidate ignored>'],
      optimality: 'optimal|near-optimal|suboptimal|incorrect|unknown',
      scalability: 'string — how the approach behaves at scale (for system design)',
    },
  } : {};

  const sysContent = isCoding
    ? 'Evaluate a single CODING or SYSTEM-DESIGN interview answer fairly, using job-relevant evidence only. In addition to the general scores, assess algorithmic correctness, time and space complexity, edge-case handling, and optimality/scalability. Judge substance and correctness, never answer length. Return JSON only.'
    : 'Evaluate a single interview answer fairly using job-relevant evidence only. Judge substance, correctness and depth — never answer length. Return JSON only.';

  try {
    const completion = await openai.chat.completions.create({ model: getModel(), temperature: 0.2, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sysContent }, { role: 'user', content: JSON.stringify({ role: profile.jobTitle, requiredSkills: profile.requiredSkills, questionType: question?.type, questionDifficulty: question?.difficulty, question: question?.question || question, expectedPoints: guide.length ? guide : undefined, scoringInstruction: guide.length ? 'Score mainly by how many expectedPoints the answer covers correctly, with real substance; list them in pointsCovered/pointsMissed.' : undefined, answer, previousAnswers: transcript.slice(-3).map(t => ({ question: t.question?.question, answer: String(t.answer || '').slice(0, 800) })), schema: { ...baseSchema, ...codingSchema } }) }] });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return typeof result.score === 'number' ? result : fallback;
  } catch (err) { console.warn('[AIInterview] per-answer evaluation failed:', err.message); return fallback; }
}

async function evaluateAdaptiveInterview({ profile, transcript }) {
  const openai = getOpenAI();
  const pairs = transcript.map(t => ({ question: t.question?.question || '', answer: t.answer || '', type: t.question?.type || '', difficulty: t.question?.difficulty || '', skill: t.question?.skill || '', answerQuality: t.answerQuality || '?', score: t.evaluation?.score }));
  const fallback = buildFallbackEvaluation(pairs);
  // Without an LLM the scores are a length heuristic; flag it so the report can say so.
  const normFallback = { ...fallback, scoringMode: 'basic', recommendation: fallback.recommendation === 'Strong Hire' ? 'STRONG_HIRE' : fallback.recommendation === 'Hire' ? 'HIRE' : fallback.recommendation === 'Maybe' ? 'FURTHER_EVALUATION' : 'REJECT' };

  if (!openai) return normFallback;

  const systemMsg = `You are an Enterprise AI Interview Evaluator. Produce a comprehensive, fair, evidence-based scorecard. Use only job-relevant evidence. Never infer protected characteristics. Be specific — reference actual answers. Calibrate scores relative to the declared experience level and role seniority.`;

  const yrs = Number(profile.relevantExperience || profile.totalExperience || 0);
  const userMsg = `## ROLE & CANDIDATE
Job: ${profile.jobTitle || 'Not specified'}
Required Skills: ${profile.requiredSkills || 'Not specified'}
Preferred Skills: ${profile.preferredSkills || 'None'}
Domain: ${profile.domain || 'Not specified'}
Experience Expected: ${yrs} years relevant
${profile.resume ? `Resume (excerpt): ${String(profile.resume).slice(0, 500)}` : ''}

## INTERVIEW TRANSCRIPT (${transcript.length} questions)
${pairs.map((p, i) => `Q${i+1} [${p.skill}/${p.difficulty}/${p.type}] Quality:${p.answerQuality}
Question: ${p.question}
Answer: ${p.answer}`).join('\n\n')}

## EVALUATION TASK
Return ONLY valid JSON with this exact structure (no markdown):
{
  "overallScore": <0-100, weighted average>,
  "technicalSkills": <0-100>,
  "practicalExperience": <0-100>,
  "problemSolving": <0-100>,
  "domainKnowledge": <0-100>,
  "communication": <0-100>,
  "roleFit": <0-100>,
  "experienceAlignment": <0-100, how well experience matches requirements>,
  "recommendation": "STRONG_HIRE|HIRE|FURTHER_EVALUATION|REJECT",
  "recommendationReason": "<2-3 sentence specific justification referencing interview evidence>",
  "summary": "<3-4 sentence executive summary of the candidate's performance>",
  "strengths": ["<specific strength with evidence>", "..."],
  "improvements": ["<specific gap or area to improve>", "..."],
  "resumeVsInterviewValidation": {
    "consistent": ["<skill/claim verified by interview>"],
    "discrepancies": ["<resume claim not supported or contradicted in interview>"],
    "notCovered": ["<resume skill not tested in interview>"]
  },
  "skillScores": [
    { "skill": "<skill name>", "score": <0-100>, "confidence": "high|medium|low", "evidence": "<what candidate said>", "level": "fundamental|intermediate|proficient|advanced|senior" }
  ],
  "codingAndSystemDesign": {
    "assessed": <true|false>,
    "correctness": <0-100>,
    "complexityAwareness": <0-100, understanding of time/space trade-offs>,
    "edgeCaseHandling": <0-100>,
    "notes": "<evidence-based note; empty string if no coding/design questions were asked>"
  },
  "verifiedSkills": ["<skill name>"],
  "partiallyVerifiedSkills": ["<skill name>"],
  "unverifiedSkills": ["<skill from JD not assessed>"],
  "potentialSkillGaps": ["<gap identified>"],
  "questionScores": [
    { "questionId": <number>, "skill": "<skill>", "score": <0-10>, "quality": "A|B|C|D|E", "feedback": "<specific feedback>", "keyPoints": ["<key point covered or missed>"] }
  ],
  "hiringRisk": "low|medium|high",
  "hiringRiskFactors": ["<risk factor if any>"],
  "nextSteps": ["<recommended next step if HIRE or FURTHER_EVALUATION>"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.2,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    if (result.overallScore !== undefined) return { ...result, scoringMode: 'ai' };
  } catch (err) {
    console.warn('[AIInterview] enterprise evaluation failed:', err.message);
  }
  return normFallback;
}

async function createAdaptiveSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, profile, durationMinutes = 20, expiresHours = 48, plan = null }) {
  const durationSeconds = Math.min(Math.max(Number(durationMinutes) || 20, 10), 60) * 60;
  // Snapshot the approved plan into the session so later edits to the plan never
  // change an interview that has already been sent.
  const planQuestions = plan ? plan.questions.map((q, i) => ({
    id: i + 1,
    planQuestionId: q.question_id,
    question: q.question_text,
    stage: q.stage,
    type: q.question_type,
    skill: q.skill || '',
    difficulty: q.difficulty,
    expectedPoints: q.expected_points || [],
    timeLimit: q.time_limit_seconds,
  })) : null;
  return createSession({
    candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, expiresHours, planId: plan?.plan_id || null,
    questions: { profile, transcript: [], durationSeconds, skillsAssessed: [], status: 'PENDING', seed: crypto.randomInt(1, 2 ** 31 - 1), planId: plan?.plan_id || null, planQuestions },
  });
}

async function startAdaptiveSession(token) {
  const session = await getSession(token);
  if (!session) return null;
  const state = parseState(session.questions_json);
  if (!state.otpVerifiedAt) return null;
  if (!state.startedAt) {
    state.startedAt = new Date().toISOString();
    state.expiresAt = new Date(Date.now() + (Number(state.durationSeconds) || 1800) * 1000).toISOString();
    state.status = 'IN_PROGRESS';
  }
  if (getRemainingSeconds(state) <= 0) return null;
  if (!state.currentQuestion) {
    state.currentQuestion = await generateNextQuestion(state);
    state.currentQuestionStartedAt = new Date().toISOString();
    await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ? AND status = \'pending\'', [JSON.stringify(state), token]);
  }
  return { session, state };
}

// ── AI-assistance / integrity signals (shown to the interviewer only) ─────
// The browser silently reports how each answer was produced; these rules turn
// that into flags. Never returned to the candidate.
const INTEGRITY_RULES = {
  PASTED: 35, BULK_INSERT: 30, FAST_TYPING: 25, QUESTION_COPIED: 25, LEFT_WINDOW: 20, AI_STYLE: 30,
};

function sanitiseMetrics(raw) {
  const m = raw && typeof raw === 'object' ? raw : {};
  const num = (v, max = 1e7) => Math.min(max, Math.max(0, Number(v) || 0));
  return {
    pasteCount: num(m.pasteCount, 1000),
    pastedChars: num(m.pastedChars),
    bulkInsertChars: num(m.bulkInsertChars),
    typedChars: num(m.typedChars),
    voiceChars: num(m.voiceChars),
    activeTypingMs: num(m.activeTypingMs),
    firstInputMs: num(m.firstInputMs),
    blurCount: num(m.blurCount, 1000),
    blurMs: num(m.blurMs),
    questionCopied: Boolean(m.questionCopied),
  };
}

function assessAnswerIntegrity(metrics, answer, evaluation) {
  const flags = [];
  const len = String(answer || '').trim().length;
  if (metrics && len > 0) {
    const pastedShare = metrics.pastedChars / len;
    if (metrics.pasteCount > 0 && (pastedShare >= 0.3 || metrics.pastedChars >= 200)) {
      flags.push({ code: 'PASTED', detail: `${Math.min(100, Math.round(pastedShare * 100))}% of the answer was pasted (${metrics.pasteCount} paste${metrics.pasteCount > 1 ? 's' : ''})` });
    }
    if (metrics.bulkInsertChars >= 40) {
      flags.push({ code: 'BULK_INSERT', detail: `${metrics.bulkInsertChars} characters appeared at once without typing (auto-typer, drag-drop or injected text)` });
    }
    const cps = metrics.activeTypingMs > 0 ? metrics.typedChars / (metrics.activeTypingMs / 1000) : 0;
    if (metrics.typedChars >= 150 && cps > 10) {
      flags.push({ code: 'FAST_TYPING', detail: `Typed at ${cps.toFixed(1)} characters/second — typical typing is 3–7` });
    }
    if (metrics.questionCopied) {
      flags.push({ code: 'QUESTION_COPIED', detail: 'Copied the question text' });
    }
    if (metrics.blurCount > 0 && metrics.blurMs >= 5000) {
      flags.push({ code: 'LEFT_WINDOW', detail: `Left the interview window ${metrics.blurCount} time${metrics.blurCount > 1 ? 's' : ''} for ${Math.round(metrics.blurMs / 1000)}s while answering` });
    }
  }
  const likelihood = Number(evaluation?.aiGeneratedLikelihood);
  if (Number.isFinite(likelihood) && likelihood >= 70) {
    flags.push({ code: 'AI_STYLE', detail: `Reads like AI-generated text (${Math.round(likelihood)}% likely)${evaluation.aiGeneratedReason ? ` — ${evaluation.aiGeneratedReason}` : ''}` });
  }
  const score = Math.min(100, flags.reduce((s, f) => s + (INTEGRITY_RULES[f.code] || 0), 0));
  return { score, flags };
}

function summariseIntegrity(state) {
  const transcript = state.transcript || [];
  const events = state.proctoringEvents || [];
  const flagged = transcript
    .map((t, i) => ({ questionNumber: i + 1, ...(t.integrity || { score: 0, flags: [] }) }))
    .filter((t) => t.flags.length);
  const tabSwitches = events.filter((e) => e.event === 'TAB_SWITCH').length;
  const counts = {};
  flagged.forEach((t) => t.flags.forEach((f) => { counts[f.code] = (counts[f.code] || 0) + 1; }));

  const answered = transcript.filter((t) => !/^\(skipped|^\(time expired/.test(String(t.answer || ''))).length || 1;
  const maxScore = flagged.reduce((m, t) => Math.max(m, t.score), 0);
  const share = flagged.length / answered;

  // Camera episodes (each already lasted 3s+ in the browser).
  const face = (name) => {
    const list = events.filter((e) => e.event === name);
    return { count: list.length, seconds: Math.round(list.reduce((s, e) => s + (Number(e.durationMs) || 0), 0) / 1000) };
  };
  const multipleFaces = face('MULTIPLE_FACES');
  const lookingAway = face('LOOKING_AWAY');
  const noFace = face('NO_FACE');
  const camBlocked = face('CAMERA_BLOCKED');
  const faceCheckUnavailable = events.some((e) => e.event === 'FACE_CHECK_UNAVAILABLE');
  const cameraHigh = multipleFaces.seconds >= 10 || camBlocked.seconds >= 30;
  const cameraMedium = multipleFaces.count >= 1 || lookingAway.count >= 4 || lookingAway.seconds >= 45
    || noFace.seconds >= 30 || camBlocked.count >= 1;

  let risk = 'none';
  if (maxScore >= 60 || (flagged.length >= 2 && share >= 0.3) || tabSwitches >= 3 || cameraHigh) risk = 'high';
  else if (flagged.length >= 1 || tabSwitches >= 2 || cameraMedium) risk = 'medium';
  else if (tabSwitches >= 1 || lookingAway.count || noFace.count || faceCheckUnavailable) risk = 'low';

  const reasons = [];
  if (counts.PASTED) reasons.push(`Pasted text in ${counts.PASTED} answer(s)`);
  if (counts.BULK_INSERT) reasons.push(`Text inserted without typing in ${counts.BULK_INSERT} answer(s)`);
  if (counts.FAST_TYPING) reasons.push(`Unnaturally fast typing in ${counts.FAST_TYPING} answer(s)`);
  if (counts.QUESTION_COPIED) reasons.push(`Copied the question in ${counts.QUESTION_COPIED} answer(s)`);
  if (counts.LEFT_WINDOW) reasons.push(`Left the interview window while answering ${counts.LEFT_WINDOW} time(s)`);
  if (counts.AI_STYLE) reasons.push(`${counts.AI_STYLE} answer(s) read like AI-generated text`);
  if (tabSwitches) reasons.push(`Switched browser tab ${tabSwitches} time(s)`);
  if (multipleFaces.count) reasons.push(`Another person was on camera ${multipleFaces.count} time(s), ${multipleFaces.seconds}s in total`);
  if (lookingAway.count) reasons.push(`Looked away from the screen ${lookingAway.count} time(s), ${lookingAway.seconds}s in total`);
  if (noFace.count) reasons.push(`Face not visible ${noFace.count} time(s), ${noFace.seconds}s in total`);
  if (camBlocked.count) reasons.push(`Camera blocked or covered ${camBlocked.count} time(s), ${camBlocked.seconds}s in total`);
  if (faceCheckUnavailable) reasons.push('Face monitoring could not run on the candidate\'s device');

  return {
    risk, reasons, flaggedQuestions: flagged, tabSwitches, answeredQuestions: transcript.length,
    camera: { multipleFaces, lookingAway, noFace, cameraBlocked: camBlocked, faceCheckUnavailable },
  };
}

async function notifyRecruiterOfIntegrityRisk(session, evaluation) {
  try {
    const rows = await query(
      `SELECT e.email, TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS name FROM employees e WHERE e.employee_id = ?`,
      [session.recruiter_id]
    );
    const to = rows[0]?.email;
    if (!to) return;
    const integrity = evaluation.integrity;
    await sendMailNow({
      to,
      subject: `⚠ Possible AI assistance — ${session.candidate_name} (${session.job_title})`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#b91c1c;margin-top:0">Integrity check: ${String(integrity.risk).toUpperCase()} risk</h2>
        <p>The AI interview for <strong>${session.candidate_name}</strong> (${session.job_title}) has finished and shows signs the candidate may have used an AI tool or outside help.</p>
        <ul>${integrity.reasons.map((r) => `<li>${r}</li>`).join('')}</ul>
        <p>Score: <strong>${evaluation.overallScore ?? '—'}/100</strong>. Please review the flagged answers in HRMS → Recruitment → AI Interview before moving the candidate forward.</p>
        <p style="color:#666;font-size:12px">The candidate was not shown this warning.</p></div>`,
    });
  } catch (err) {
    console.warn('[AIInterview] integrity alert email failed:', err.message);
  }
}

async function answerAdaptiveSession({ token, answer, metrics = null }) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return null;
  const state = parseState(session.questions_json);
  if (!state.currentQuestion) throw new Error('Interview has not been started.');
  if (getRemainingSeconds(state) <= 0) return completeAdaptiveSession(token, 'time_expired');
  // Late answers are kept (and marked) rather than thrown away; only an empty
  // answer is recorded as skipped.
  const elapsedSeconds = state.currentQuestionStartedAt
    ? (Date.now() - new Date(state.currentQuestionStartedAt).getTime()) / 1000
    : 0;
  const questionExpired = elapsedSeconds >= questionTimeLimit(state.currentQuestion) + ANSWER_GRACE_SECONDS;
  const given = String(answer || '').trim();
  const effectiveAnswer = given || '(skipped — question time expired)';
  // Evaluate content first, then derive the A..E quality grade from that
  // content score (falling back to a length heuristic only if evaluation is unavailable).
  const evaluation = await evaluateAnswer({ profile: state.profile || {}, question: state.currentQuestion, answer: effectiveAnswer, transcript: state.transcript });
  const answerQuality = _qualityFromScore(evaluation?.score) || _scoreLastAnswer([...state.transcript, { answer: effectiveAnswer }]);
  const cleanMetrics = metrics ? sanitiseMetrics(metrics) : null;
  const integrity = assessAnswerIntegrity(given ? cleanMetrics : null, effectiveAnswer, evaluation);
  state.transcript.push({ question: state.currentQuestion, answer: effectiveAnswer, answeredAt: new Date().toISOString(), answerQuality, evaluation, timedOut: questionExpired, metrics: cleanMetrics, integrity });
  if (state.currentQuestion.skill && !state.skillsAssessed.includes(state.currentQuestion.skill)) state.skillsAssessed.push(state.currentQuestion.skill);
  state.currentQuestion = await generateNextQuestion(state);
  state.currentQuestionStartedAt = new Date().toISOString();
  if (getRemainingSeconds(state) <= 0 || state.currentQuestion?.nextAction === 'END_INTERVIEW') return completeAdaptiveSession(token, state.currentQuestion?.reason || 'sufficient_evidence', state);
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ? AND status = \'pending\'', [JSON.stringify(state), token]);
  return { complete: false, question: state.currentQuestion, questionNumber: state.transcript.length + 1, remainingSeconds: getRemainingSeconds(state), expiresAt: state.expiresAt };
}

async function completeAdaptiveSession(token, reason = 'candidate_completed', suppliedState = null) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return null;
  const state = suppliedState || parseState(session.questions_json);
  const evaluation = await evaluateAdaptiveInterview({ profile: state.profile || {}, transcript: state.transcript || [] });
  evaluation.completionReason = reason;
  evaluation.integrity = summariseIntegrity(state);
  await submitSession({ token, answers: state.transcript || [], evaluation });
  if (evaluation.integrity.risk === 'high') await notifyRecruiterOfIntegrityRisk(session, evaluation);
  return { complete: true, evaluation };
}


// ── Speech-to-text for spoken answers ──────────────────────────────────────
// The browser's built-in recognition mishears accented technical speech, so when an
// OpenAI key is configured the recorded answer audio is transcribed server-side,
// primed with the job's vocabulary.
function transcriptionAvailable() { return Boolean(getOpenAI()); }

async function transcribeAnswerAudio({ token, buffer, mimetype }) {
  const openai = getOpenAI();
  if (!openai) return { text: null, reason: 'not_configured' };
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return { text: null, reason: 'unavailable' };
  const state = parseState(session.questions_json);
  if (!state.startedAt) return { text: null, reason: 'not_started' };

  const profile = state.profile || {};
  const skills = Array.isArray(profile.requiredSkills) ? profile.requiredSkills.join(', ') : String(profile.requiredSkills || '');
  const question = state.currentQuestion?.question || '';
  const prompt = `Job interview answer for a ${profile.jobTitle || 'software'} role. `
    + `Technical terms that may be spoken: ${[skills, profile.preferredSkills].filter(Boolean).join(', ') || 'software development'}, `
    + 'API, REST, microservices, database, SQL, deployment, production, integration, scenario, debugging. '
    + `The question was: ${question}`.slice(0, 600);

  const ext = /ogg/.test(mimetype) ? 'ogg' : /mp4|m4a|aac/.test(mimetype) ? 'mp4' : /wav/.test(mimetype) ? 'wav' : /mpeg|mp3/.test(mimetype) ? 'mp3' : 'webm';
  try {
    const file = await OpenAI.toFile(buffer, `answer.${ext}`, { type: mimetype || 'audio/webm' });
    const result = await openai.audio.transcriptions.create({
      file,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
      language: 'en',
      prompt,
    });
    const text = String(result?.text || '').trim();
    return text ? { text } : { text: null, reason: 'empty' };
  } catch (err) {
    console.warn('[AIInterview] transcription failed:', err.message);
    return { text: null, reason: 'failed' };
  }
}

// ── Recruiter decision (separate from the AI recommendation) ───────────────
const DECISION_TO_STATUS = { SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected', ON_HOLD: 'On Hold' };

async function recordDecision({ sessionId, decision, notes, user, ip }) {
  if (!DECISION_TO_STATUS[decision]) throw Object.assign(new Error('Invalid decision'), { statusCode: 400 });
  const [session] = await query('SELECT session_id, candidate_id, status, recruiter_id FROM ai_interview_sessions WHERE session_id = ?', [sessionId]);
  if (!session) return null;
  if (session.status !== 'completed') throw Object.assign(new Error('Only a completed interview can be decided'), { statusCode: 409 });
  await query(
    'UPDATE ai_interview_sessions SET recruiter_decision = ?, decision_notes = ?, decided_by = ?, decided_at = NOW() WHERE session_id = ?',
    [decision, notes || null, user.employeeId || null, sessionId]);
  // Move the candidate's hiring stage too (this also notifies the recruiter / team lead).
  let candidateStatus = null;
  if (session.candidate_id) {
    try {
      const candidateSvc = require('./candidate.service');
      await candidateSvc.updateStatus(Number(session.candidate_id), DECISION_TO_STATUS[decision], user.userId, ip);
      candidateStatus = DECISION_TO_STATUS[decision];
    } catch (err) {
      console.warn('[AIInterview] candidate stage update failed:', err.message);
    }
  }
  return { session_id: sessionId, recruiter_decision: decision, candidate_status: candidateStatus };
}

// ── Proctoring event logging ───────────────────────────────────────────────
async function logProctoringEvent(token, event) {
  const session = await getSession(token);
  if (!session) return { ok: false };
  const state = parseState(session.questions_json);
  if (!state.proctoringEvents) state.proctoringEvents = [];
  state.proctoringEvents.push({ ...event, serverTimestamp: new Date().toISOString() });
  const tabCount = state.proctoringEvents.filter(e => e.event === 'TAB_SWITCH').length;
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ?', [JSON.stringify(state), token]);
  if (tabCount >= 3 && session.status === 'pending') {
    await completeAdaptiveSession(token, 'auto_submitted_proctoring', state);
    return { autoSubmitted: true };
  }
  return { ok: true, tabSwitchCount: tabCount };
}

// ── Auto-save draft answer ─────────────────────────────────────────────────
async function saveDraft(token, questionId, draft) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return;
  const state = parseState(session.questions_json);
  state.currentDraft = { questionId, draft: String(draft || '').slice(0, 5000), savedAt: new Date().toISOString() };
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ?', [JSON.stringify(state), token]);
}

// ── Idempotency-aware answer ───────────────────────────────────────────────
async function answerAdaptiveSessionV2({ token, answer, questionId, metrics }) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return null;
  const state = parseState(session.questions_json);
  if (!state.currentQuestion) throw new Error('Interview has not been started.');
  // Idempotency: if this question was already answered, return cached state
  if (questionId && state.transcript.some(t => String(t.question?.id) === String(questionId))) {
    return { complete: false, question: state.currentQuestion, questionNumber: state.transcript.length + 1, remainingSeconds: getRemainingSeconds(state), expiresAt: state.expiresAt, cached: true };
  }
  // Clear draft for this question
  if (state.currentDraft?.questionId === questionId) delete state.currentDraft;
  // Delegate to existing handler
  return answerAdaptiveSession({ token, answer, metrics });
}

module.exports = {
  generateQuestions,
  evaluateAnswers,
  createSession,
  getSession,
  issueOtp,
  verifyOtp,
  submitSession,
  listByRecruiter,
  getReport,
  createAdaptiveSession,
  startAdaptiveSession,
  answerAdaptiveSession,
  completeAdaptiveSession,
  getRemainingSeconds,
  parseJson,
  parseState,
  summariseIntegrity,
  recordDecision,
  transcriptionAvailable,
  transcribeAnswerAudio,
  logProctoringEvent,
  saveDraft,
  answerAdaptiveSessionV2,
};
