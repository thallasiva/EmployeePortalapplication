'use strict';
/**
 * Dynamic Resume Parser Service
 * - Fields loaded from DB (sp_rec_get_parser_fields)
 * - Dynamic prompt builder
 * - OpenAI with regex fallback
 * - Dynamic persistence via sp_rec_save_dynamic_field
 * - Duplicate check, logging, scoring
 */
const crypto   = require('crypto');
const path     = require('path');
const _pdf     = require('pdf-parse');
const pdfParse = _pdf.default || _pdf;
const mammoth  = require('mammoth');
const OpenAI   = require('openai');
const { callProcedure } = require('../../config/db');

/* ── OpenAI singleton ── */
let _openai = null;
function getOpenAI() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your-openai-api-key-here') {
    console.warn('[ResumeParser] OPENAI_API_KEY not set — using regex fallback');
    return null;
  }
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

function getModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

/* ── Utilities ── */
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function normalizeText(text = '') {
  return text
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .trim();
}

async function extractText(buffer, mimeType, fileName) {
  const ext = path.extname(fileName || '').replace('.', '').toLowerCase();
  switch (ext) {
    case 'pdf': {
      const r = await pdfParse(buffer);
      return normalizeText(r.text || '');
    }
    case 'doc':
    case 'docx': {
      const r = await mammoth.extractRawText({ buffer });
      return normalizeText(r.value || '');
    }
    case 'txt':
      return normalizeText(buffer.toString('utf8'));
    default:
      if (mimeType === 'application/pdf') {
        const r = await pdfParse(buffer);
        return normalizeText(r.text || '');
      }
      throw new Error('Unsupported resume format. Upload PDF, DOC, DOCX or TXT.');
  }
}

/* ── Dynamic field loader ── */
async function loadParserFields() {
  try {
    const rows = await callProcedure('sp_rec_get_parser_fields()');
    if (rows && rows[0] && rows[0].length) return rows[0];
  } catch (err) {
    console.warn('[ResumeParser] sp_rec_get_parser_fields failed, using defaults:', err.message);
  }
  // Default field schema
  return [
    { field_name: 'name',                type: 'string',  required: 1 },
    { field_name: 'email',               type: 'string',  required: 1 },
    { field_name: 'phone',               type: 'string',  required: 0 },
    { field_name: 'skills',              type: 'array',   required: 0 },
    { field_name: 'experience',          type: 'number',  required: 0 },
    { field_name: 'education',           type: 'array',   required: 0 },
    { field_name: 'work_experience',     type: 'array',   required: 0 },
    { field_name: 'companies',           type: 'array',   required: 0 },
    { field_name: 'location',            type: 'string'              },
    { field_name: 'current_role',        type: 'string'              },
    { field_name: 'current_company',     type: 'string'              },
    { field_name: 'linkedin_url',        type: 'string'              },
    { field_name: 'github_url',          type: 'string'              },
    { field_name: 'notice_period_days',  type: 'number'              },
    { field_name: 'current_ctc_annual',  type: 'number'              },
    { field_name: 'expected_ctc_annual', type: 'number'              },
    { field_name: 'summary',             type: 'string'              },
    { field_name: 'certifications',      type: 'array'               },
    { field_name: 'languages',           type: 'array'               },
  ];
}

/* ── Dynamic prompt builder ── */
function buildPrompt(fields, resumeText) {
  const list = fields.map(f => `- ${f.field_name} (${f.type})`).join('\n');
  return `You are an expert ATS Resume Parser.
Extract ALL possible information from the resume below.
Return ONLY valid JSON — no markdown, no code fences, no explanation.

Fields to extract:
${list}

Rules:
1. Return only a JSON object.
2. Arrays must always be arrays (never null for array fields).
3. Missing values → null (or [] for arrays).
4. Never invent data not present in the resume.
5. Preserve company names, dates, and skills exactly as written.
6. notice_period_days: convert "2 months"→60, "30 days"→30, "immediate"→0.
7. current_ctc_annual / expected_ctc_annual: convert to annual INR number ("12 LPA"→1200000).

Resume:
---
${resumeText.slice(0, 25000)}
---`;
}

function safeJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(
      text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
    );
  } catch { return {}; }
}

/* ── Regex fallback helpers ── */
function regexEmail(t)    { const m = t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/); return m?m[0]:null; }
function regexPhone(t)    { const m = t.match(/(?:\+91[- ]?)?[6-9]\d{9}/); return m?m[0]:null; }
function regexLinkedIn(t) { const m = t.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?/i); return m?m[0]:null; }
function regexGithub(t)   { const m = t.match(/https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9-_%]+\/?/i); return m?m[0]:null; }
function regexName(t) {
  const lines = t.split('\n').map(l=>l.trim()).filter(Boolean);
  for (const line of lines.slice(0,10)) {
    const words = line.split(/\s+/);
    if (words.length>=2&&words.length<=4&&words.every(w=>/^[A-Za-z.'-]{1,30}$/.test(w))&&
        !line.toLowerCase().match(/resume|curriculum|profile|summary|objective|email|phone|mobile/))
      return line;
  }
  return null;
}
function regexExperience(t) {
  const pats = [
    /(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+)?(?:work\s+)?experience/i,
    /(\d+)\s*\+?\s*yrs?\s+(?:of\s+)?experience/i,
    /experience\s*(?:of\s*)?(\d+)\s*\+?\s*years?/i,
  ];
  for (const p of pats) { const m=t.match(p); if(m) return Number(m[1]); }
  return 0;
}
function regexNoticePeriod(t) {
  if (/immediate(?:ly)?\s+(?:joiner|available|join)/i.test(t)) return 0;
  const months = t.match(/(\d+)\s*months?\s+notice/i);
  if (months) return Number(months[1])*30;
  const days = t.match(/(\d+)\s*days?\s+notice/i);
  if (days) return Number(days[1]);
  return null;
}

function regexFallback(text) {
  return {
    name:                regexName(text),
    email:               regexEmail(text),
    phone:               regexPhone(text),
    linkedin_url:        regexLinkedIn(text),
    github_url:          regexGithub(text),
    experience:          regexExperience(text),
    notice_period_days:  regexNoticePeriod(text),
    skills: [], education: [], work_experience: [], companies: [],
    summary: null, location: null, current_role: null, current_company: null,
    current_ctc_annual: null, expected_ctc_annual: null,
    certifications: [], languages: [],
  };
}

/* ── OpenAI parsing ── */
async function parseWithOpenAI(text, parserFields) {
  const client = getOpenAI();
  if (!client) return null;
  const prompt = buildPrompt(parserFields, text);
  try {
    const resp = await client.chat.completions.create({
      model: getModel(),
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a world-class ATS Resume Parser. Return only valid JSON.' },
        { role: 'user',   content: prompt },
      ],
    });
    return safeJson(resp.choices?.[0]?.message?.content);
  } catch (err) {
    console.error('[ResumeParser] OpenAI failed:', err.message);
    return null;
  }
}

/* ── Dynamic field normalizer ── */
function normalizeValue(value, type) {
  if (value === undefined || value === '') return type === 'array' ? [] : null;
  if (value === null) return type === 'array' ? [] : null;
  switch (type) {
    case 'number':  return Number(value) || 0;
    case 'array':   return Array.isArray(value) ? value : [value];
    case 'boolean': return Boolean(value);
    default:        return value;
  }
}

function mapDynamicFields(ai, parserFields) {
  const parsed = {};
  for (const field of parserFields) {
    parsed[field.field_name] = normalizeValue(ai[field.field_name], field.type);
  }
  return parsed;
}

function validateParsedData(parsed, parserFields) {
  for (const field of parserFields) {
    if (field.required == 1 && (parsed[field.field_name] == null || parsed[field.field_name] === '')) {
      parsed[field.field_name] = null;
    }
  }
  return parsed;
}

/* ── Core parse ── */
async function parseResume(buffer, mimeType, fileName) {
  const parserFields = await loadParserFields();
  const resumeHash   = sha256(buffer);
  const rawText      = await extractText(buffer, mimeType, fileName);

  let ai = await parseWithOpenAI(rawText, parserFields);
  if (!ai || Object.keys(ai).length === 0) ai = regexFallback(rawText);

  const parsed = mapDynamicFields(ai, parserFields);
  validateParsedData(parsed, parserFields);

  parsed.rawText    = rawText;
  parsed.resumeHash = resumeHash;
  parsed.parsedBy   = getOpenAI() ? 'openai' : 'regex';
  return parsed;
}

/* ── Scoring ── */
function calculateResumeScore(parsed) {
  let score = 0;
  if (parsed.skills?.length)          score += Math.min(parsed.skills.length * 3, 30);
  if (parsed.work_experience?.length) score += Math.min(parsed.work_experience.length * 10, 20);
  if (parsed.education?.length)       score += 10;
  if (parsed.certifications?.length)  score += Math.min(parsed.certifications.length * 2, 10);
  if (parsed.current_company)         score += 10;
  if (parsed.current_role)            score += 10;
  if (parsed.languages?.length)       score += 5;
  if (parsed.summary)                 score += 5;
  return Math.min(score, 100);
}

function calculateJobMatch(parsed, job) {
  let score = 0;
  const candidateSkills = (parsed.skills || []).map(s => s.toLowerCase());
  const requiredSkills  = (job.requiredSkills || []).map(s => s.toLowerCase());
  if (requiredSkills.length > 0) {
    const matched = requiredSkills.filter(s => candidateSkills.includes(s)).length;
    score += (matched / requiredSkills.length) * 60;
  }
  if (Number(parsed.experience || 0) >= job.minExperience) score += 20;
  if (parsed.education?.length)    score += 10;
  if (parsed.certifications?.length) score += 10;
  return Math.round(score);
}

/* ── Flatten for full-text search ── */
function flattenResume(parsed) {
  const json = {};
  Object.keys(parsed).forEach(key => {
    const v = parsed[key];
    if (Array.isArray(v)) json[key] = v.join(',');
    else if (typeof v === 'object' && v !== null) json[key] = JSON.stringify(v);
    else json[key] = v;
  });
  return json;
}

/* ── Field summary for logs ── */
function buildFieldsSummary(parsed) {
  const summary = {};
  Object.keys(parsed).forEach(key => {
    const v = parsed[key];
    if (Array.isArray(v)) summary[key] = v.length;
    else summary[key] = (v !== null && v !== undefined && v !== '');
  });
  return summary;
}

/* ── Normalize (add score + search doc) ── */
function normalizeParsedResume(parsed) {
  parsed.resume_score     = calculateResumeScore(parsed);
  parsed.search_document  = flattenResume(parsed);
  parsed.parsed_date      = new Date();
  return parsed;
}

/* ── Duplicate check ── */
async function checkDuplicate(parsed) {
  try {
    const rows = await callProcedure(
      'sp_rec_check_duplicate_candidate_dynamic(?,?,?,?,?)',
      [
        parsed.email        || null,
        parsed.phone        || null,
        parsed.linkedin_url || null,
        parsed.resumeHash   || null,
        parsed.github_url   || null,
      ]
    );
    return rows?.[0] || [];
  } catch (err) {
    console.error('[ResumeParser] Duplicate check failed:', err.message);
    return [];
  }
}

/* ── Dynamic persistence ── */
async function saveDynamicField(candidateId, field, value) {
  try {
    await callProcedure('sp_rec_save_dynamic_field(?,?,?)', [
      candidateId, field, JSON.stringify(value),
    ]);
  } catch (err) {
    console.error('[ResumeParser] saveDynamicField', field, err.message);
  }
}

async function persistParsedResume(candidateId, parsed) {
  // Save full JSON blob
  try {
    await callProcedure('sp_rec_save_candidate_json(?,?)', [
      candidateId, JSON.stringify(parsed),
    ]);
  } catch (err) {
    console.error('[ResumeParser] sp_rec_save_candidate_json failed:', err.message);
  }
  // Save individual dynamic fields
  for (const field of Object.keys(parsed)) {
    await saveDynamicField(candidateId, field, parsed[field]);
  }
}

/* ── Parse log ── */
async function logParse({ candidateId, parsed, filename, mimeType, fileSize, duration, status, error }) {
  try {
    await callProcedure('sp_rec_log_parser_dynamic(?,?,?,?,?,?,?,?,?,?,?)', [
      candidateId,
      filename,
      mimeType,
      fileSize,
      parsed?.parsedBy || 'none',
      status,
      error || null,
      parsed?.rawText?.length || 0,
      JSON.stringify(buildFieldsSummary(parsed || {})),
      duration,
      JSON.stringify(parsed || {}),
    ]);
  } catch (err) {
    console.error('[ResumeParser] logParse failed:', err.message);
  }
}

/* ── Full pipeline ── */
async function processResume(candidateId, file) {
  const started = Date.now();
  try {
    const parsed = await parseResume(file.buffer, file.mimetype, file.originalname);
    const duplicate = await checkDuplicate(parsed);

    if (duplicate.length > 0) {
      return { success: false, duplicate: true, duplicateCandidate: duplicate[0], parsed };
    }

    await persistParsedResume(candidateId, parsed);
    await logParse({
      candidateId, parsed,
      filename: file.originalname, mimeType: file.mimetype, fileSize: file.size,
      duration: Date.now() - started, status: 'SUCCESS', error: null,
    });

    return { success: true, duplicate: false, parsed };
  } catch (err) {
    console.error('[ResumeParser] processResume failed:', err.message);
    await logParse({
      candidateId,
      parsed: { rawText: '', parsedBy: 'FAILED' },
      filename: file.originalname, mimeType: file.mimetype, fileSize: file.size,
      duration: Date.now() - started, status: 'FAILED', error: err.message,
    });
    throw err;
  }
}

async function saveResume(candidateId, file) {
  const result = await processResume(candidateId, file);
  if (!result.success) return result;
  normalizeParsedResume(result.parsed);
  return result;
}

/* ── Exports ── */
module.exports = {
  parseResume,
  processResume,
  saveResume,
  persistParsedResume,
  checkDuplicate,
  calculateResumeScore,
  calculateJobMatch,
  normalizeParsedResume,
  flattenResume,
  buildFieldsSummary,
  logParse,
  sha256,
  extractText,
  loadParserFields,
  buildPrompt,
  parseWithOpenAI,
};
