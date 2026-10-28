'use strict';
/**
 * HR-approved AI interview plans.
 *
 * For each job, HR generates a question set (AI when configured, otherwise the role
 * question bank), edits it, and approves it. Candidates are only ever asked questions
 * from the job's approved plan, and each answer is scored against that question's
 * expected points.
 */
const OpenAI = require('openai');
const { query, callProcedure, withTransaction } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { buildQuestionPlan } = require('./interviewQuestionBank');
const DEFAULT_TIME = { experience: 180, resume_probe: 180, technical: 180, practical: 180, scenario: 300, system_design: 600, coding: 600 };
// Scoring guide used for question-bank questions (the AI writes question-specific ones).
const GENERIC_POINTS = {
  experience: ['Describes their own role clearly', 'Gives concrete examples with results', 'Communicates in a structured way'],
  resume_probe: ['Explains the architecture or workflow accurately', 'Is specific about what they personally built', 'Mentions tools, data and challenges faced'],
  technical: ['Explains the concept correctly', 'Gives a real example from their work', 'Mentions trade-offs, limits or edge cases'],
  practical: ['Describes a concrete, step-by-step approach', 'Uses appropriate tools or techniques', 'Considers impact, risks or verification'],
  scenario: ['Starts by understanding/triaging the problem', 'Prioritises and communicates with stakeholders', 'Explains how they verify the fix and prevent recurrence'],
};
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your-openai-api-key-here') return null;
  return new OpenAI({ apiKey: key });
}
async function loadJob(jobReqId) {
  const res = await callProcedure('sp_rec_get_job_request(?)', [Number(jobReqId)]);
  const job = (res[0] ?? [])[0];
  if (!job) throw ApiError.notFound('Job not found');
  return job;
}
function jobProfile(job) {
  return {
    jobTitle: job.title || job.job_title || 'Position',
    jobDescription: job.description || '',
    requiredSkills: job.skill_set || job.required_skills || '',
    experienceLevel: job.experience_level || '',
  };
}
const parseJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};
async function generateWithAI(profile, count) {
  const openai = getOpenAI();
  if (!openai) return null;
  const prompt = `You are preparing a structured first-round interview for this job.

Job title: ${profile.jobTitle}
Experience level: ${profile.experienceLevel || 'not stated'}
Required skills: ${profile.requiredSkills || 'not stated'}
Job description: ${String(profile.jobDescription || 'not provided').slice(0, 2500)}

Write exactly ${count} interview questions:
- Question 1 is an introduction about the candidate's current role and project.
- Question 2 validates real project experience with the most important skill.
- Most remaining questions test the REQUIRED skills of THIS job specifically, at a difficulty suited to the experience level; include 1–2 realistic scenario questions.
- Each question must be answerable verbally in 2–5 minutes; no multi-part essays; no trivia.
- For each question give 3–5 "expectedPoints": the specific points a strong answer covers (this is the scoring guide).

Return ONLY JSON: {"questions":[{"question":"","stage":"introduction|resume_validation|technical|scenario|domain","type":"experience|resume_probe|technical|practical|scenario","skill":"","difficulty":"fundamental|intermediate|proficient|advanced|senior","expectedPoints":[""],"timeLimitSeconds":180}]}`;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const list = Array.isArray(parsed.questions) ? parsed.questions : [];
    const clean = list
      .filter((q) => String(q?.question || '').trim().length > 10)
      .map((q) => ({
        question_text: String(q.question).trim().slice(0, 1000),
        stage: String(q.stage || 'technical').slice(0, 30),
        question_type: String(q.type || 'technical').slice(0, 30),
        skill: q.skill ? String(q.skill).slice(0, 100) : null,
        difficulty: String(q.difficulty || 'intermediate').slice(0, 20),
        expected_points: (Array.isArray(q.expectedPoints) ? q.expectedPoints : []).map((p) => String(p).trim()).filter(Boolean).slice(0, 6),
        time_limit_seconds: Math.min(900, Math.max(60, Number(q.timeLimitSeconds) || DEFAULT_TIME[q.type] || 180)),
      }));
    return clean.length >= 3 ? clean.slice(0, count) : null;
  } catch (err) {
    console.warn('[InterviewPlan] AI generation failed, using question bank:', err.message);
    return null;
  }
}
function generateFromBank(profile, count) {
  const { plan } = buildQuestionPlan(profile, Date.now() % 2147483647);
  return plan.slice(0, count).map((q) => ({
    question_text: q.question,
    stage: q.stage || 'technical',
    question_type: q.type || 'technical',
    skill: q.skill || null,
    difficulty: 'intermediate',
    expected_points: GENERIC_POINTS[q.type] || GENERIC_POINTS.technical,
    time_limit_seconds: DEFAULT_TIME[q.type] || (q.stage === 'scenario' ? 300 : 180),
  }));
}
async function getPlan(planId) {
  const [plan] = await query(
    `SELECT p.*, j.title AS job_title,
            TRIM(CONCAT_WS(' ', ec.first_name, ec.last_name)) AS created_by_name,
            TRIM(CONCAT_WS(' ', ea.first_name, ea.last_name)) AS approved_by_name
       FROM ai_interview_plans p
       JOIN rec_job_requests j ON j.job_req_id = p.job_req_id
       LEFT JOIN employees ec ON ec.employee_id = p.created_by
       LEFT JOIN employees ea ON ea.employee_id = p.approved_by
      WHERE p.plan_id = ?`, [planId]);
  if (!plan) return null;
  const questions = await query('SELECT * FROM ai_interview_plan_questions WHERE plan_id = ? ORDER BY sort_order, question_id', [planId]);
  return { ...plan, questions: questions.map((q) => ({ ...q, expected_points: parseJson(q.expected_points, []) })) };
}
/** Plans for a job: the approved one (if any), the current draft (if any), and history. */
async function listForJob(jobReqId) {
  const rows = await query(
    `SELECT p.plan_id, p.version, p.status, p.generated_by, p.duration_minutes, p.approved_at, p.created_at, p.updated_at,
            (SELECT COUNT(*) FROM ai_interview_plan_questions q WHERE q.plan_id = p.plan_id) AS question_count,
            (SELECT COUNT(*) FROM ai_interview_sessions s WHERE s.plan_id = p.plan_id) AS interviews_used
       FROM ai_interview_plans p WHERE p.job_req_id = ? ORDER BY p.version DESC`, [jobReqId]);
  const approved = rows.find((r) => r.status === 'APPROVED');
  const draft = rows.find((r) => r.status === 'DRAFT');
  return {
    approved: approved ? await getPlan(approved.plan_id) : null,
    draft: draft ? await getPlan(draft.plan_id) : null,
    history: rows,
  };
}
/** Per job: does it have an approved plan? Used by the invitation form. */
async function jobPlanStatuses() {
  return query(
    `SELECT j.job_req_id, j.title,
            MAX(p.status = 'APPROVED') AS has_approved, MAX(p.status = 'DRAFT') AS has_draft
       FROM rec_job_requests j LEFT JOIN ai_interview_plans p ON p.job_req_id = j.job_req_id
      WHERE j.deleted_at IS NULL GROUP BY j.job_req_id, j.title`);
}
async function generateDraft(jobReqId, userId, { questionCount = 8, durationMinutes = 30 } = {}) {
  const job = await loadJob(jobReqId);
  const profile = jobProfile(job);
  const count = Math.min(15, Math.max(4, Number(questionCount) || 8));
  const aiQuestions = await generateWithAI(profile, count);
  const questions = aiQuestions || generateFromBank(profile, count);
  const generatedBy = aiQuestions ? 'ai' : 'question_bank';
  const planId = await withTransaction(async (conn) => {
    // Only one draft per job: a new generation replaces the previous draft.
    await conn.query("DELETE FROM ai_interview_plans WHERE job_req_id = ? AND status = 'DRAFT'", [jobReqId]);
    const [[v]] = await conn.query('SELECT COALESCE(MAX(version), 0) + 1 AS next FROM ai_interview_plans WHERE job_req_id = ?', [jobReqId]);
    const [ins] = await conn.query(
      `INSERT INTO ai_interview_plans (job_req_id, version, status, duration_minutes, generated_by, created_by)
       VALUES (?, ?, 'DRAFT', ?, ?, ?)`,
      [jobReqId, v.next, Math.min(60, Math.max(10, Number(durationMinutes) || 30)), generatedBy, userId || null]);
    await insertQuestions(conn, ins.insertId, questions);
    return ins.insertId;
  });
  return getPlan(planId);
}
async function insertQuestions(conn, planId, questions) {
  let order = 0;
  for (const q of questions) {
    order += 10;
    await conn.query(
      `INSERT INTO ai_interview_plan_questions
         (plan_id, sort_order, stage, question_type, skill, difficulty, question_text, expected_points, time_limit_seconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [planId, order, q.stage || 'technical', q.question_type || 'technical', q.skill || null, q.difficulty || 'intermediate',
        String(q.question_text).trim(), JSON.stringify((q.expected_points || []).filter(Boolean)), Number(q.time_limit_seconds) || 180]);
  }
}
async function assertDraft(planId) {
  const [p] = await query('SELECT status FROM ai_interview_plans WHERE plan_id = ?', [planId]);
  if (!p) throw ApiError.notFound('Interview plan not found');
  if (p.status !== 'DRAFT') throw ApiError.conflict('Only a draft plan can be edited. Create a new draft from the approved plan to make changes.');
}
/** Replaces the draft's questions and settings with HR's edited version. */
async function saveDraft(planId, { questions, durationMinutes, notes }) {
  await assertDraft(planId);
  await withTransaction(async (conn) => {
    await conn.query('DELETE FROM ai_interview_plan_questions WHERE plan_id = ?', [planId]);
    await insertQuestions(conn, planId, questions);
    await conn.query(
      `UPDATE ai_interview_plans SET duration_minutes = COALESCE(?, duration_minutes), notes = ?, generated_by =
         IF(generated_by = 'manual', 'manual', generated_by) WHERE plan_id = ?`,
      [durationMinutes ? Math.min(60, Math.max(10, Number(durationMinutes))) : null, notes || null, planId]);
  });
  return getPlan(planId);
}
async function approve(planId, userId) {
  await assertDraft(planId);
  const plan = await getPlan(planId);
  if (plan.questions.length < 3) throw ApiError.badRequest('Add at least 3 questions before approving');
  const missingGuide = plan.questions.filter((q) => !q.expected_points?.length).length;
  if (missingGuide) throw ApiError.badRequest(`${missingGuide} question(s) have no scoring guide (expected points)`);
  await withTransaction(async (conn) => {
    await conn.query("UPDATE ai_interview_plans SET status = 'ARCHIVED' WHERE job_req_id = ? AND status = 'APPROVED'", [plan.job_req_id]);
    await conn.query("UPDATE ai_interview_plans SET status = 'APPROVED', approved_by = ?, approved_at = NOW() WHERE plan_id = ?", [userId || null, planId]);
  });
  return getPlan(planId);
}
/** Starts a new draft as a copy of the approved plan, so HR can revise it. */
async function reviseApproved(jobReqId, userId) {
  const { approved, draft } = await listForJob(jobReqId);
  if (draft) return draft;
  if (!approved) throw ApiError.badRequest('This job has no approved plan to revise');
  const planId = await withTransaction(async (conn) => {
    const [[v]] = await conn.query('SELECT COALESCE(MAX(version), 0) + 1 AS next FROM ai_interview_plans WHERE job_req_id = ?', [jobReqId]);
    const [ins] = await conn.query(
      `INSERT INTO ai_interview_plans (job_req_id, version, status, duration_minutes, generated_by, created_by, notes)
       VALUES (?, ?, 'DRAFT', ?, 'manual', ?, ?)`,
      [jobReqId, v.next, approved.duration_minutes, userId || null, approved.notes]);
    await insertQuestions(conn, ins.insertId, approved.questions);
    return ins.insertId;
  });
  return getPlan(planId);
}
async function discardDraft(planId) {
  await assertDraft(planId);
  await query('DELETE FROM ai_interview_plans WHERE plan_id = ?', [planId]);
}
async function getApprovedForJob(jobReqId) {
  const [row] = await query("SELECT plan_id FROM ai_interview_plans WHERE job_req_id = ? AND status = 'APPROVED' LIMIT 1", [jobReqId]);
  return row ? getPlan(row.plan_id) : null;
}
module.exports = {
  listForJob, jobPlanStatuses, getPlan, generateDraft, saveDraft, approve, reviseApproved, discardDraft, getApprovedForJob,
};
