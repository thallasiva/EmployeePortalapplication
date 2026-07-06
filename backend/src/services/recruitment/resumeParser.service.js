'use strict';

/**
 * Resume Parser Service
 * Extracts text from PDF or DOCX, then pulls out:
 *  - skills (matched against a known tech skill vocabulary)
 *  - years of experience (highest number near "year/years/yrs" in the text)
 *  - candidate name (first non-empty line that looks like a name)
 *  - email
 *  - phone
 */

const _pdfParse = require('pdf-parse');
const pdfParse = _pdfParse.default || _pdfParse;  // handle ESM/CJS interop
const mammoth = require('mammoth');

// ── Tech skill vocabulary ────────────────────────────────────────────────────
// The parser scans extracted text for any of these (case-insensitive).
const SKILL_VOCAB = [
  // Frontend
  "React", "ReactJS", "React.js", "Redux", "Next.js", "Vue", "Vue.js", "VueJS", "Angular", "AngularJS",
  "JavaScript", "JS", "TypeScript", "TS", "HTML", "CSS", "HTML5", "CSS3", "SASS", "SCSS", "Less",
  "Tailwind", "Bootstrap", "Material UI", "Ant Design", "Webpack", "Vite", "Babel", "jQuery",
  // Backend
  "Node.js", "Node", "NodeJS", "Express", "Express.js", "NestJS", "Django", "Flask", "FastAPI",
  "Spring Boot", "Spring", "Java", "Python", "PHP", "Ruby", "Go", "Golang", "Rust", "C#", ".NET",
  "ASP.NET", "Laravel", "Symfony", "CodeIgniter", "Ruby on Rails", "Rails",
  // Databases
  "MySQL", "PostgreSQL", "Postgres", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "MSSQL",
  "DynamoDB", "Cassandra", "Firebase", "Supabase", "ElasticSearch", "Neo4j",
  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "K8s", "CI/CD", "Jenkins",
  "GitHub Actions", "GitLab CI", "Terraform", "Ansible", "Linux", "Nginx", "Apache",
  // APIs & Architecture
  "REST", "REST API", "RESTful", "GraphQL", "gRPC", "Microservices", "WebSocket", "OAuth", "JWT",
  // Tools
  "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Postman", "Swagger",
  "VS Code", "IntelliJ", "Eclipse", "Maven", "Gradle", "npm", "yarn", "pnpm",
  // Testing
  "Jest", "Mocha", "Chai", "Cypress", "Selenium", "TestNG", "JUnit", "PyTest", "Playwright",
  // Mobile
  "React Native", "Flutter", "Android", "iOS", "Swift", "Kotlin", "Xamarin",
  // Data / AI
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn",
  "Data Science", "Power BI", "Tableau", "Spark", "Hadoop", "Kafka",
  // Other
  "Agile", "Scrum", "Kanban", "SDLC", "OOP", "SOLID", "Design Patterns",
];

// Normalise to lower-case for matching
const VOCAB_LOWER = SKILL_VOCAB.map(s => s.toLowerCase());

function extractSkills(text)
{
  const lower = text.toLowerCase();
  const found = new Set();

  for (let i = 0; i < SKILL_VOCAB.length; i++)
  {
    const skill = SKILL_VOCAB[i];
    const term = VOCAB_LOWER[i];

    // Word-boundary style match (not substring of another word)
    const regex = new RegExp(`(?<![a-z0-9])${term.replace(/[.+]/g, '\\$&')}(?![a-z0-9])`, 'i');
    if (regex.test(lower))
    {
      found.add(skill);   // Add canonical form
    }
  }

  return [...found];
}

function extractExperience(text)
{
  // Look for patterns like "5 years", "3+ years", "3-5 years", "2 yrs experience"
  const patterns = [
    /(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+)?(?:work\s+)?experience/i,
    /(\d+)\s*\+?\s*yrs?\s+(?:of\s+)?experience/i,
    /experience\s*(?:of\s*)?(\d+)\s*\+?\s*years?/i,
    /(\d+)\s*[-–]\s*\d+\s*years?\s+(?:of\s+)?experience/i,
    /total\s+(?:experience|exp)\s*:?\s*(\d+)/i,
  ];

  for (const pat of patterns)
  {
    const m = text.match(pat);
    if (m) return Number(m[1]);
  }

  // Fallback: find all standalone numbers near "year"
  const fallback = [...text.matchAll(/(\d+)\s*\+?\s*(?:years?|yrs?)/gi)];
  if (fallback.length)
  {
    const nums = fallback.map(m => Number(m[1])).filter(n => n > 0 && n < 40);
    if (nums.length) return Math.max(...nums);
  }

  return 0;
}

function extractEmail(text)
{
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function extractPhone(text)
{
  const m = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}|(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return m ? m[0].trim() : null;
}

function extractName(text)
{
  // First non-empty line that is 2-4 words, all alpha (typical name line)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10))
  {
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 &&
      words.every(w => /^[A-Za-z.'-]{1,30}$/.test(w)) &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('profile'))
    {
      return line;
    }
  }
  return null;
}

// ── Extract text from file buffer ────────────────────────────────────────────
async function extractText(buffer, mimetype, originalname)
{
  const ext = (originalname || '').split('.').pop().toLowerCase();

  if (mimetype === 'application/pdf' || ext === 'pdf')
  {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    ext === 'docx' || ext === 'doc'
  )
  {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

// ── Main parse function ───────────────────────────────────────────────────────
async function parseResume(buffer, mimetype, originalname)
{
  const text = await extractText(buffer, mimetype, originalname);

  return {
    rawText: text,
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    skills: extractSkills(text),
    experience: extractExperience(text),
  };
}

module.exports = { parseResume };
