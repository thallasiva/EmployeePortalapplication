'use strict';
/**
 * AI Interview Service
 * Uses direct SQL queries — no stored procedures needed.
 */

const crypto = require('crypto');
const OpenAI = require('openai');
const { query } = require('../../config/db');

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
  const yrs = Number(profile.relevantExperience || profile.totalExperience || 0);
  const difficulty = yrs >= 10 ? 'expert' : yrs >= 5 ? 'advanced' : yrs >= 2 ? 'intermediate' : 'basic';
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
- Adapt difficulty dynamically based on the quality of candidate answers:
  * Excellent answer (A) → increase difficulty, ask deeper follow-up or new advanced topic
  * Good answer (B) → maintain level, explore another required skill
  * Adequate answer (C) → probe the same topic with a real-world scenario
  * Weak answer (D) → ask a simpler clarifying question on the same concept
  * Very weak / blank (E) → briefly acknowledge and move to a different skill area
- Prioritize: required skills > preferred skills > general engineering depth

## JOB CONTEXT
Role: ${profile.jobTitle || 'Not specified'}
${domainCtx}
Job Description: ${(profile.jobDescription || 'Not provided').slice(0, 800)}
Required Skills (highest priority): ${profile.requiredSkills || 'Not specified'}
Preferred Skills: ${profile.preferredSkills || 'None'}
Total Experience: ${profile.totalExperience || 'Unknown'} years | Relevant: ${profile.relevantExperience || 'Unknown'} years
Calibrated Difficulty: ${difficulty}

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

function _scoreLastAnswer(transcript) {
  if (!transcript.length) return null;
  const last = transcript[transcript.length - 1];
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

  const transcriptSummary = transcript.map((t, i) => ({
    q: i + 1,
    stage: t.question?.stage || 'technical',
    skill: t.question?.skill || '',
    quality: t.answerQuality || '?',
    question: t.question?.question || '',
    answer: (t.answer || '').slice(0, 200) + ((t.answer || '').length > 200 ? '…' : ''),
  }));

  const userMsg = `## TIME AND COVERAGE
Duration: ${durationSeconds} seconds. Remaining: ${remainingSeconds} seconds (server-enforced hard limit).
Skills assessed: ${skillsAssessed.join(', ') || 'None'}

## TRANSCRIPT SO FAR (${transcript.length} answered)
${JSON.stringify(transcriptSummary, null, 2)}

## LAST ANSWER QUALITY: ${answerQuality || 'N/A'}
(A=excellent, B=good, C=adequate, D=weak, E=blank/very weak)

## TASK
Decide the best next action. Do not end before at least two substantive answers unless time has expired. Do not start a long exercise under five minutes. Prioritize unassessed required skills and avoid substantially repeating prior questions unless it is an intentional follow-up.

Return ONLY valid JSON — no markdown, no explanation:
{
  "nextAction": "ASK_QUESTION|END_INTERVIEW",
  "id": ${qNum},
  "stage": "introduction|resume_validation|technical|scenario|domain",
  "type": "experience|resume_probe|technical|practical|scenario|system_design|clarification",
  "skill": "<primary skill being assessed>",
  "difficulty": "basic|intermediate|advanced|expert",
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
  try {
    const completion = await openai.chat.completions.create({ model: getModel(), temperature: 0.2, max_tokens: 700, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Evaluate a single interview answer fairly using job-relevant evidence only. Return JSON only.' }, { role: 'user', content: JSON.stringify({ role: profile.jobTitle, requiredSkills: profile.requiredSkills, question, answer, previousAnswers: transcript.slice(-3).map(t => ({ question: t.question?.question, answer: t.answer })), schema: { score: '0-10', correctness: '0-10', technicalDepth: '0-10', practicalKnowledge: '0-10', problemSolving: '0-10', communication: '0-10', confidence: '0-10', strengths: [], weaknesses: [], assessment: 'string', recommendedDifficulty: 'basic|intermediate|advanced|expert' } }) }] });
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
    { "skill": "<skill name>", "score": <0-100>, "confidence": "high|medium|low", "evidence": "<what candidate said>", "level": "basic|intermediate|advanced|expert" }
  ],
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

async function createAdaptiveSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, profile, durationMinutes = 30, expiresHours = 48 }) {
  const durationSeconds = Math.min(Math.max(Number(durationMinutes) || 30, 15), 60) * 60;
  return createSession({ candidateId, jobReqId, recruiterId, candidateName, candidateEmail, jobTitle, questions: { profile, transcript: [], durationSeconds, skillsAssessed: [], status: 'PENDING' }, expiresHours });
}

async function startAdaptiveSession(token) {
  const session = await getSession(token);
  if (!session) return null;
  const state = parseState(session.questions_json);
  if (!state.startedAt) {
    state.startedAt = new Date().toISOString();
    state.expiresAt = new Date(Date.now() + (Number(state.durationSeconds) || 1800) * 1000).toISOString();
    state.status = 'IN_PROGRESS';
  }
  if (getRemainingSeconds(state) <= 0) return null;
  if (!state.currentQuestion) {
    state.currentQuestion = await generateNextQuestion(state);
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
  const answerQuality = _scoreLastAnswer([...state.transcript, { answer: String(answer || '').trim() }]);
  const evaluation = await evaluateAnswer({ profile: state.profile || {}, question: state.currentQuestion, answer, transcript: state.transcript });
  state.transcript.push({ question: state.currentQuestion, answer: String(answer || '').trim(), answeredAt: new Date().toISOString(), answerQuality, evaluation });
  if (state.currentQuestion.skill && !state.skillsAssessed.includes(state.currentQuestion.skill)) state.skillsAssessed.push(state.currentQuestion.skill);
  state.currentQuestion = await generateNextQuestion(state);
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
