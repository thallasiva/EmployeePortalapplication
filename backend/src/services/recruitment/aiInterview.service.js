'use strict';
/**
 * AI Interview Service
 * Uses direct SQL queries — no stored procedures needed.
 */

const crypto = require('crypto');
const OpenAI = require('openai');
const { query } = require('../../config/db');
const { sendMailNow } = require('../email.service');

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
    const score = Math.min(10, Math.max(1, Math.round(words / 15)));
    return { questionId: i + 1, score, feedback: '', keyPoints: [] };
  });
  const avg = Math.round(scores.reduce((s, q) => s + q.score, 0) / scores.length * 10);
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
async function createSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, questions, expiresHours = 48 }) {
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresHours * 3600 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');
  const qJson = JSON.stringify(questions);

  const result = await query(
    `INSERT INTO ai_interview_sessions
       (token, candidate_id, job_req_id, recruiter_id, candidate_name, candidate_email, job_title, questions_json, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [token, candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, qJson, expiresAt]
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
  const aJson = JSON.stringify(answers);
  const eJson = JSON.stringify(evaluation);
  const score = evaluation?.overallScore ?? null;
  const recommendationMap = { STRONG_HIRE: 'Strong Hire', HIRE: 'Hire', FURTHER_EVALUATION: 'Maybe', REJECT: 'No Hire' };
  const rec   = recommendationMap[evaluation?.recommendation] || evaluation?.recommendation || null;

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
            status, overall_score, recommendation, expires_at, submitted_at, created_at
     FROM ai_interview_sessions
     WHERE recruiter_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [recruiterId, limit, offset]
  );
}

async function getReport(sessionId) {
  const rows = await query(
    `SELECT * FROM ai_interview_sessions WHERE session_id = ? LIMIT 1`,
    [sessionId]
  );
  return rows[0] || null;
}

function parseState(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    return Array.isArray(parsed) ? { profile: {}, transcript: parsed, durationSeconds: 1800 } : parsed;
  } catch { return { profile: {}, transcript: [], durationSeconds: 1800 }; }
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
  return question?.timeLimit || 120;
}

function fallbackNextQuestion({ profile, transcript }) {
  const n = transcript.length + 1;
  if (n === 1) return { id: 1, stage: 'introduction', type: 'experience', difficulty: 'calibrated', question: 'Could you briefly introduce yourself and explain your current role, responsibilities, and the project you work on?' };
  const skills = String(profile.requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean);
  const skill = skills[(n - 2) % Math.max(skills.length, 1)] || profile.jobTitle || 'this role';
  const prior = transcript[transcript.length - 1];
  const isBrief = (prior?.answer || '').trim().split(/\s+/).length < 35;
  return {
    id: n,
    stage: n > 4 ? 'scenario' : 'technical',
    type: isBrief ? 'clarification' : 'practical',
    difficulty: Number(profile.relevantExperience || 0) >= 5 ? 'advanced' : 'intermediate',
    question: isBrief
      ? `Could you give a concrete example from your work involving ${skill}, including the problem, your approach, and the result?`
      : `Based on your experience, how have you used ${skill} in production, and what trade-offs or issues did you need to handle?`,
  };
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
  * Adequate answer (C) → probe the same topic with a real-world scenario at the same level
  * Weak answer (D) → step DOWN one rung, ask a simpler clarifying question on the same concept
  * Very weak / blank (E) → step DOWN one rung and move to a different skill area
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

async function generateNextQuestion({ profile, transcript, durationSeconds, expiresAt, skillsAssessed = [] }) {
  const openai = getOpenAI();
  if (!openai) return fallbackNextQuestion({ profile, transcript });

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
    if (q?.question) return { ...q, nextAction: 'ASK_QUESTION', id: qNum, answerQuality };
  } catch (err) {
    console.warn('[AIInterview] enterprise question generation failed:', err.message);
  }
  return fallbackNextQuestion({ profile, transcript });
}

async function evaluateAnswer({ profile, question, answer, transcript }) {
  const fallbackScore = Math.min(10, Math.max(1, Math.round(String(answer || '').trim().split(/\s+/).filter(Boolean).length / 15)));
  const fallback = { score: fallbackScore, correctness: fallbackScore, technicalDepth: fallbackScore, practicalKnowledge: fallbackScore, problemSolving: fallbackScore, communication: fallbackScore, confidence: fallbackScore, strengths: [], weaknesses: [], assessment: fallbackScore >= 7 ? 'Strong answer' : 'Answer needs further validation', recommendedDifficulty: fallbackScore >= 7 ? 'advanced' : 'intermediate' };
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
    const completion = await openai.chat.completions.create({ model: getModel(), temperature: 0.2, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sysContent }, { role: 'user', content: JSON.stringify({ role: profile.jobTitle, requiredSkills: profile.requiredSkills, questionType: question?.type, questionDifficulty: question?.difficulty, question: question?.question || question, answer, previousAnswers: transcript.slice(-3).map(t => ({ question: t.question?.question, answer: t.answer })), schema: { ...baseSchema, ...codingSchema } }) }] });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return typeof result.score === 'number' ? result : fallback;
  } catch (err) { console.warn('[AIInterview] per-answer evaluation failed:', err.message); return fallback; }
}

async function evaluateAdaptiveInterview({ profile, transcript }) {
  const openai = getOpenAI();
  const pairs = transcript.map(t => ({ question: t.question?.question || '', answer: t.answer || '', type: t.question?.type || '', difficulty: t.question?.difficulty || '', skill: t.question?.skill || '', answerQuality: t.answerQuality || '?' }));
  const fallback = buildFallbackEvaluation(pairs);
  const normFallback = { ...fallback, recommendation: fallback.recommendation === 'Strong Hire' ? 'STRONG_HIRE' : fallback.recommendation === 'Hire' ? 'HIRE' : fallback.recommendation === 'Maybe' ? 'FURTHER_EVALUATION' : 'REJECT' };

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
    if (result.overallScore !== undefined) return result;
  } catch (err) {
    console.warn('[AIInterview] enterprise evaluation failed:', err.message);
  }
  return normFallback;
}

async function createAdaptiveSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, profile, durationMinutes = 20, expiresHours = 48 }) {
  const durationSeconds = Math.min(Math.max(Number(durationMinutes) || 20, 10), 60) * 60;
  return createSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, questions: { profile, transcript: [], durationSeconds, skillsAssessed: [], status: 'PENDING' }, expiresHours });
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

async function answerAdaptiveSession({ token, answer }) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return null;
  const state = parseState(session.questions_json);
  if (!state.currentQuestion) throw new Error('Interview has not been started.');
  if (getRemainingSeconds(state) <= 0) return completeAdaptiveSession(token, 'time_expired');
  const questionExpired = state.currentQuestionStartedAt &&
    Date.now() - new Date(state.currentQuestionStartedAt).getTime() >= questionTimeLimit(state.currentQuestion) * 1000;
  const effectiveAnswer = questionExpired ? '(skipped — question time expired)' : String(answer || '').trim();
  // Evaluate content first, then derive the A..E quality grade from that
  // content score (falling back to a length heuristic only if evaluation is unavailable).
  const evaluation = await evaluateAnswer({ profile: state.profile || {}, question: state.currentQuestion, answer: effectiveAnswer, transcript: state.transcript });
  const answerQuality = _qualityFromScore(evaluation?.score) || _scoreLastAnswer([...state.transcript, { answer: effectiveAnswer }]);
  state.transcript.push({ question: state.currentQuestion, answer: effectiveAnswer, answeredAt: new Date().toISOString(), answerQuality, evaluation, timedOut: questionExpired });
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
  await submitSession({ token, answers: state.transcript || [], evaluation });
  return { complete: true, evaluation };
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
async function answerAdaptiveSessionV2({ token, answer, questionId }) {
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
  return answerAdaptiveSession({ token, answer });
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
  logProctoringEvent,
  saveDraft,
  answerAdaptiveSessionV2,
};
