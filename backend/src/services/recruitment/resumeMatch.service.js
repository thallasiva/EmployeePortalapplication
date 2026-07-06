'use strict';

/**
 * Resume Match Service
 * Pure keyword-based scoring engine — no external AI dependencies.
 *
 * Weights:  Skills 60%  |  Experience 40%
 *
 * Skill aliases: normalises common equivalents so "JS" matches "JavaScript",
 * "ReactJS" matches "React", etc.
 */

const { callProcedure, query } = require("../../config/db");

// ── Skill alias map (lower-case) ────────────────────────────────────────────
const ALIAS_MAP = {
  "js":            ["javascript"],
  "javascript":    ["js"],
  "ts":            ["typescript"],
  "typescript":    ["ts"],
  "react":         ["reactjs", "react.js"],
  "reactjs":       ["react", "react.js"],
  "node":          ["node.js", "nodejs"],
  "node.js":       ["node", "nodejs"],
  "nodejs":        ["node", "node.js"],
  "vue":           ["vuejs", "vue.js"],
  "vuejs":         ["vue", "vue.js"],
  "angular":       ["angularjs"],
  "angularjs":     ["angular"],
  "mongo":         ["mongodb"],
  "mongodb":       ["mongo"],
  "postgres":      ["postgresql"],
  "postgresql":    ["postgres"],
  "mysql":         ["my sql"],
  "dotnet":        [".net", "dot net"],
  ".net":          ["dotnet", "dot net"],
  "expressjs":     ["express", "express.js"],
  "express":       ["expressjs", "express.js"],
  "aws":           ["amazon web services"],
  "gcp":           ["google cloud"],
  "k8s":           ["kubernetes"],
  "rest":          ["rest api", "restful", "restful api"],
  "rest api":      ["rest", "restful", "restful api"],
  "restful":       ["rest", "rest api"],
};

function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9.+#]/g, " ").replace(/\s+/g, " ").trim();
}

function parseSkills(skillSetStr) {
  if (!skillSetStr) return [];
  return skillSetStr
    .split(/[,;|\/\n]/)
    .map(s => normalise(s))
    .filter(Boolean);
}

function skillMatches(required, candidateSkills) {
  const reqNorm = normalise(required);
  if (candidateSkills.includes(reqNorm)) return true;

  // Check aliases
  const aliases = ALIAS_MAP[reqNorm] || [];
  return aliases.some(alias => candidateSkills.includes(alias));
}

/**
 * Parse the minimum years from a job experience_level string.
 * "2-4 Years" → 2,  "3+ Years" → 3,  "5 years" → 5,  "Senior" → 3 (fallback)
 */
function parseMinExperience(expLevel) {
  if (!expLevel) return 0;
  const match = String(expLevel).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

// ── Core scoring logic ───────────────────────────────────────────────────────
function computeScore({ candidateSkillSet, relevantExperience, jobSkillSet, jobExperienceLevel }) {
  const jobSkills       = parseSkills(jobSkillSet);
  const candSkills      = parseSkills(candidateSkillSet);
  const candExp         = Number(relevantExperience) || 0;
  const reqExp          = parseMinExperience(jobExperienceLevel);

  // ── Skills (60%) ──────────────────────────────────────────────────────────
  const matched  = [];
  const missing  = [];

  if (jobSkills.length === 0) {
    // No required skills defined — give full skill score
  } else {
    for (const skill of jobSkills) {
      if (skillMatches(skill, candSkills)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }
  }

  const skillScore = jobSkills.length > 0
    ? Math.round((matched.length / jobSkills.length) * 100)
    : 100;

  // ── Experience (40%) ──────────────────────────────────────────────────────
  let expScore;
  if (reqExp === 0) {
    expScore = 100;
  } else if (candExp >= reqExp) {
    expScore = 100;
  } else {
    expScore = Math.round((candExp / reqExp) * 100);
  }

  // ── Weighted total ────────────────────────────────────────────────────────
  const total = Math.round(skillScore * 0.6 + expScore * 0.4);

  // ── Recommendation ────────────────────────────────────────────────────────
  let recommendation;
  if (total >= 80)      recommendation = "Highly Suitable";
  else if (total >= 65) recommendation = "Suitable";
  else if (total >= 45) recommendation = "Partially Suitable";
  else                  recommendation = "Not Suitable";

  return {
    matchScore:  total,
    skillScore,
    expScore,
    matched,
    missing,
    recommendation,
  };
}

// ── Service methods ──────────────────────────────────────────────────────────

/**
 * Fetch candidate + job from DB, compute score, upsert result.
 */
async function computeAndStore(candidateId, jobReqId) {
  // Fetch candidate
  const [candRows] = await query(
    "SELECT skill_set, relevant_experience FROM rec_candidates WHERE candidate_id = ?",
    [candidateId]
  );
  const cand = Array.isArray(candRows) ? candRows[0] : candRows;
  if (!cand) throw new Error(`Candidate ${candidateId} not found`);

  // Fetch job
  const [jobRows] = await query(
    "SELECT skill_set, experience_level FROM rec_job_requests WHERE job_req_id = ?",
    [jobReqId]
  );
  const job = Array.isArray(jobRows) ? jobRows[0] : jobRows;
  if (!job) throw new Error(`Job ${jobReqId} not found`);

  const result = computeScore({
    candidateSkillSet:  cand.skill_set,
    relevantExperience: cand.relevant_experience,
    jobSkillSet:        job.skill_set,
    jobExperienceLevel: job.experience_level,
  });

  // Upsert into DB
  const rows = await callProcedure(
    "sp_rec_upsert_match(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      candidateId,
      jobReqId,
      result.matchScore,
      result.skillScore,
      result.expScore,
      JSON.stringify(result.matched),
      JSON.stringify(result.missing),
      result.recommendation,
    ]
  );

  return (rows[0] ?? [])[0];
}

async function getMatch(candidateId, jobReqId) {
  const rows = await callProcedure(
    "sp_rec_get_match(?, ?)",
    [candidateId, jobReqId]
  );
  return (rows[0] ?? [])[0] || null;
}

async function listByJob(jobReqId) {
  const rows = await callProcedure(
    "sp_rec_list_matches_by_job(?)",
    [jobReqId]
  );
  return rows[0] ?? [];
}

/**
 * Auto-compute match for a newly added candidate against their job.
 * Non-blocking — errors are only logged.
 */
function autoComputeAsync(candidateId, jobReqId) {
  if (!candidateId || !jobReqId) return;
  setImmediate(async () => {
    try {
      await computeAndStore(candidateId, jobReqId);
      console.log(`[ResumeMatch] Scored candidate ${candidateId} vs job ${jobReqId}`);
    } catch (err) {
      console.error(`[ResumeMatch] Failed for candidate ${candidateId}:`, err.message);
    }
  });
}

/**
 * Quick match — compute score from raw inputs without storing anything.
 * Used by the recruiter "Quick Check" tool.
 */
async function quickMatch({ jobReqId, candidateSkills, candidateExperience }) {
  const [jobRows] = await query(
    "SELECT title, skill_set, experience_level FROM rec_job_requests WHERE job_req_id = ?",
    [jobReqId]
  );
  const job = Array.isArray(jobRows) ? jobRows[0] : jobRows;
  if (!job) throw new Error(`Job ${jobReqId} not found`);

  const result = computeScore({
    candidateSkillSet:  candidateSkills,
    relevantExperience: candidateExperience,
    jobSkillSet:        job.skill_set,
    jobExperienceLevel: job.experience_level,
  });

  return { ...result, jobTitle: job.title, jobExperienceLevel: job.experience_level };
}

module.exports = { computeAndStore, getMatch, listByJob, autoComputeAsync, quickMatch };
