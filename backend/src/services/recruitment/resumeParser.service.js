'use strict';

/**
 * Resume Parser Service — powered by OpenAI GPT-4o mini (with regex fallback)
 *
 * Flow:
 *  1. Extract raw text from PDF or DOCX (pdf-parse / mammoth)
 *  2. Try GPT-4o mini extraction if OPENAI_API_KEY is set
 *  3. If no AI key, fall back to:
 *     a. Section-based extraction (finds "Skills" heading blocks)
 *     b. Keyword vocab scan across full text
 * Returns: { name, email, phone, skills[], experience, education[], summary, parsedBy }
 */

const _pdfParse = require('pdf-parse');
const pdfParse  = _pdfParse.default || _pdfParse;
const mammoth   = require('mammoth');
const OpenAI    = require('openai');

// ── OpenAI client (lazy) ─────────────────────────────────────────────────────
let _openai = null;
function getOpenAI() {
  if (_openai) return _openai;

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

// ── GPT-4o mini extraction ────────────────────────────────────────────────────
async function parseWithOpenAI(text) {
  const client = getOpenAI();
  if (!client) return null;

  const trimmed = text.slice(0, 6000);

  const prompt = `You are a resume parser. Extract the following fields from the resume text and return ONLY valid JSON with no markdown or explanation.

Fields to extract:
- name: full name of the candidate (string or null)
- email: email address (string or null)
- phone: phone number (string or null)
- skills: array of ALL technical and professional skills mentioned (array of strings, be thorough)
- experience: total years of work experience as a number (number or 0 if not found)
- education: array of objects with { degree, institution, year } (array, empty if none)
- summary: 1-2 sentence professional summary (string or null)
- current_role: most recent job title (string or null)
- current_company: most recent employer (string or null)

Resume text:
---
${trimmed}
---

Return only the JSON object.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content?.trim() || '';
  const clean = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('[ResumeParser] GPT response was not valid JSON:', clean.slice(0, 200));
    return null;
  }
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

// Extract a "Skills" section block from the resume text and split into items
function extractSkillsSection(text) {
  // Look for headings like: SKILLS, TECHNICAL SKILLS, KEY SKILLS, CORE COMPETENCIES etc.
  const headingPattern = /(?:^|\n)\s*(?:TECHNICAL\s+)?(?:KEY\s+)?(?:CORE\s+)?(?:PROFESSIONAL\s+)?SKILLS?\s*(?:&\s*(?:COMPETENCIES|EXPERTISE))?\s*[:\-]?\s*\n([\s\S]{10,600}?)(?=\n\s*(?:[A-Z][A-Z\s]{3,}|EDUCATION|EXPERIENCE|PROJECTS?|CERTIF|ACHIEV|INTEREST|LANGUAGE|REFERENCE|$))/im;
  const m = text.match(headingPattern);
  if (!m) return [];

  const block = m[1];
  // Split on common separators: commas, bullets, pipes, newlines, semicolons
  const raw = block
    .replace(/[•·▪▸►✓✔\-–—]/g, ',')
    .replace(/\|/g, ',')
    .replace(/\n/g, ',')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length >= 2 && s.length <= 50 && /[a-zA-Z]/.test(s));

  // Filter out obvious non-skills (single common words, numbers only)
  const stopWords = new Set(['and','or','the','with','in','of','for','to','a','an','on','at','by','is','are','was','i','we','my','our','you','your']);
  return raw.filter(s => {
    const lower = s.toLowerCase();
    return !stopWords.has(lower) && !/^\d+$/.test(s);
  });
}

function regexSkills(text) {
  return extractSkillsSection(text);
}

// ── Main parse function ───────────────────────────────────────────────────────
async function parseResume(buffer, mimetype, originalname) {
  const rawText = await extractText(buffer, mimetype, originalname);

  // Try OpenAI first
  try {
    const ai = await parseWithOpenAI(rawText);
    if (ai) {
      return {
        rawText,
        name:            ai.name            || null,
        email:           ai.email           || null,
        phone:           ai.phone           || null,
        skills:          Array.isArray(ai.skills) ? ai.skills : [],
        experience:      Number(ai.experience) || 0,
        education:       Array.isArray(ai.education) ? ai.education : [],
        summary:         ai.summary         || null,
        current_role:    ai.current_role    || null,
        current_company: ai.current_company || null,
        parsedBy:        'openai',
      };
    }
  } catch (err) {
    console.error('[ResumeParser] OpenAI failed, falling back to regex:', err.message);
  }

  // Enhanced regex fallback
  return {
    rawText,
    name:            regexName(rawText),
    email:           regexEmail(rawText),
    phone:           regexPhone(rawText),
    skills:          regexSkills(rawText),
    experience:      regexExperience(rawText),
    education:       [],
    summary:         null,
    current_role:    null,
    current_company: null,
    parsedBy:        'regex',
  };
}

module.exports = { parseResume };
