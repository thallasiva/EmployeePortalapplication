'use strict';

/**
 * Resume Parser Service — powered by OpenAI GPT-4o mini
 *
 * Flow:
 *  1. Extract raw text from PDF or DOCX (pdf-parse / mammoth)
 *  2. Send text to GPT-4o mini with a structured extraction prompt
 *  3. Return parsed JSON: name, email, phone, skills[], experience (years),
 *     education[], summary
 *
 * Falls back to regex-only extraction if OPENAI_API_KEY is not set.
 */

const _pdfParse = require('pdf-parse');
const pdfParse  = _pdfParse.default || _pdfParse;
const mammoth   = require('mammoth');
const OpenAI    = require('openai');

// ── OpenAI client (lazy — only used when key is present) ─────────────────────
let _openai = null;
function getOpenAI() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your-openai-api-key-here') return null;
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

// ── Extract raw text from buffer ─────────────────────────────────────────────
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
  if (!client) return null; // fall back to regex

  // Trim to 6000 chars to stay well within token limits for mini
  const trimmed = text.slice(0, 6000);

  const prompt = `You are a resume parser. Extract the following fields from the resume text and return ONLY valid JSON with no markdown or explanation.

Fields to extract:
- name: full name of the candidate (string or null)
- email: email address (string or null)
- phone: phone number (string or null)
- skills: array of technical and professional skills mentioned (array of strings)
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
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content?.trim() || '';

  // Strip markdown code fences if present
  const clean = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('[ResumeParser] GPT response was not valid JSON:', clean.slice(0, 200));
    return null;
  }
}

// ── Regex fallbacks (used when OpenAI is unavailable) ────────────────────────
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
      !line.toLowerCase().match(/resume|curriculum|profile|summary/)
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

const SKILL_VOCAB = [
  "React","Redux","Next.js","Vue","Angular","JavaScript","TypeScript","HTML","CSS",
  "Tailwind","Bootstrap","Node.js","Express","NestJS","Django","Flask","FastAPI",
  "Spring Boot","Java","Python","PHP","Ruby","Go","Rust","C#",".NET","Laravel",
  "MySQL","PostgreSQL","MongoDB","Redis","SQLite","Oracle","DynamoDB","Firebase",
  "AWS","Azure","GCP","Docker","Kubernetes","CI/CD","Jenkins","GitHub Actions","Terraform",
  "REST","GraphQL","Microservices","JWT","Git","GitHub","Jira","Postman",
  "Jest","Cypress","Selenium","React Native","Flutter","Android","iOS","Swift","Kotlin",
  "Machine Learning","TensorFlow","PyTorch","Pandas","NumPy","Data Science",
  "Power BI","Tableau","Kafka","Agile","Scrum",
];
const VOCAB_LOWER = SKILL_VOCAB.map(s => s.toLowerCase());

function regexSkills(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (let i = 0; i < SKILL_VOCAB.length; i++) {
    const term = VOCAB_LOWER[i];
    const regex = new RegExp(`(?<![a-z0-9])${term.replace(/[.+]/g, '\\$&')}(?![a-z0-9])`, 'i');
    if (regex.test(lower)) found.add(SKILL_VOCAB[i]);
  }
  return [...found];
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

  // Regex fallback
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
