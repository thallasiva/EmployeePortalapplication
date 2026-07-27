'use strict';

const crypto  = require('crypto');
const _pdfParse = require('pdf-parse');
const pdfParse  = _pdfParse.default || _pdfParse;
const mammoth   = require('mammoth');
const OpenAI    = require('openai');

const { callProcedure } = require('../../config/db');

// ── OpenAI client (lazy) ─────────────────────────────────────────────────────
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

// ── SHA-256 hash of file buffer (for duplicate detection) ─────────────────────
function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ── Extract raw text ─────────────────────────────────────────────────────────
async function extractText(buffer, mimetype, originalname) {
  const ext = (originalname || '').split('.').pop().toLowerCase();

  if (mimetype === 'application/pdf' || ext === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    ext === 'docx' || ext === 'doc'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

// ── Clean raw text before feeding to AI / regex ───────────────────────────────
function cleanText(raw) {
  return raw
    // Collapse 3+ blank lines → 2
    .replace(/(\r?\n){3,}/g, '\n\n')
    // Remove PDF artifact characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace smart quotes / dashes with plain ASCII
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    // Collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    .trim();
}

// ── GPT-4o mini extraction ────────────────────────────────────────────────────
async function parseWithOpenAI(text, retries = 2) {
  const client = getOpenAI();
  if (!client) return null;

  // Trim to ~8000 chars (covers most resumes without wasting tokens)
  const trimmed = text.slice(0, 8000);

  const prompt = `You are an expert resume parser. Extract every field listed below from the resume text and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Fields:
- name: full candidate name (string | null)
- email: email address (string | null)
- phone: primary phone number (string | null)
- skills: array of ALL technical and professional skills — be thorough, include frameworks, tools, languages, methodologies (string[])
- experience: total years of work experience as a number (number, 0 if not found)
- education: array of { degree: string, institution: string | null, year: number | null } — empty array if none
- work_experience: array of { company_name: string, designation: string | null, start_month: number | null, start_year: number | null, end_month: number | null, end_year: number | null, is_current: 0|1, description: string | null } — ordered newest first
- companies: array of ALL company/employer names ever mentioned in work history (string[])
- location: current city or location of the candidate (string | null)
- current_role: most recent job title (string | null)
- current_company: most recent employer name (string | null)
- linkedin_url: LinkedIn profile URL (string | null)
- github_url: GitHub profile URL (string | null)
- notice_period_days: notice period in days as integer (number | null) — e.g. "30 days" → 30, "2 months" → 60, "immediate" → 0
- current_ctc_annual: current CTC in INR per year as a number (number | null) — convert lakhs if needed (e.g. "12 LPA" → 1200000)
- expected_ctc_annual: expected CTC in INR per year as a number (number | null)
- summary: 1-2 sentence professional summary (string | null)
- certifications: array of certification names (string[])
- languages: array of spoken/written languages (string[])

Resume text:
---
${trimmed}
---

Return only the JSON object.`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model:       'gpt-4o-mini',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens:  1800,
      });

      const content = response.choices[0]?.message?.content?.trim() || '';
      const clean   = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(clean);
      return parsed;
    } catch (err) {
      if (attempt === retries) {
        console.error('[ResumeParser] OpenAI parse failed after retries:', err.message);
        return null;
      }
      // Brief wait before retry
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return null;
}

// ── Regex helpers ─────────────────────────────────────────────────────────────
function regexEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function regexPhone(text) {
  const m = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}|(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return m ? m[0].trim() : null;
}

function regexName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    const words = line.split(/\s+/);
    if (
      words.length >= 2 && words.length <= 4 &&
      words.every(w => /^[A-Za-z.'-]{1,30}$/.test(w)) &&
      !line.toLowerCase().match(/resume|curriculum|profile|summary|objective|address|email|phone|mobile/)
    ) return line;
  }
  return null;
}

function regexExperience(text) {
  const patterns = [
    /(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+)?(?:work\s+)?experience/i,
    /(\d+)\s*\+?\s*yrs?\s+(?:of\s+)?experience/i,
    /experience\s*(?:of\s*)?(\d+)\s*\+?\s*years?/i,
    /total\s+(?:experience|exp)\s*:?\s*(\d+)/i,
    /(\d+)\s*years?\s+of\s+(?:professional\s+)?experience/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return Number(m[1]);
  }
  const fallback = [...text.matchAll(/(\d+)\s*\+?\s*(?:years?|yrs?)/gi)];
  if (fallback.length) {
    const nums = fallback.map(m => Number(m[1])).filter(n => n > 0 && n < 40);
    if (nums.length) return Math.max(...nums);
  }
  return 0;
}

function regexLinkedIn(text) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?/i);
  return m ? m[0].trim() : null;
}

function regexGitHub(text) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-_%]+\/?/i);
  return m ? m[0].trim() : null;
}

function regexNoticePeriod(text) {
  // "30 days", "1 month", "2 months", "immediate joiner", "currently serving notice"
  const immediate = /immediate(?:ly)?\s+(?:joiner|available|join)/i.test(text);
  if (immediate) return 0;
  const months = text.match(/(\d+)\s*months?\s+notice/i);
  if (months) return Number(months[1]) * 30;
  const days = text.match(/(\d+)\s*days?\s+notice/i);
  if (days) return Number(days[1]);
  return null;
}

// Extract a "Skills" section block from the resume text and split into items
function extractSkillsSection(text) {
  const headingPattern = /(?:^|\n)\s*(?:TECHNICAL\s+)?(?:KEY\s+)?(?:CORE\s+)?(?:PROFESSIONAL\s+)?SKILLS?\s*(?:&\s*(?:COMPETENCIES|EXPERTISE))?\s*[:\-]?\s*\n([\s\S]{10,600}?)(?=\n\s*(?:[A-Z][A-Z\s]{3,}|EDUCATION|EXPERIENCE|PROJECTS?|CERTIF|ACHIEV|INTEREST|LANGUAGE|REFERENCE|$))/im;
  const m = text.match(headingPattern);
  if (!m) return [];

  const block = m[1];
  const raw = block
    .replace(/[•·▪▸►✓✔\-–—]/g, ',')
    .replace(/\|/g, ',')
    .replace(/\n/g, ',')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length >= 2 && s.length <= 50 && /[a-zA-Z]/.test(s));

  const stopWords = new Set(['and','or','the','with','in','of','for','to','a','an','on','at','by','is','are','was','i','we','my','our','you','your']);
  return raw.filter(s => {
    const lower = s.toLowerCase();
    return !stopWords.has(lower) && !/^\d+$/.test(s);
  });
}

// ── Build "fields found" summary for logs ─────────────────────────────────────
function buildFieldsSummary(parsed) {
  return {
    name:             !!parsed.name,
    email:            !!parsed.email,
    phone:            !!parsed.phone,
    skills:           (parsed.skills || []).length,
    experience:       parsed.experience > 0,
    education:        (parsed.education || []).length,
    work_experience:  (parsed.work_experience || []).length,
    companies:        (parsed.companies || []).length,
    location:         !!parsed.location,
    current_role:     !!parsed.current_role,
    linkedin_url:     !!parsed.linkedin_url,
    github_url:       !!parsed.github_url,
    notice_period:    parsed.notice_period_days != null,
    current_ctc:      !!parsed.current_ctc_annual,
    expected_ctc:     !!parsed.expected_ctc_annual,
    certifications:   (parsed.certifications || []).length,
    languages:        (parsed.languages || []).length,
  };
}

// ── Main parse function ───────────────────────────────────────────────────────
/**
 * parseResume(buffer, mimetype, originalname)
 * Returns enriched parsed object + rawText + parsedBy + resumeHash
 */
async function parseResume(buffer, mimetype, originalname) {
  const resumeHash = hashBuffer(buffer);
  const rawText    = await extractText(buffer, mimetype, originalname);
  const cleanedText = cleanText(rawText);

  // Try OpenAI first
  try {
    const ai = await parseWithOpenAI(cleanedText);
    if (ai) {
      return {
        rawText,
        resumeHash,
        name:                 ai.name                 || null,
        email:                ai.email                || null,
        phone:                ai.phone                || null,
        skills:               Array.isArray(ai.skills)          ? ai.skills          : [],
        experience:           Number(ai.experience)             || 0,
        education:            Array.isArray(ai.education)       ? ai.education       : [],
        work_experience:      Array.isArray(ai.work_experience) ? ai.work_experience : [],
        companies:            Array.isArray(ai.companies)       ? ai.companies       : [],
        location:             ai.location             || null,
        summary:              ai.summary              || null,
        current_role:         ai.current_role         || null,
        current_company:      ai.current_company      || null,
        linkedin_url:         ai.linkedin_url         || null,
        github_url:           ai.github_url           || null,
        notice_period_days:   ai.notice_period_days   != null ? Number(ai.notice_period_days)   : null,
        current_ctc_annual:   ai.current_ctc_annual   != null ? Number(ai.current_ctc_annual)   : null,
        expected_ctc_annual:  ai.expected_ctc_annual  != null ? Number(ai.expected_ctc_annual)  : null,
        certifications:       Array.isArray(ai.certifications)  ? ai.certifications  : [],
        languages:            Array.isArray(ai.languages)       ? ai.languages       : [],
        parsedBy:             'openai',
      };
    }
  } catch (err) {
    console.error('[ResumeParser] OpenAI failed, falling back to regex:', err.message);
  }

  // Enhanced regex fallback
  return {
    rawText,
    resumeHash,
    name:                regexName(cleanedText),
    email:               regexEmail(cleanedText),
    phone:               regexPhone(cleanedText),
    skills:              extractSkillsSection(cleanedText),
    experience:          regexExperience(cleanedText),
    education:           [],
    work_experience:     [],
    companies:           [],
    location:            null,
    summary:             null,
    current_role:        null,
    current_company:     null,
    linkedin_url:        regexLinkedIn(cleanedText),
    github_url:          regexGitHub(cleanedText),
    notice_period_days:  regexNoticePeriod(cleanedText),
    current_ctc_annual:  null,
    expected_ctc_annual: null,
    certifications:      [],
    languages:           [],
    parsedBy:            'regex',
  };
}

// ── Check for duplicate candidates ────────────────────────────────────────────
/**
 * checkDuplicate(email, resumeHash)
 * Returns array of existing candidates matching email or resume hash.
 */
async function checkDuplicate(email, resumeHash) {
  try {
    const rows = await callProcedure(
      'sp_rec_check_duplicate_candidate(?, ?)',
      [email || null, resumeHash || null]
    );
    return rows[0] || [];
  } catch (err) {
    console.error('[ResumeParser] Duplicate check failed:', err.message);
    return [];
  }
}

// ── Persist parsed data to DB ─────────────────────────────────────────────────

async function saveSkills(candidateId, skills) {
  if (!Array.isArray(skills) || skills.length === 0) return 0;
  const json = JSON.stringify(skills.slice(0, 150)); // cap at 150 skills
  try {
    const rows = await callProcedure('sp_rec_save_candidate_skills(?, ?)', [candidateId, json]);
    return (rows[0]?.[0]?.skills_saved) || 0;
  } catch (err) {
    console.error('[ResumeParser] saveSkills failed:', err.message);
    return 0;
  }
}

async function saveEducation(candidateId, education) {
  if (!Array.isArray(education) || education.length === 0) return 0;
  const json = JSON.stringify(education.slice(0, 20));
  try {
    const rows = await callProcedure('sp_rec_save_candidate_education(?, ?)', [candidateId, json]);
    return (rows[0]?.[0]?.education_saved) || 0;
  } catch (err) {
    console.error('[ResumeParser] saveEducation failed:', err.message);
    return 0;
  }
}

async function saveExperience(candidateId, workExperience) {
  if (!Array.isArray(workExperience) || workExperience.length === 0) return 0;
  const json = JSON.stringify(workExperience.slice(0, 30));
  try {
    const rows = await callProcedure('sp_rec_save_candidate_experience(?, ?)', [candidateId, json]);
    return (rows[0]?.[0]?.experience_saved) || 0;
  } catch (err) {
    console.error('[ResumeParser] saveExperience failed:', err.message);
    return 0;
  }
}

async function updateCandidateParseFields(candidateId, parsed) {
  try {
    await callProcedure(
      'sp_rec_update_candidate_parse_status(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        candidateId,
        'done',
        parsed.resumeHash        || null,
        parsed.linkedin_url      || null,
        parsed.github_url        || null,
        parsed.notice_period_days != null ? parsed.notice_period_days : null,
        parsed.companies?.length  ? JSON.stringify(parsed.companies) : null,
        parsed.current_role       || null,
      ]
    );
  } catch (err) {
    console.error('[ResumeParser] updateCandidateParseFields failed:', err.message);
  }
}

async function logParse({ candidateId, filename, fileSizeBytes, mimeType, parsed, durationMs, status, errorMessage }) {
  try {
    const fieldsSummary = parsed ? buildFieldsSummary(parsed) : null;
    await callProcedure(
      'sp_rec_log_parser(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @log_id)',
      [
        candidateId || null,
        filename,
        fileSizeBytes,
        mimeType,
        parsed?.parsedBy || 'none',
        status,
        errorMessage || null,
        parsed?.rawText?.length || 0,
        fieldsSummary ? JSON.stringify(fieldsSummary) : null,
        durationMs,
      ]
    );
  } catch (err) {
    // Logging must never crash the main flow
    console.error('[ResumeParser] logParse failed:', err.message);
  }
}

/**
 * persistParsedResume(candidateId, parsed, fileInfo)
 * Saves skills, education, experience, and updates candidate parse fields.
 * Called from background worker after candidate is created.
 */
async function persistParsedResume(candidateId, parsed, fileInfo = {}) {
  const t0 = Date.now();
  try {
    await Promise.all([
      saveSkills(candidateId, parsed.skills),
      saveEducation(candidateId, parsed.education),
      saveExperience(candidateId, parsed.work_experience),
    ]);
    await updateCandidateParseFields(candidateId, parsed);

    await logParse({
      candidateId,
      filename:      fileInfo.originalname || 'resume',
      fileSizeBytes: fileInfo.size         || 0,
      mimeType:      fileInfo.mimetype     || '',
      parsed,
      durationMs:    Date.now() - t0,
      status:        'success',
    });
  } catch (err) {
    console.error('[ResumeParser] persistParsedResume error:', err.message);
    await logParse({
      candidateId,
      filename:      fileInfo.originalname || 'resume',
      fileSizeBytes: fileInfo.size         || 0,
      mimeType:      fileInfo.mimetype     || '',
      parsed,
      durationMs:    Date.now() - t0,
      status:        'failed',
      errorMessage:  err.message,
    });
  }
}

module.exports = {
  parseResume,
  checkDuplicate,
  persistParsedResume,
  saveSkills,
  saveEducation,
  saveExperience,
  logParse,
  hashBuffer,
};
