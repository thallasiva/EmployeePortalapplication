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
  return {
    overallScore: null,
    recommendation: 'FURTHER_EVALUATION',
    summary: '',
    strengths: [],
    improvements: [],
    questionScores: pairs.map((pair, index) => ({
      questionId: index + 1,
      skill: pair.skill,
      score: null,
      feedback: 'AI evaluation unavailable; recruiter review required.',
      keyPoints: [],
    })),
    evaluationMethod: 'unavailable',
    evaluationNote: 'AI evaluation was unavailable. No automated competence score was produced; please review the transcript manually.',
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
  const expiresAt = Date.parse(state.otpExpiresAt);
  if (!state.otpHash || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return { valid: false, error: 'Code expired. Request a new code.' };
  }
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
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
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
const RESUME_SKILL_TERMS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Express.js',
  'Angular', 'Vue.js', 'Next.js', 'Python', 'Java', 'Spring Boot', 'C#',
  '.NET', 'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'SQL', 'MySQL',
  'PostgreSQL', 'SQL Server', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Kafka',
  'CI/CD', 'Linux', 'Flutter', 'Swift', 'Kotlin', 'Power BI', 'Tableau',
  'Selenium', 'Cypress', 'Playwright',
];
function parseSkillList(value) {
  if (Array.isArray(value)) return value.flatMap(parseSkillList);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.flatMap(parseSkillList);
  } catch {}
  return value.split(/[,;|\n]+/).map((skill) => skill.trim()).filter(Boolean);
}
function extractResumeSkills(resume = '') {
  const text = String(resume);
  return RESUME_SKILL_TERMS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(text);
  });
}
function fallbackNextQuestion({ profile, transcript }) {
  const maxFollowUpsPerSkill = 2;
  const n = transcript.length + 1;
  const requiredSkills = parseSkillList(profile.requiredSkills);
  const preferredSkills = parseSkillList(profile.preferredSkills);
  const resumeSkills = [
    ...parseSkillList(profile.resumeSkills),
    ...extractResumeSkills(profile.resume),
  ];
  const candidateSkills = parseSkillList(profile.candidateSkills);
  const skills = [...new Map(
    [...requiredSkills, ...preferredSkills, ...candidateSkills, ...resumeSkills]
      .map((skill) => [skill.toLowerCase(), skill])
  ).values()];
  const assessed = new Set([
    ...(profile.skillsAssessed || []),
    ...transcript.map((entry) => entry.question?.skill).filter(Boolean),
  ].map((skill) => String(skill).toLowerCase()));
  const unassessed = skills.filter((skill) => !assessed.has(skill.toLowerCase()));
  const lastEntry = transcript[transcript.length - 1];
  const previousSkill = lastEntry?.question?.skill;
  const answerQuality = lastEntry?.answerQuality || _scoreLastAnswer(transcript);
  let consecutiveSameSkillQuestions = 0;
  for (let index = transcript.length - 1; index >= 0; index--) {
    if (String(transcript[index]?.question?.skill || '').toLowerCase() !== String(previousSkill || '').toLowerCase()) break;
    consecutiveSameSkillQuestions += 1;
  }
  const followUp = Boolean(lastEntry && ['C', 'D', 'E'].includes(answerQuality) && consecutiveSameSkillQuestions <= maxFollowUpsPerSkill);
  const preferredNext = unassessed.find((skill) => skill.toLowerCase() !== String(previousSkill || '').toLowerCase());
  const alternateSkill = skills.find((item) => item.toLowerCase() !== String(previousSkill || '').toLowerCase());
  const skill = (followUp ? previousSkill : preferredNext)
    || (consecutiveSameSkillQuestions > maxFollowUpsPerSkill ? alternateSkill : previousSkill)
    || skills[(n - 1) % Math.max(skills.length, 1)]
    || profile.jobTitle
    || 'this role';
  const resumeMentionsSkill = resumeSkills.some((item) => item.toLowerCase() === skill.toLowerCase());
  const role = profile.jobTitle || 'this role';
  const questionStyle = (n - 1) % 4;
  const question = n === 1
    ? `Thinking about your ${Number(profile.relevantExperience || profile.totalExperience || 0)} years of experience, which recent project best prepares you for the ${role} role? Describe your contribution and the result.`
    : answerQuality === 'D' || answerQuality === 'E'
      ? `Let's explore ${skill} step by step. What is the first decision or check you would make in a real ${role} task using it, and why?`
      : answerQuality === 'C'
        ? `You mentioned ${skill}. How would you verify that your approach worked, and what would you change if the result did not meet expectations?`
    : questionStyle === 1 && resumeMentionsSkill
      ? `Your resume lists ${skill}. Which project best demonstrates that experience, and what did you personally build or deliver?`
      : questionStyle === 1
        ? `In a ${role} project, how would you decide when ${skill} is the right choice, and what trade-off would you watch for?`
        : questionStyle === 0
          ? `What technical trade-offs would you consider when using ${skill} for the ${role} role, and how would you choose between the alternatives?`
          : questionStyle === 2
          ? `Describe a difficult problem involving ${skill} that you handled, and explain how you diagnosed it and verified the fix.`
          : `Suppose a production system using ${skill} starts failing under increased load. What would you investigate first, and how would you make it reliable?`;
  return {
    id: n,
    stage: n === 1 ? 'introduction' : resumeMentionsSkill ? 'resume_validation' : 'technical',
    type: n === 1 ? 'experience' : followUp ? 'clarification' : questionStyle === 1 && resumeMentionsSkill ? 'resume_probe' : questionStyle === 2 ? 'practical' : 'scenario',
    skill,
    difficulty: lastEntry ? _adaptDifficulty(lastEntry.question?.difficulty, answerQuality) : _calibratedDifficulty(profile),
    question,
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
- Use the exact job-specific required skills and candidate-specific resume evidence below; do not ask generic questions that could be reused for every role or candidate
- Cover different required skills before returning to a previously assessed skill; vary question format (resume claim validation, technical decision, practical debugging, and production scenario)
- When the resume names a technology or project, ask about that actual claim without inventing responsibilities or results; when it does not, assess the job requirement with a role-relevant scenario
- Avoid repeating the same question pattern or asking the same technology question with only the skill name swapped

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
Candidate-listed skills: ${parseSkillList(profile.candidateSkills).join(', ') || 'Not provided'}
Resume skills detected: ${[...new Set([...parseSkillList(profile.resumeSkills), ...extractResumeSkills(profile.resume)])].join(', ') || 'None detected'}
${profile.resume ? `Resume evidence:\n${String(profile.resume).slice(0, 2500)}` : 'Resume: Not provided'}

## INTERVIEW STRUCTURE (adapt as needed)
Q1 → Experience and recent project relevant to this role
Next → Validate resume claims and assess required skills
Later → Real-world scenarios, trade-offs, and domain-specific depth
Use the configured question count as the target; do not end early unless the time limit expires.

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
  if (score === null || score === undefined || score === '') return null;
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
  if (['unavailable', 'response_length_fallback'].includes(last.evaluation?.evaluationMethod)) return null;
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
async function generateNextQuestion({ profile, transcript, durationSeconds, expiresAt, skillsAssessed = [], questionCount = 8 }) {
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
  let consecutiveSameSkillQuestions = 0;
  const lastSkill = transcript[transcript.length - 1]?.question?.skill;
  for (let index = transcript.length - 1; index >= 0; index--) {
    if (String(transcript[index]?.question?.skill || '').toLowerCase() !== String(lastSkill || '').toLowerCase()) break;
    consecutiveSameSkillQuestions += 1;
  }
  const contentEval = lastEval
    ? `Score: ${lastEval.score ?? '?'}/10 | Correctness: ${lastEval.correctness ?? '?'} | Depth: ${lastEval.technicalDepth ?? '?'} | ProblemSolving: ${lastEval.problemSolving ?? '?'} | Communication: ${lastEval.communication ?? '?'}
Weaknesses observed: ${(lastEval.weaknesses || []).join('; ') || 'none noted'}
Model-recommended next difficulty: ${lastEval.recommendedDifficulty || 'auto'}`
    : 'No content evaluation available for the last answer yet.';
  const userMsg = `## TIME AND COVERAGE
Duration: ${durationSeconds} seconds. Remaining: ${remainingSeconds} seconds (server-enforced hard limit).
Target question count: ${questionCount}. This is the target interview length; continue until it is reached unless time expires.
Skills assessed: ${skillsAssessed.join(', ') || 'None'}
Same-skill follow-ups used in a row: ${Math.max(0, consecutiveSameSkillQuestions - 1)} of 2. Move to another skill when the limit is reached.
Required skills not yet assessed: ${parseSkillList(profile.requiredSkills).filter((skill) => !skillsAssessed.some((assessed) => String(assessed).toLowerCase() === skill.toLowerCase())).join(', ') || 'None'}

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
    if (q?.nextAction === 'END_INTERVIEW') {
      return fallbackNextQuestion({ profile, transcript });
    }
    if (q?.question) {
      if (consecutiveSameSkillQuestions > 2 && String(q.skill || '').toLowerCase() === String(lastSkill || '').toLowerCase()) {
        return fallbackNextQuestion({ profile, transcript });
      }
      return { ...q, nextAction: 'ASK_QUESTION', id: qNum, answerQuality };
    }
  } catch (err) {
    console.warn('[AIInterview] enterprise question generation failed:', err.message);
  }
  return fallbackNextQuestion({ profile, transcript });
}
async function evaluateAnswer({ profile, question, answer, transcript }) {
  const fallback = { score: null, correctness: null, technicalDepth: null, practicalKnowledge: null, problemSolving: null, communication: null, confidence: null, strengths: [], weaknesses: [], assessment: 'AI evaluation was unavailable; recruiter review is required.', recommendedDifficulty: null, evaluationMethod: 'unavailable' };
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
    const completion = await openai.chat.completions.create({ model: getModel(), temperature: 0.2, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sysContent }, { role: 'user', content: JSON.stringify({ role: profile.jobTitle, requiredSkills: profile.requiredSkills, totalExperience: profile.totalExperience, relevantExperience: profile.relevantExperience, resumeEvidence: profile.resume ? String(profile.resume).slice(0, 1500) : '', questionType: question?.type, questionDifficulty: question?.difficulty, question: question?.question || question, answer, previousAnswers: transcript.slice(-3).map(t => ({ question: t.question?.question, answer: t.answer })), schema: { ...baseSchema, ...codingSchema } }) }] });
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return typeof result.score === 'number' ? { ...result, evaluationMethod: 'ai' } : fallback;
  } catch (err) { console.warn('[AIInterview] per-answer evaluation failed:', err.message); return fallback; }
}
async function evaluateAdaptiveInterview({ profile, transcript }) {
  const openai = getOpenAI();
  const pairs = transcript.map(t => ({ question: t.question?.question || '', answer: t.answer || '', type: t.question?.type || '', difficulty: t.question?.difficulty || '', skill: t.question?.skill || '', answerQuality: t.answerQuality || '?' }));
  const fallback = buildFallbackEvaluation(pairs);
  const normFallback = { ...fallback, recommendation: 'FURTHER_EVALUATION' };
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
    if (result.overallScore !== undefined) return { ...result, evaluationMethod: 'ai' };
  } catch (err) {
    console.warn('[AIInterview] enterprise evaluation failed:', err.message);
  }
  return normFallback;
}
async function createAdaptiveSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, profile, durationMinutes = 20, questionCount = 8, quickResponseTimeoutSeconds = 20, interviewMode = 'balanced', expiresHours = 48 }) {
  const durationSeconds = Math.min(Math.max(Number(durationMinutes) || 20, 10), 60) * 60;
  const targetQuestionCount = Math.min(Math.max(Number(questionCount) || 8, 3), 20);
  const quickTimeout = [0, 20, 30, 45, 60, 90, 120].includes(Number(quickResponseTimeoutSeconds)) ? Number(quickResponseTimeoutSeconds) : 20;
  const interviewProfile = { ...profile, interviewMode };
  return createSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, questions: { profile: interviewProfile, transcript: [], durationSeconds, questionCount: targetQuestionCount, quickResponseTimeoutSeconds: quickTimeout, skillsAssessed: [], status: 'PENDING' }, expiresHours });
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
  const pendingAnswerIndex = state.transcript.findIndex((entry) => !entry.evaluation);
  const generationInterruptedIndex = pendingAnswerIndex < 0 && state.transcript.length
    && String(state.transcript[state.transcript.length - 1].question?.id) === String(state.currentQuestion?.id)
    ? state.transcript.length - 1
    : -1;
  const recoveryIndex = pendingAnswerIndex >= 0 ? pendingAnswerIndex : generationInterruptedIndex;
  if (recoveryIndex >= 0) {
    const recovered = await processAdaptiveAnswer(token, state, recoveryIndex);
    if (recovered.complete) return { session, state, complete: true };
  }
  if (getRemainingSeconds(state) <= 0) {
    await completeAdaptiveSession(token, 'time_expired', state);
    return { session, state, complete: true };
  }
  if (!state.currentQuestion) {
    state.currentQuestion = await generateNextQuestion(state);
    if (state.currentQuestion?.nextAction === 'END_INTERVIEW') state.currentQuestion = fallbackNextQuestion(state);
    state.currentQuestionStartedAt = new Date().toISOString();
    await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ? AND status = \'pending\'', [JSON.stringify(state), token]);
  }
  return { session, state };
}
async function processAdaptiveAnswer(token, state, transcriptIndex) {
  const entry = state.transcript[transcriptIndex];
  if (!entry.evaluation) {
    entry.evaluation = await evaluateAnswer({
      profile: state.profile || {},
      question: entry.question,
      answer: entry.answer,
      transcript: state.transcript.slice(0, transcriptIndex),
    });
    entry.answerQuality = entry.evaluation?.evaluationMethod === 'unavailable'
      ? null
      : _qualityFromScore(entry.evaluation?.score);
    entry.status = 'answered';
    await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ? AND status = \'pending\'', [JSON.stringify(state), token]);
  }
  if (entry.question?.skill && !state.skillsAssessed.includes(entry.question.skill)) state.skillsAssessed.push(entry.question.skill);
  if (state.transcript.length >= (Number(state.questionCount) || 8)) {
    return completeAdaptiveSession(token, 'question_count_reached', state);
  }
  if (getRemainingSeconds(state) <= 0) {
    return completeAdaptiveSession(token, 'time_expired', state);
  }
  state.currentQuestion = await generateNextQuestion(state);
  state.currentQuestionStartedAt = new Date().toISOString();
  if (getRemainingSeconds(state) <= 0 || state.currentQuestion?.nextAction === 'END_INTERVIEW') {
    return completeAdaptiveSession(token, state.currentQuestion?.reason || 'sufficient_evidence', state);
  }
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ? AND status = \'pending\'', [JSON.stringify(state), token]);
  return { complete: false, question: state.currentQuestion, questionNumber: state.transcript.length + 1, remainingSeconds: getRemainingSeconds(state), expiresAt: state.expiresAt };
}
async function answerAdaptiveSession({ token, answer, questionId }) {
  const session = await getSession(token);
  if (!session || session.status !== 'pending') return null;
  const state = parseState(session.questions_json);
  if (!state.currentQuestion) throw new Error('Interview has not been started.');
  const existingIndex = questionId
    ? state.transcript.findIndex((entry) => String(entry.question?.id) === String(questionId))
    : -1;
  if (existingIndex >= 0) {
    const existing = state.transcript[existingIndex];
    if (existing.status === 'answered' && String(state.currentQuestion?.id) !== String(existing.question?.id)) {
      return { complete: false, question: state.currentQuestion, questionNumber: state.transcript.length + 1, remainingSeconds: getRemainingSeconds(state), expiresAt: state.expiresAt, cached: true };
    }
    return processAdaptiveAnswer(token, state, existingIndex);
  }
  if (questionId && String(state.currentQuestion.id) !== String(questionId)) {
    return { conflict: true, question: state.currentQuestion, questionNumber: state.transcript.length + 1 };
  }
  const interviewExpired = getRemainingSeconds(state) <= 0;
  const questionExpired = state.currentQuestionStartedAt &&
    Date.now() - new Date(state.currentQuestionStartedAt).getTime() >= questionTimeLimit(state.currentQuestion) * 1000;
  const effectiveAnswer = interviewExpired
    ? '(skipped — interview time expired)'
    : questionExpired
      ? '(skipped — question time expired)'
      : String(answer || '').trim();
  state.transcript.push({
    question: state.currentQuestion,
    answer: effectiveAnswer,
    answeredAt: new Date().toISOString(),
    answerQuality: null,
    evaluation: null,
    timedOut: interviewExpired || questionExpired,
    status: 'evaluating',
  });
  delete state.currentDraft;
  const transcriptIndex = state.transcript.length - 1;
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ? AND status = \'pending\'', [JSON.stringify(state), token]);
  return processAdaptiveAnswer(token, state, transcriptIndex);
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
  if (!state.currentQuestion || String(state.currentQuestion.id) !== String(questionId)) return;
  state.currentDraft = { questionId, draft: String(draft || '').slice(0, 5000), savedAt: new Date().toISOString() };
  await query('UPDATE ai_interview_sessions SET questions_json = ? WHERE token = ?', [JSON.stringify(state), token]);
}
// ── Idempotency-aware answer ───────────────────────────────────────────────
async function answerAdaptiveSessionV2({ token, answer, questionId }) {
  const session = await getSession(token);
  if (!session) return null;
  if (session.status === 'completed') return { complete: true, cached: true };
  if (session.status !== 'pending') return null;
  return answerAdaptiveSession({ token, answer, questionId });
}
module.exports = {
  generateQuestions,
  generateNextQuestion,
  evaluateAnswer,
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
  parseState,
  logProctoringEvent,
  saveDraft,
  answerAdaptiveSessionV2,
};
