'use strict';
/**
 * Role-specific interview questions, used when no LLM is configured (or it fails).
 * The job title + required skills select one or more tracks; each candidate gets a
 * different, seeded mix so interviews for different roles — and different candidates
 * for the same role — are not identical.
 */
const TRACKS = {
  java: {
    match: /\bjava\b|spring|hibernate|jpa|j2ee|microservice/i,
    questions: [
      'Explain how Spring Boot auto-configuration works and how you would override a default bean.',
      'How do you handle transactions in a Spring application? When would you use REQUIRES_NEW instead of REQUIRED?',
      'What is the difference between HashMap and ConcurrentHashMap, and when have you needed the concurrent one?',
      'How do you find and fix an N+1 query problem with JPA or Hibernate?',
      'Walk me through how you would design exception handling for a set of REST APIs in Spring Boot.',
      'How does garbage collection affect a Java service under load, and how have you diagnosed a memory leak?',
      'How do services in your microservices setup talk to each other, and how do you handle a downstream service being slow or down?',
      'Explain checked versus unchecked exceptions and how you decide which to throw.',
      'How do you secure a Spring Boot API — authentication, authorisation and input validation?',
      'Describe how you would write unit and integration tests for a service layer that calls a database.',
    ],
  },
  frontend: {
    match: /react|angular|vue|frontend|front-end|javascript|typescript|\bui\b|html|css|next\.?js/i,
    questions: [
      'How do you decide what goes in component state versus global state in a React application?',
      'A page re-renders too often and feels slow. How do you find the cause and fix it?',
      'Explain useEffect dependencies and a bug you have seen from getting them wrong.',
      'How do you make a web form accessible for keyboard and screen-reader users?',
      'How do you handle API errors, loading states and retries in the UI?',
      'Explain the difference between == and ===, and between let, const and var.',
      'How do you make a layout work on both mobile and desktop screens?',
      'How do you structure a large frontend codebase so a team can work on it without conflicts?',
      'What steps do you take to reduce the bundle size and initial load time of a web app?',
      'How do you test React components — what do you test and with which tools?',
    ],
  },
  node: {
    match: /node|express|nest\.?js|backend javascript/i,
    questions: [
      'Explain the Node.js event loop and what happens when you run CPU-heavy work on it.',
      'How do you structure an Express application — routes, controllers, services, middleware?',
      'How do you handle errors in async/await code so the process does not crash?',
      'How would you add rate limiting and input validation to a public API?',
      'How do you manage database connections and transactions in a Node service?',
      'How do you store secrets and configuration for different environments?',
      'A Node API becomes slow under load. How do you investigate?',
      'How do you implement authentication with JWT, including refresh tokens and logout?',
    ],
  },
  python: {
    match: /python|django|flask|fastapi|pandas/i,
    questions: [
      'Explain the difference between a list, a tuple and a set, and when you use each.',
      'How do you structure a Django or FastAPI project for a medium-sized application?',
      'What are decorators in Python, and where have you written one?',
      'How do you handle a long-running task in a web request — for example sending emails or generating reports?',
      'How do you manage dependencies and virtual environments across a team?',
      'Explain how you would profile and speed up a slow Python script.',
      'How do you write tests in Python, and how do you mock external calls?',
      'Describe how the GIL affects multithreading and what you do instead for parallel work.',
    ],
  },
  dotnet: {
    match: /\.net|c#|asp\.net|dotnet|entity framework/i,
    questions: [
      'Explain dependency injection lifetimes in ASP.NET Core — singleton, scoped and transient.',
      'How do you use async/await correctly in C# and avoid deadlocks?',
      'How do you handle database migrations with Entity Framework in a team?',
      'How do you structure middleware and global error handling in an ASP.NET Core API?',
      'What is LINQ deferred execution, and how can it cause performance issues?',
      'How do you secure an ASP.NET Core API with authentication and role-based authorisation?',
      'How do you log and monitor a .NET service in production?',
      'Explain the difference between an interface and an abstract class with a real example.',
    ],
  },
  database: {
    match: /\bsql\b|mysql|postgres|oracle|database|\bdb\b|pl\/sql|mongodb|stored procedure/i,
    questions: [
      'How do you decide which columns to index, and how do you check that a query uses the index?',
      'Explain the difference between INNER JOIN, LEFT JOIN and a subquery with an example from your work.',
      'What are transaction isolation levels, and have you hit a problem related to them?',
      'How would you design tables for employees, departments and monthly attendance?',
      'A report query takes 30 seconds. Walk me through how you would speed it up.',
      'When would you use a stored procedure, and when would you keep the logic in application code?',
      'How do you take backups and restore a database safely?',
      'Explain normalisation and a case where you deliberately denormalised.',
    ],
  },
  testing: {
    match: /\bqa\b|test|testing|selenium|automation|quality|cypress|playwright|manual tester/i,
    questions: [
      'How do you write test cases for a login page? List the most important ones.',
      'Explain the difference between smoke, sanity and regression testing.',
      'How do you decide what to automate and what to keep as manual testing?',
      'A bug you reported cannot be reproduced by the developer. What do you do?',
      'How do you structure an automation framework so tests are easy to maintain?',
      'How do you test an API — what do you check besides the status code?',
      'How do you handle flaky automated tests?',
      'Describe how you write a good bug report. What must it contain?',
      'How do you prioritise testing when the release date is tomorrow and time is short?',
    ],
  },
  devops: {
    match: /devops|aws|azure|gcp|cloud|docker|kubernetes|k8s|ci\/cd|jenkins|terraform|linux|sre/i,
    questions: [
      'Walk me through a CI/CD pipeline you have built or maintained, step by step.',
      'How do you deploy a new version with zero downtime, and how do you roll back?',
      'Explain the difference between a Docker image and a container, and how you keep images small.',
      'How do you manage secrets in pipelines and in production?',
      'A production server is at 100% CPU. What do you check first?',
      'How do you set up monitoring and alerting so you hear about problems before users do?',
      'Explain infrastructure as code and how you have used it.',
      'How would you design backups and disaster recovery for a web application?',
    ],
  },
  data: {
    match: /data analyst|data science|analytics|power bi|tableau|machine learning|\bml\b|\bai\b|etl|data engineer/i,
    questions: [
      'How do you clean a dataset that has missing values, duplicates and outliers?',
      'Explain a dashboard or report you built — who used it and what decision did it support?',
      'How do you check that the numbers in your report are correct?',
      'Explain the difference between correlation and causation with an example.',
      'How would you design an ETL job that loads data every night, and how do you handle failures?',
      'How do you choose the right chart for a piece of data?',
      'Describe a model or analysis you built and how you measured whether it worked.',
    ],
  },
  mobile: {
    match: /android|ios|flutter|react native|kotlin|swift|mobile/i,
    questions: [
      'How do you handle a mobile app losing network in the middle of saving data?',
      'Explain the app lifecycle on Android or iOS and a bug you fixed related to it.',
      'How do you keep a list of thousands of items smooth while scrolling?',
      'How do you store tokens and sensitive data securely on a phone?',
      'How do you release an app update and handle users on old versions?',
      'How do you test a mobile app across different screen sizes and OS versions?',
    ],
  },
  hr: {
    match: /\bhr\b|human resource|recruit|talent|payroll executive|people operations|onboarding/i,
    questions: [
      'Walk me through how you handle a new requirement from a hiring manager, from intake to offer.',
      'How do you source candidates for a hard-to-fill technical role?',
      'How do you screen a resume quickly, and what makes you reject or shortlist it?',
      'A selected candidate declines the offer at the last moment. What do you do?',
      'How do you keep candidates engaged during a long interview process?',
      'How do you handle a conflict between an employee and their manager?',
      'What HR metrics do you track, and how have you used them?',
      'How do you make sure hiring is fair and unbiased?',
      'Explain the onboarding steps you would plan for a new joiner\'s first week.',
    ],
  },
  sales: {
    match: /sales|business development|\bbd\b|marketing|account manager|customer success|pre-sales/i,
    questions: [
      'Walk me through how you qualify a new lead.',
      'Tell me about a deal you lost. What did you learn from it?',
      'How do you handle a customer who says your price is too high?',
      'How do you plan your week to hit your monthly target?',
      'How do you keep in touch with existing customers to grow the account?',
      'Describe a campaign or outreach that worked well and how you measured it.',
    ],
  },
  finance: {
    match: /finance|account|tally|gst|audit|tax|bookkeep|ca\b/i,
    questions: [
      'Walk me through your month-end closing process.',
      'How do you reconcile a bank statement with the books, and how do you handle differences?',
      'Explain how GST input credit works with an example.',
      'How do you make sure payments and invoices are correct before they go out?',
      'Describe a financial report you prepare regularly and who uses it.',
      'How do you handle an audit query you cannot answer immediately?',
    ],
  },
  support: {
    match: /support|operations|helpdesk|service desk|admin executive|coordinator/i,
    questions: [
      'How do you prioritise when several urgent requests come in at the same time?',
      'Tell me about an angry customer or user you handled. What did you do?',
      'How do you document a recurring issue so others can solve it?',
      'How do you escalate a problem you cannot solve, and what information do you include?',
      'How do you track your work so nothing is forgotten?',
    ],
  },
};
const GENERAL = [
  'A production issue is reported just before a release and the root cause is unclear. Walk me through what you would do in the first hour.',
  'Tell me about a time you disagreed with a teammate or lead. How was it resolved?',
  'What is a skill you improved in the last year, and how did you learn it?',
  'Describe a mistake you made at work and what you changed afterwards.',
  'How do you plan your work when requirements are unclear and the deadline is tight?',
  'Why are you interested in this role, and what would you want to achieve in your first six months?',
  'Tell me about the piece of work you are most proud of and your exact contribution.',
];
// Small deterministic PRNG so a session's questions stay stable across restarts.
function seededRandom(seed) {
  let s = (Number(seed) >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function hashString(text) {
  let h = 2166136261;
  for (const ch of String(text || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Tracks for a job, most relevant first (matches in the title count double). */
function detectTracks(profile = {}) {
  const title = String(profile.jobTitle || '');
  const skills = (Array.isArray(profile.requiredSkills) ? profile.requiredSkills.join(', ') : String(profile.requiredSkills || ''))
    + ' ' + String(profile.preferredSkills || '');
  const desc = String(profile.jobDescription || '').slice(0, 1500);
  return Object.entries(TRACKS)
    .map(([key, t]) => ({ key, score: (t.match.test(title) ? 2 : 0) + (t.match.test(skills) ? 2 : 0) + (t.match.test(desc) ? 1 : 0) }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((t) => t.key);
}
/**
 * The ordered fallback plan for a session: intro, a project question, role questions
 * from the detected tracks (interleaved, shuffled per seed), then general questions.
 */
function buildQuestionPlan(profile = {}, seed) {
  const rand = seededRandom(seed ?? hashString(`${profile.jobTitle}|${profile.requiredSkills}`));
  const tracks = detectTracks(profile);
  const mainSkill = (Array.isArray(profile.requiredSkills) ? profile.requiredSkills : String(profile.requiredSkills || '').split(','))
    .map((s) => String(s).trim()).filter(Boolean)[0] || profile.jobTitle || 'your main technology';
  const plan = [
    { stage: 'introduction', type: 'experience', question: 'Could you briefly introduce yourself and explain your current role, responsibilities, and the project you work on?' },
    { stage: 'resume_validation', type: 'resume_probe', skill: mainSkill, question: `Walk me through the most recent project where you used ${mainSkill}. What was the architecture, and which part did you personally build?` },
  ];
  const pools = tracks.map((key) => shuffle(TRACKS[key].questions, rand).map((q) => ({ stage: 'technical', type: 'technical', skill: key, question: q })));
  const roleQuestions = [];
  while (pools.some((p) => p.length) && roleQuestions.length < 9) {
    for (const p of pools) if (p.length && roleQuestions.length < 9) roleQuestions.push(p.shift());
  }
  plan.push(...roleQuestions);
  const general = shuffle(GENERAL, rand).map((q) => ({ stage: /production issue|deadline/.test(q) ? 'scenario' : 'domain', type: 'experience', question: q }));
  plan.push(...general.slice(0, roleQuestions.length ? 3 : 6));
  return { tracks, plan };
}
module.exports = { detectTracks, buildQuestionPlan, hashString };
