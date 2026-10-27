#!/usr/bin/env node
/**
 * HRMS — Automated API Smoke Test
 * ---------------------------------
 * Logs in, then calls every module's READ (GET) endpoints and reports which
 * work vs. which are broken. READ-ONLY: it never creates, updates, or deletes.
 *
 * Requirements: Node 18+ (uses built-in fetch). No npm install needed.
 *
 * USAGE (from the backend folder, with the server running):
 *   node hrms-smoke-test.js you@email.com yourPassword
 * or set env vars:
 *   set API_BASE=http://localhost:5000
 *   set APP_EMAIL=you@email.com
 *   set APP_PASSWORD=yourPassword
 *   node hrms-smoke-test.js
 *
 * Output: prints a report to the console AND writes hrms-test-report.html
 * (open it in a browser) plus hrms-test-report.json.
 */

const fs = require('fs');

const BASE = process.env.API_BASE || 'http://localhost:5000';
const EMAIL = process.argv[2] || process.env.APP_EMAIL;
const PASSWORD = process.argv[3] || process.env.APP_PASSWORD;

// Every test case = one read-only endpoint, grouped by module.
const ENDPOINTS = [
  ['Core',        'Employees',              '/api/employees?limit=5'],
  ['Core',        'Departments',            '/api/departments'],
  ['Core',        'Designations',           '/api/designations'],
  ['Core',        'Offices',                '/api/offices'],
  ['Core',        'Leadership Roles',       '/api/leadership-roles'],
  ['Core',        'Roles',                  '/api/roles'],
  ['Core',        'Permissions',            '/api/permissions'],
  ['Core',        'Teams',                  '/api/teams'],
  ['Core',        'Companies',              '/api/companies'],
  ['Core',        'Org Hierarchy',          '/api/org-hierarchy'],
  ['Attendance',  'Attendance',             '/api/attendance?limit=5'],
  ['Attendance',  'Work Schedules',         '/api/work-schedules'],
  ['Leave',       'Leave Types',            '/api/leave-types'],
  ['Leave',       'Holidays',               '/api/holidays'],
  ['Leave',       'Leave Requests',         '/api/leave-requests?limit=5'],
  ['Payroll',     'Payslips',               '/api/payroll/payslips?limit=5'],
  ['Payroll',     'Salary Structures',      '/api/payroll/salary-structures'],
  ['Payroll',     'Payroll Runs',           '/api/payroll/runs'],
  ['Payroll',     'Payroll Inputs',         '/api/payroll/inputs'],
  ['Payroll',     'Salary Templates',       '/api/salary-templates'],
  ['Payroll',     'Salary Components',      '/api/salary-components'],
  ['Payroll',     'Salary Assignments',     '/api/salary-assignments'],
  ['Performance', 'Reviews',                '/api/reviews'],
  ['Performance', 'Appraisal',              '/api/appraisal'],
  ['Performance', 'Timesheets',             '/api/timesheets'],
  ['HR',          'IT Declaration',         '/api/it-declaration'],
  ['HR',          'Resignations',           '/api/resignations'],
  ['HR',          'Documents',              '/api/documents'],
  ['HR',          'Helpdesk',               '/api/helpdesk'],
  ['HR',          'Request Hub',            '/api/request-hub'],
  ['HR',          'Workflow Delegates',     '/api/workflow-delegates'],
  ['HR',          'Calendar Events',        '/api/calendar-events'],
  ['HR',          'Referrals',              '/api/referrals'],
  ['Recruitment', 'Recruitment Dashboard',  '/api/recruitment/dashboard'],
  ['Recruitment', 'Jobs',                   '/api/recruitment/jobs'],
  ['Recruitment', 'Candidates',             '/api/recruitment/candidates'],
  ['Recruitment', 'Interviews',             '/api/recruitment/interviews'],
  ['Recruitment', 'Offers',                 '/api/recruitment/offers'],
  ['Onboarding',  'Joining',                '/api/joining'],
  ['Reports',     'Reports',                '/api/reports'],
  ['Dashboard',   'Dashboard',              '/api/dashboard'],
  ['Settings',    'Menu Permissions',       '/api/settings/menu-permissions'],
  ['Settings',    'SMTP',                   '/api/settings/smtp'],
  ['Settings',    'Email Templates',        '/api/settings/email-templates'],
  ['Settings',    'Notifications',          '/api/settings/notifications'],
  ['Settings',    'Audit Logs',             '/api/audit-logs'],
  ['Settings',    'System Health',          '/api/system-health'],
];

function classify(status) {
  if (status >= 200 && status < 300) return 'PASS';
  if (status === 401) return 'AUTH';        // not logged in / token issue
  if (status === 403) return 'FORBIDDEN';   // logged in but no permission (still "working")
  if (status === 404) return 'NOT FOUND';
  if (status === 400 || status === 422) return 'BAD REQUEST';
  if (status === 0) return 'NO RESPONSE';   // network / server down
  if (status >= 500) return 'BROKEN (500)';
  return 'OTHER ' + status;
}

async function login() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Login failed (${r.status}): ${body.message || 'check email/password'}`);
  const token =
    body?.data?.accessToken || body?.accessToken || body?.data?.token ||
    body?.data?.data?.accessToken || body?.token;
  if (!token) {
    if (JSON.stringify(body).toLowerCase().includes('mfa'))
      throw new Error('Login requires MFA — this script cannot complete MFA. Use an account without 2FA for testing.');
    throw new Error('Logged in but no access token found in the response.');
  }
  return token;
}

async function hit(token, path) {
  const t = Date.now();
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(BASE + path, {
      headers: { Authorization: 'Bearer ' + token },
      signal: ctl.signal,
    });
    clearTimeout(to);
    let msg = '';
    try { const j = await r.json(); msg = j.message || ''; } catch {}
    return { status: r.status, ms: Date.now() - t, msg: String(msg).slice(0, 120) };
  } catch (e) {
    return { status: 0, ms: Date.now() - t, msg: String(e.message || e).slice(0, 120) };
  }
}

(async () => {
  console.log(`\n  HRMS Smoke Test  →  ${BASE}\n  ${'='.repeat(60)}`);
  if (!EMAIL || !PASSWORD) {
    console.error('  ✗ Missing credentials.\n    Run: node hrms-smoke-test.js you@email.com yourPassword');
    process.exit(1);
  }
  let token;
  try { token = await login(); console.log('  ✓ Logged in as', EMAIL, '\n'); }
  catch (e) { console.error('  ✗', e.message); process.exit(1); }

  const results = [];
  for (const [mod, name, path] of ENDPOINTS) {
    const r = await hit(token, path);
    const verdict = classify(r.status);
    results.push({ mod, name, path, ...r, verdict });
    const mark = verdict === 'PASS' ? '✓' : verdict.startsWith('BROKEN') || verdict === 'NO RESPONSE' ? '✗' : '•';
    console.log(`  ${mark} [${String(r.status).padStart(3)}] ${name.padEnd(22)} ${verdict}${r.msg ? '  — ' + r.msg : ''}`);
  }

  const by = (v) => results.filter(r => r.verdict === v).length;
  const broken = results.filter(r => r.verdict.startsWith('BROKEN') || r.verdict === 'NO RESPONSE');
  console.log(`\n  ${'='.repeat(60)}`);
  console.log(`  SUMMARY: ${results.length} endpoints tested`);
  console.log(`    PASS ............ ${by('PASS')}`);
  console.log(`    Forbidden(403) .. ${by('FORBIDDEN')}   (working, just role-gated)`);
  console.log(`    Auth(401) ....... ${by('AUTH')}`);
  console.log(`    Bad/NotFound .... ${by('BAD REQUEST') + by('NOT FOUND')}`);
  console.log(`    BROKEN .......... ${broken.length}`);
  if (broken.length) {
    console.log(`\n  ⚠ BROKEN — need attention:`);
    for (const b of broken) console.log(`    ✗ ${b.name}  (${b.status})  ${b.path}  ${b.msg}`);
  }

  // Write JSON + HTML report
  fs.writeFileSync('hrms-test-report.json', JSON.stringify(results, null, 2));
  const rows = results.map(r => {
    const color = r.verdict === 'PASS' ? '#16a34a'
      : (r.verdict.startsWith('BROKEN') || r.verdict === 'NO RESPONSE') ? '#dc2626'
      : r.verdict === 'FORBIDDEN' ? '#0891b2' : '#d97706';
    return `<tr><td>${r.mod}</td><td>${r.name}</td><td><code>${r.path}</code></td>
      <td style="text-align:center">${r.status}</td>
      <td style="color:${color};font-weight:700">${r.verdict}</td>
      <td>${r.ms} ms</td><td>${r.msg || ''}</td></tr>`;
  }).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>HRMS Test Report</title>
<style>body{font:14px system-ui;margin:24px;color:#111}h1{font-size:20px}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #eee;padding:7px 10px;text-align:left}
th{background:#fafafa;font-size:11px;text-transform:uppercase;color:#667}code{font-size:12px;color:#334}
.sum{display:flex;gap:14px;margin:14px 0;flex-wrap:wrap}.chip{padding:8px 14px;border-radius:10px;font-weight:700}</style>
<h1>HRMS API Smoke Test — ${new Date().toLocaleString()}</h1>
<p>Base: <code>${BASE}</code> · Logged in as ${EMAIL} · ${results.length} endpoints (read-only)</p>
<div class="sum">
<span class="chip" style="background:#f0fdf4;color:#16a34a">PASS ${by('PASS')}</span>
<span class="chip" style="background:#ecfeff;color:#0891b2">Forbidden ${by('FORBIDDEN')}</span>
<span class="chip" style="background:#fffbeb;color:#d97706">Bad/404 ${by('BAD REQUEST')+by('NOT FOUND')}</span>
<span class="chip" style="background:#fef2f2;color:#dc2626">BROKEN ${broken.length}</span>
</div>
<table><thead><tr><th>Module</th><th>Feature</th><th>Endpoint</th><th>Status</th><th>Verdict</th><th>Time</th><th>Message</th></tr></thead>
<tbody>${rows}</tbody></table>`;
  fs.writeFileSync('hrms-test-report.html', html);
  console.log(`\n  Report written: hrms-test-report.html  (open in a browser) and hrms-test-report.json\n`);
  process.exit(broken.length ? 2 : 0);
})();
