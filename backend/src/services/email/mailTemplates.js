'use strict';







const fs = require('fs');
const path = require('path');
const { email: emailCfg } = require('../../config/env');


const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT = (d) => {
  if (!d) return '—';
  try {return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });}
  catch {return String(d);}
};
const fmtINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
const co = (override) => esc(override || emailCfg.companyName || 'NAT IT Services Pvt Ltd');
const feUrl = () => emailCfg.frontendUrl || 'http://localhost:3000';


const ORANGE = '#f18200';
const NAVY = '#1e3a5f';
const CREAM = '#FFF8F0';
const CREAM_B = '#FFD9A8';




const DEFAULT_LOGO_PATH = path.resolve(__dirname, '../../../../src/assets/logo.png');
let _logoCache = null;

function resetLogoCache() {_logoCache = null;}
function getLogoTag() {
  if (_logoCache !== null) return _logoCache;


  const envLogo = (emailCfg.logoPath || '').trim();
  if (/^https?:\/\//i.test(envLogo)) {
    _logoCache = `<img src="${esc(envLogo)}" alt="${co()}" style="height:48px;max-width:160px;object-fit:contain;display:block">`;
    return _logoCache;
  }


  const backendUrl = (emailCfg.backendUrl || 'https://backend.natsoft.io').replace(/\/$/, '');
  const logoFileExists = fs.existsSync(DEFAULT_LOGO_PATH);
  if (logoFileExists) {
    _logoCache = `<img src="${backendUrl}/public/logo.png" alt="${co()}" style="height:48px;max-width:160px;object-fit:contain;display:block">`;
    return _logoCache;
  }


  _logoCache = '';
  return '';
}




function infoRow(label, value) {
  return `<tr>
    <td style="padding:9px 16px;font-size:12px;font-weight:700;color:${ORANGE};white-space:nowrap;border-bottom:1px solid #FFE8CC;letter-spacing:0.2px;width:38%;vertical-align:top">${esc(label)} :</td>
    <td style="padding:9px 16px;font-size:13px;font-weight:500;color:#111827;border-bottom:1px solid #FFE8CC;word-break:break-word;vertical-align:top">${esc(String(value ?? '—'))}</td>
  </tr>`;
}


function infoTable(rows) {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};border:1px solid ${CREAM_B};border-left:4px solid ${ORANGE};border-radius:8px;overflow:hidden;margin:18px 0">${rows}</table>`;
}


function remarksBox(label, text) {
  const empty = !text || text.trim() === '' || /^-+NA-+$/i.test(text.trim());
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB">
  <tr><td style="background:#F3F4F6;padding:8px 14px;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #E5E7EB">${esc(label)}</td></tr>
  <tr><td style="padding:12px 14px;font-size:13px;color:${empty ? '#9CA3AF' : '#374151'};font-style:${empty ? 'italic' : 'normal'};white-space:pre-wrap;word-break:break-word">${empty ? 'No remarks provided.' : esc(text)}</td></tr>
</table>`;
}


function badge(text, color, bg) {
  return `<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${bg};color:${color}">${text}</span>`;
}
const badgeGreen = (t) => badge(t, '#15803D', '#DCFCE7');
const badgeRed = (t) => badge(t, '#B91C1C', '#FEE2E2');
const badgeBlue = (t) => badge(t, '#1E40AF', '#DBEAFE');
const badgeAmber = (t) => badge(t, '#92400E', '#FEF3C7');


function btn(text, url, bg = ORANGE) {
  return `<div style="text-align:center;margin:24px 0 8px">
  <a href="${esc(url)}" style="display:inline-block;padding:13px 36px;background:${bg};border-radius:8px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px">${text}</a>
</div>`;
}


const divider = `<div style="border:none;border-top:1px solid #E5E7EB;margin:20px 0"></div>`;


function attTable(rows) {
  if (!rows || !rows.length) return '';
  const trs = rows.map((r) => `
    <tr style="border-bottom:1px solid #E5E7EB">
      <td style="padding:8px 10px;font-size:12px;color:#374151">${esc(fmtDate(r.date))}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;font-family:monospace;text-align:center">${esc(r.actualFIT ? fmtDT(r.actualFIT) : '—')}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;font-family:monospace;text-align:center">${esc(r.actualLOT ? fmtDT(r.actualLOT) : '—')}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;font-family:monospace;text-align:center">${esc(r.proposedFIT ? fmtDT(r.proposedFIT) : '—')}</td>
      <td style="padding:8px 10px;font-size:11px;color:#374151;font-family:monospace;text-align:center">${esc(r.proposedLOT ? fmtDT(r.proposedLOT) : '—')}</td>
      <td style="padding:8px 10px;font-size:12px;color:#374151">${esc(r.reason || '—')}</td>
    </tr>`).join('');
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;font-size:12px;margin:16px 0;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB">
  <thead>
    <tr style="background:${ORANGE}">
      <th style="padding:9px 10px;text-align:left;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.3px" rowspan="2">Date</th>
      <th style="padding:9px 10px;text-align:center;color:#fff;font-size:10px;font-weight:600;border-left:1px solid rgba(255,255,255,0.25)" colspan="2">Actual</th>
      <th style="padding:9px 10px;text-align:center;color:#fff;font-size:10px;font-weight:600;border-left:1px solid rgba(255,255,255,0.25)" colspan="2">Proposed</th>
      <th style="padding:9px 10px;text-align:left;color:#fff;font-size:11px;font-weight:700;border-left:1px solid rgba(255,255,255,0.25)" rowspan="2">Reason</th>
    </tr>
    <tr style="background:#c96d00">
      <th style="padding:7px 10px;text-align:center;color:#fff;font-size:10px;border-left:1px solid rgba(255,255,255,0.25)">First IN</th>
      <th style="padding:7px 10px;text-align:center;color:#fff;font-size:10px;border-left:1px solid rgba(255,255,255,0.15)">Last OUT</th>
      <th style="padding:7px 10px;text-align:center;color:#fff;font-size:10px;border-left:1px solid rgba(255,255,255,0.25)">First IN</th>
      <th style="padding:7px 10px;text-align:center;color:#fff;font-size:10px;border-left:1px solid rgba(255,255,255,0.15)">Last OUT</th>
    </tr>
  </thead>
  <tbody>${trs}</tbody>
</table>`;
}


function layout({ title, subtitle, body, accent = ORANGE, companyName = '' }) {
  const logo = getLogoTag();
  const addr = [emailCfg.companyAddress, emailCfg.companyPhone, emailCfg.companyEmail].
  filter(Boolean).map(esc).join('&nbsp;&nbsp;|&nbsp;&nbsp;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF2F7;padding:28px 16px 40px">
  <tr><td align="center">
  <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">

    <!-- TOP STRIP -->
    <tr><td style="height:4px;background:linear-gradient(90deg,${accent},${accent}99)"></td></tr>

    <!-- HEADER -->
    <tr>
      <td style="background:${accent};padding:22px 28px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            ${logo ? `<td style="width:64px;vertical-align:middle;padding-right:16px">${logo}</td>` : ''}
            <td style="vertical-align:middle">
              <div style="font-size:19px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-0.2px">${esc(title)}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px">${subtitle ? esc(subtitle) : co(companyName) + ' &mdash; HR Portal Notification'}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:28px 32px;color:#374151;font-size:14px;line-height:1.75">
        ${body}
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:18px 32px;text-align:center">
        <div style="font-size:12px;font-weight:700;color:#64748B;margin-bottom:4px">${co(companyName)}</div>
        ${addr ? `<div style="font-size:11px;color:#94A3B8;margin-bottom:5px">${addr}</div>` : ''}
        <div style="font-size:11px;color:#CBD5E1">&copy; ${new Date().getFullYear()} ${co(companyName)} &nbsp;&mdash;&nbsp; This is an automated message &mdash; please <strong style="color:#94A3B8">do not reply</strong>.</div>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body></html>`;
}


const greeting = (name) => `<p style="font-size:15px;font-weight:600;color:#1F2937;margin:0 0 12px">Dear ${esc(name)},</p>`;
const lead = (html) => `<p style="color:#4B5563;font-size:14px;margin:0 0 18px;line-height:1.7">${html}</p>`;






exports.employeeInvite = ({ name, email, tempPassword, role, department, companyName = '' }) => ({
  subject: `You're invited to join ${co(companyName)}`,
  html: layout({ companyName,
    title: `Welcome to ${co(companyName)}`,
    body: `
${greeting(name)}
${lead(`Your employee account has been created on the <strong>${co(companyName)}</strong> HR Portal. You can now log in and manage your profile, leaves, payslips and more.`)}
${infoTable(`
  ${infoRow('Email / Username', email)}
  ${infoRow('Temporary Password', tempPassword || '(Set via invitation link)')}
  ${infoRow('Role', role || 'Employee')}
  ${department ? infoRow('Department', department) : ''}
`)}
<p style="color:#6B7280;font-size:13px;margin:0 0 20px">Please log in and change your password immediately from your profile settings.</p>
${btn('Login to HR Portal', `${feUrl()}/login`)}
<p style="font-size:12px;color:#9CA3AF;margin:12px 0 0;text-align:center">If you were not expecting this email, please contact your HR administrator.</p>`
  }),
  text: `Dear ${name}, your ${co(companyName)} account has been created.\nEmail: ${email}\nLogin: ${feUrl()}/login`
});

exports.loginAlert = ({ name, ip, device, time, companyName = '' }) => ({
  subject: `New login to your ${co(companyName)} account`,
  html: layout({ companyName,
    title: 'New Login Detected',
    body: `
${greeting(name)}
${lead('A new login was detected on your HR Portal account. If this was you, no action is needed.')}
${infoTable(`
  ${infoRow('Time', time || new Date().toLocaleString('en-IN'))}
  ${infoRow('IP Address', ip || 'Unknown')}
  ${infoRow('Device / Browser', device || 'Unknown')}
`)}
<p style="color:#B91C1C;font-size:13px;margin:0">If you did <strong>not</strong> log in, please <a href="${feUrl()}/change-password" style="color:${ORANGE}">change your password immediately</a> and contact IT support.</p>`
  }),
  text: `New login detected on your ${co(companyName)} account. IP: ${ip}, Time: ${time}.`
});

exports.accountLocked = ({ name, minutes, companyName = '' }) => ({
  subject: `Your ${co(companyName)} account has been temporarily locked`,
  html: layout({ companyName,
    title: 'Account Temporarily Locked',
    accent: '#DC2626',
    body: `
${greeting(name)}
${lead(`Your HRMS account has been ${badgeRed('Locked')} due to multiple failed login attempts.`)}
${infoTable(`
  ${infoRow('Locked For', `${minutes || 15} minutes`)}
  ${infoRow('Reason', 'Too many failed login attempts')}
`)}
<p style="font-size:14px;color:#4B5563;margin:0">Your account will unlock automatically after the lockout period. If you did not attempt to log in, contact IT support immediately.</p>
${btn('Reset Password', `${feUrl()}/forgot-password`, '#DC2626')}`
  }),
  text: `Your ${co(companyName)} account is locked for ${minutes || 15} minutes.`
});

exports.passwordChanged = ({ name, companyName = '' }) => ({
  subject: `Your ${co(companyName)} password was changed`,
  html: layout({ companyName,
    title: 'Password Changed',
    body: `
${greeting(name)}
<p style="font-size:14px;color:#4B5563;margin:0 0 14px">Your HR Portal account password was successfully changed.</p>
<p style="font-size:13px;color:#B91C1C;margin:0">If you did not make this change, please <a href="${feUrl()}/forgot-password" style="color:${ORANGE}">reset your password</a> immediately and contact IT support.</p>`
  }),
  text: `Your ${co(companyName)} password was changed.`
});

exports.forgotPassword = ({ name, resetUrl, expiresIn, companyName = '' }) => ({
  subject: `Reset your ${co(companyName)} password`,
  html: layout({ companyName,
    title: 'Password Reset Request',
    body: `
${greeting(name)}
${lead('We received a request to reset your HR Portal password. Click the button below to set a new password.')}
${btn('Reset My Password', esc(resetUrl))}
<p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0">This link expires in <strong>${esc(expiresIn || '1 hour')}</strong>. If you did not request a reset, you can safely ignore this email.</p>`
  }),
  text: `Reset your ${co(companyName)} password: ${resetUrl}`
});





exports.employeeCreated = ({ name, empCode, role, department, joiningDate, companyName = '' }) => ({
  subject: `Your ${co(companyName)} profile has been created`,
  html: layout({ companyName,
    title: 'Employee Profile Created',
    body: `
${greeting(name)}
${lead(`Welcome to <strong>${co(companyName)}</strong>! Your employee profile has been created in the HRMS portal.`)}
${infoTable(`
  ${infoRow('Employee Code', empCode)}
  ${infoRow('Role', role)}
  ${department ? infoRow('Department', department) : ''}
  ${joiningDate ? infoRow('Date of Joining', fmtDate(joiningDate)) : ''}
`)}
${btn('Access HR Portal', `${feUrl()}/login`)}`
  }),
  text: `Your ${co(companyName)} profile has been created. Emp Code: ${empCode}.`
});

exports.employeeDeactivated = ({ name, reason, companyName = '' }) => ({
  subject: `Your ${co(companyName)} account has been deactivated`,
  html: layout({ companyName,
    title: 'Account Deactivated',
    accent: '#DC2626',
    body: `
${greeting(name)}
<p style="font-size:14px;color:#4B5563;margin:0 0 16px">Your HR Portal account has been deactivated.</p>
${reason ? infoTable(infoRow('Reason', reason)) : ''}
<p style="font-size:14px;color:#4B5563;margin:12px 0 0">For any queries, please contact your HR department.</p>`
  }),
  text: `Your ${co(companyName)} account has been deactivated.`
});





exports.leaveApplied = ({ managerName, employeeName, empCode, leaveType, fromDate, toDate, days, reason, balance, fromSession, toSession, approveUrl, rejectUrl, companyName = '' }) => ({
  subject: `[Action Required] Leave request from ${employeeName}`,
  html: layout({ companyName,
    title: 'Leave Request — Action Required',
    subtitle: `From ${esc(employeeName)}${empCode ? ' · ' + esc(empCode) : ''} · Awaiting Your Approval`,
    body: `
${greeting(managerName)}
${lead(`<strong style="color:#111827">${esc(employeeName)}</strong>${empCode ? ` <span style="color:#9CA3AF">(${esc(empCode)})</span>` : ''} has submitted a leave request that requires your review and approval.`)}

${infoTable(`
  ${infoRow('Employee', `${employeeName}${empCode ? '  [' + empCode + ']' : ''}`)}
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From Date', fmtDate(fromDate) + (fromSession ? '  (' + fromSession + ')' : ''))}
  ${infoRow('To Date', fmtDate(toDate) + (toSession ? '  (' + toSession + ')' : ''))}
  ${infoRow('Number of Days', String(days))}
  ${balance != null ? infoRow('Leave Balance', balance + ' day(s)') : ''}
  ${reason ? infoRow('Reason', reason) : ''}
`)}

<!-- Action Buttons -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 8px">
  <tr>
    <td style="text-align:center">
      <a href="${esc(approveUrl || feUrl() + '/manager/leaves')}" style="display:inline-block;padding:13px 30px;background:#16a34a;border-radius:8px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;margin-right:10px">&#10003;&nbsp; Approve</a>
      <a href="${esc(rejectUrl || feUrl() + '/manager/leaves')}" style="display:inline-block;padding:13px 30px;background:#DC2626;border-radius:8px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;margin-left:10px">&#10007;&nbsp; Reject</a>
    </td>
  </tr>
</table>
<p style="text-align:center;font-size:12px;color:#9CA3AF;margin:0">Or review directly in <a href="${feUrl()}/manager/leaves" style="color:${ORANGE};text-decoration:none;font-weight:600">HRMS Leave Dashboard</a></p>`
  }),
  text: `Leave request from ${employeeName} (${empCode}): ${leaveType} from ${fmtDate(fromDate)} to ${fmtDate(toDate)} (${days} days). Reason: ${reason || '—'}.`
});

exports.leaveApproved = ({ employeeName, empCode, leaveType, fromDate, toDate, days, balance, reviewerName, remarks, companyName = '' }) => ({
  subject: `Your Leave Request Has Been Approved`,
  html: layout({ companyName,
    title: 'Leave Approved',
    subtitle: `${esc(leaveType)} · ${fmtDate(fromDate)} – ${fmtDate(toDate)}`,
    accent: '#16a34a',
    body: `
${greeting(employeeName + (empCode ? ` (${empCode})` : ''))}
${lead(`Your leave request has been ${badgeGreen('✓ Approved')}. Please plan accordingly.`)}
${infoTable(`
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From Date', fmtDate(fromDate))}
  ${infoRow('To Date', fmtDate(toDate))}
  ${infoRow('Duration', days + ' day(s)')}
  ${balance != null ? infoRow('Remaining Balance', balance + ' day(s)') : ''}
  ${infoRow('Approved By', reviewerName)}
`)}
${remarks ? remarksBox('Manager Remarks', remarks) : ''}
${btn('View My Leaves', `${feUrl()}/leaves`)}`
  }),
  text: `Your ${leaveType} leave (${fmtDate(fromDate)} – ${fmtDate(toDate)}, ${days} days) has been approved by ${reviewerName}.`
});

exports.leaveRejected = ({ employeeName, empCode, leaveType, fromDate, toDate, fromSession, toSession, days, reviewerName, remarks, companyName = '' }) => ({
  subject: `Your Leave Request Has Been Rejected`,
  html: layout({ companyName,
    title: 'Leave Request Rejected',
    subtitle: `${esc(leaveType)} · ${fmtDate(fromDate)} – ${fmtDate(toDate)}`,
    accent: '#DC2626',
    body: `
${greeting(employeeName + (empCode ? ` (${empCode})` : ''))}
${lead(`Your leave application has been ${badgeRed('✗ Rejected')}. Please contact your manager for details.`)}
${infoTable(`
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From Date', fmtDate(fromDate) + (fromSession ? '  (' + fromSession + ')' : ''))}
  ${infoRow('To Date', fmtDate(toDate) + (toSession ? '  (' + toSession + ')' : ''))}
  ${infoRow('Duration', days + ' day(s)')}
  ${infoRow('Reviewed By', reviewerName)}
`)}
${remarks ? remarksBox('Manager Remarks', remarks) : ''}
${btn('Apply for Another Leave', `${feUrl()}/leaves`)}`
  }),
  text: `Your ${leaveType} leave request (${fmtDate(fromDate)} – ${fmtDate(toDate)}) has been rejected by ${reviewerName}. Reason: ${remarks || '—'}.`
});

exports.leaveCancelled = ({ managerName, employeeName, leaveType, fromDate, toDate, companyName = '' }) => ({
  subject: `Leave Cancelled — ${esc(employeeName)}`,
  html: layout({ companyName,
    title: 'Leave Cancellation Notice',
    body: `
${greeting(managerName)}
${lead(`<strong>${esc(employeeName)}</strong> has cancelled their leave request. No further action is required.`)}
${infoTable(`
  ${infoRow('Employee', employeeName)}
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From', fmtDate(fromDate))}
  ${infoRow('To', fmtDate(toDate))}
`)}`
  }),
  text: `${employeeName} cancelled their ${leaveType} leave (${fmtDate(fromDate)} – ${fmtDate(toDate)}).`
});





exports.missingCheckIn = ({ name, date, companyName = '' }) => ({
  subject: `Reminder: Check-In Not Recorded — ${esc(date)}`,
  html: layout({ companyName,
    title: 'Check-In Reminder',
    body: `
${greeting(name)}
${lead(`Our records show that your <strong>check-in</strong> for today (<strong>${esc(date)}</strong>) has not been recorded. If you are working today, please mark your attendance immediately.`)}
${btn('Mark Attendance', `${feUrl()}/attendance`)}`
  }),
  text: `Reminder: No check-in recorded for ${name} on ${date}.`
});

exports.missingCheckOut = ({ name, date, companyName = '' }) => ({
  subject: `Reminder: Check-Out Not Recorded — ${esc(date)}`,
  html: layout({ companyName,
    title: 'Check-Out Reminder',
    body: `
${greeting(name)}
${lead(`Your <strong>check-out</strong> for today (<strong>${esc(date)}</strong>) has not been recorded. Please mark your check-out as soon as possible.`)}
${btn('Mark Check-Out', `${feUrl()}/attendance`)}`
  }),
  text: `Reminder: No check-out recorded for ${name} on ${date}.`
});

exports.attendanceRegularizationRequest = ({ managerName, employeeName, empCode, dates, date, reason, remarks, companyName = '' }) => {
  const rows = dates || (date ? [{ date, reason }] : []);
  return {
    subject: `[Action Required] Attendance Regularization — ${esc(employeeName)}${empCode ? ` [${esc(empCode)}]` : ''}`,
    html: layout({ companyName,
      title: 'Attendance Regularization Request',
      subtitle: `From ${esc(employeeName)}${empCode ? ' [' + esc(empCode) + ']' : ''} · ${rows.length} date(s)`,
      body: `
${greeting(managerName)}
${lead(`<strong>${esc(employeeName)}</strong>${empCode ? ` <span style="color:#9CA3AF">[${esc(empCode)}]</span>` : ''} has applied for attendance regularization for the following date(s). Please log in to the HR Portal to review and take action.`)}
${attTable(rows)}
${remarksBox('Employee Remarks', remarks || '')}
${btn('Review in HR Portal', `${feUrl()}/manager/attendance`)}`
    }),
    text: `${employeeName}${empCode ? ' [' + empCode + ']' : ''} has applied for attendance regularization for ${rows.length} date(s).`
  };
};

exports.attendanceRegularized = ({ employeeName, empCode, dates, date, remarks, managerRemarks, companyName = '' }) => {
  const rows = dates || (date ? [{ date }] : []);
  return {
    subject: `Attendance Regularization Approved`,
    html: layout({ companyName,
      title: 'Attendance Regularization Approved',
      subtitle: `${rows.length} date(s) approved`,
      accent: '#16a34a',
      body: `
${greeting(employeeName + (empCode ? ` (${empCode})` : ''))}
${lead(`Your attendance regularization request has been ${badgeGreen('✓ Approved')} for the following date(s):`)}
${attTable(rows)}
${remarksBox('Manager Remarks', managerRemarks || '')}
${btn('View Attendance', `${feUrl()}/attendance`)}`
    }),
    text: `Your attendance regularization for ${rows.length} date(s) has been approved.`
  };
};

exports.attendanceRegularizationRejected = ({ employeeName, empCode, dates, date, remarks, managerRemarks, companyName = '' }) => {
  const rows = dates || (date ? [{ date }] : []);
  return {
    subject: `Attendance Regularization Rejected`,
    html: layout({ companyName,
      title: 'Attendance Regularization Rejected',
      subtitle: `${rows.length} date(s) rejected`,
      accent: '#DC2626',
      body: `
${greeting(employeeName + (empCode ? ` (${empCode})` : ''))}
${lead(`Your attendance regularization request has been ${badgeRed('✗ Rejected')} for the following date(s):`)}
${attTable(rows)}
${remarksBox('Manager Remarks', managerRemarks || '')}
${btn('View Attendance', `${feUrl()}/attendance`)}`
    }),
    text: `Your attendance regularization for ${rows.length} date(s) has been rejected.`
  };
};





exports.payslipReleased = ({ employeeName, empCode, month, year, grossSalary, deductions, netSalary, payslipUrl, companyName = '' }) => ({
  subject: `Your Payslip for ${esc(month)} ${esc(String(year))} is Ready`,
  html: layout({ companyName,
    title: `Payslip — ${esc(month)} ${esc(String(year))}`,
    subtitle: `Pay period: ${esc(month)} ${esc(String(year))}`,
    accent: '#065F46',
    body: `
${greeting(employeeName + (empCode ? ` (${empCode})` : ''))}
${lead(`Your payslip for <strong>${esc(month)} ${esc(String(year))}</strong> has been generated and is available for download.`)}
${infoTable(`
  ${empCode ? infoRow('Employee Code', empCode) : ''}
  ${infoRow('Pay Period', `${month} ${year}`)}
  ${infoRow('Gross Earnings', fmtINR(grossSalary))}
  ${infoRow('Total Deductions', fmtINR(deductions))}
  ${infoRow('Net Pay', fmtINR(netSalary))}
`)}
${btn('View &amp; Download Payslip', esc(payslipUrl || `${feUrl()}/payslips`), '#065F46')}`
  }),
  text: `Your payslip for ${month} ${year} is ready. Net Pay: ${fmtINR(netSalary)}.`
});

exports.salaryRevised = ({ employeeName, effectiveDate, newCTC, revisedBy, companyName = '' }) => ({
  subject: `Salary Revision Notice — Effective ${esc(fmtDate(effectiveDate))}`,
  html: layout({ companyName,
    title: 'Salary Revision Notice',
    body: `
${greeting(employeeName)}
${lead(`Your salary structure has been revised. The updated CTC will be reflected from <strong>${esc(fmtDate(effectiveDate))}</strong>.`)}
${infoTable(`
  ${infoRow('Effective Date', fmtDate(effectiveDate))}
  ${infoRow('Revised CTC', fmtINR(newCTC))}
  ${infoRow('Revised By', revisedBy || 'HR')}
`)}
${btn('View Payslips', `${feUrl()}/payslips`, '#065F46')}`
  }),
  text: `Your salary has been revised effective ${fmtDate(effectiveDate)}. New CTC: ${fmtINR(newCTC)}.`
});





exports.applicationAcknowledgment = ({ candidateName, jobTitle, applicationCode, companyName = '' }) => ({
  subject: `Application Received — ${esc(jobTitle)} at ${co(companyName)}`,
  html: layout({ companyName,
    title: 'Application Received',
    subtitle: `${esc(jobTitle)} at ${co(companyName)}`,
    body: `
${greeting(candidateName)}
${lead(`Thank you for applying for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co(companyName)}</strong>. We have received your application.`)}
${infoTable(`
  ${applicationCode ? infoRow('Reference No.', applicationCode) : ''}
  ${infoRow('Position', jobTitle)}
  ${infoRow('Company', co(companyName))}
`)}
<p style="color:#6B7280;font-size:13px;margin:0">Our recruitment team will review your application and reach out if your profile matches our requirements. We appreciate your interest.</p>`
  }),
  text: `Thank you for applying for ${jobTitle} at ${co(companyName)}. We will be in touch.`
});

exports.candidateShortlisted = ({ candidateName, jobTitle, companyName = '' }) => ({
  subject: `Great News! You've Been Shortlisted — ${esc(jobTitle)} at ${co(companyName)}`,
  html: layout({ companyName,
    title: 'You Have Been Shortlisted!',
    subtitle: `${esc(jobTitle)} at ${co(companyName)}`,
    accent: '#16a34a',
    body: `
${greeting(candidateName)}
${lead(`Congratulations! After reviewing your profile, you have been ${badgeGreen('Shortlisted')} for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co(companyName)}</strong>.`)}
<p style="font-size:14px;color:#4B5563;margin:0 0 12px">Our recruitment team will reach out to you shortly to schedule the next steps. Please keep your phone and email accessible.</p>
<p style="color:#6B7280;font-size:13px;margin:0">Thank you for your interest in joining our team!</p>`
  }),
  text: `Congratulations ${candidateName}! You have been shortlisted for ${jobTitle} at ${co(companyName)}.`
});

exports.candidateRejected = ({ candidateName, jobTitle, companyName = '' }) => ({
  subject: `Update on Your Application — ${esc(jobTitle)} at ${co(companyName)}`,
  html: layout({ companyName,
    title: 'Application Status Update',
    subtitle: `${esc(jobTitle)} at ${co(companyName)}`,
    body: `
${greeting(candidateName)}
${lead(`Thank you for your interest in the <strong>${esc(jobTitle)}</strong> position at <strong>${co(companyName)}</strong> and for the time you invested in the application process.`)}
<p style="font-size:14px;color:#4B5563;margin:0 0 12px">After careful review, we have decided to move forward with other candidates whose experience more closely matches our current requirements.</p>
<p style="font-size:13px;color:#6B7280;margin:0">We will keep your profile on record and encourage you to apply for future openings that align with your skills. We wish you the very best in your career journey.</p>`
  }),
  text: `Thank you for applying for ${jobTitle} at ${co(companyName)}. We have moved forward with other candidates.`
});

exports.offerLetter = ({ candidateName, jobTitle, ctc, joiningDate, offerUrl, companyName = '' }) => ({
  subject: `Offer Letter — ${esc(jobTitle)} at ${co(companyName)}`,
  html: layout({ companyName,
    title: `Offer of Employment — ${co(companyName)}`,
    subtitle: `Position: ${esc(jobTitle)}`,
    body: `
${greeting(candidateName)}
${lead(`We are delighted to extend an offer of employment for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co(companyName)}</strong>.`)}
${infoTable(`
  ${infoRow('Position', jobTitle)}
  ${joiningDate ? infoRow('Expected Date of Joining', fmtDate(joiningDate)) : ''}
  ${ctc ? infoRow('Cost to Company (CTC)', fmtINR(ctc) + ' per annum') : ''}
`)}
<p style="font-size:14px;color:#4B5563;margin:0 0 4px">Please review your offer letter carefully and confirm your acceptance at the earliest.</p>
${btn('View &amp; Accept Offer', esc(offerUrl || feUrl()))}`
  }),
  text: `Congratulations! You've been offered the position of ${jobTitle} at ${co(companyName)}.`
});

exports.offerAccepted = ({ recruiterName, candidateName, jobTitle, joiningDate, companyName = '' }) => ({
  subject: `Offer Accepted — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'Offer Accepted ✓',
    accent: '#16a34a',
    body: `
${greeting(recruiterName)}
${lead(`<strong>${esc(candidateName)}</strong> has ${badgeGreen('✓ Accepted')} the offer for <strong>${esc(jobTitle)}</strong>.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${joiningDate ? infoRow('Expected Joining', fmtDate(joiningDate)) : ''}
`)}
${btn('View in HRMS', `${feUrl()}/recruitment/candidates`)}`
  }),
  text: `${candidateName} has accepted the offer for ${jobTitle}.`
});

exports.offerRejected = ({ recruiterName, candidateName, jobTitle, companyName = '' }) => ({
  subject: `Offer Declined — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'Offer Declined',
    accent: '#DC2626',
    body: `
${greeting(recruiterName)}
${lead(`<strong>${esc(candidateName)}</strong> has ${badgeRed('✗ Declined')} the offer for <strong>${esc(jobTitle)}</strong>.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
`)}
${btn('View in HRMS', `${feUrl()}/recruitment/candidates`)}`
  }),
  text: `${candidateName} has declined the offer for ${jobTitle}.`
});





exports.resignationSubmitted = ({ managerName, employeeName, empCode, submitDate, endDate, reason, companyName = '' }) => ({
  subject: `[Action Required] Resignation Received — ${esc(employeeName)}`,
  html: layout({ companyName,
    title: 'Resignation Submitted — Action Required',
    subtitle: `From ${esc(employeeName)}${empCode ? ' [' + esc(empCode) + ']' : ''}`,
    accent: '#9333EA',
    body: `
${greeting(managerName)}
${lead(`<strong>${esc(employeeName)}</strong>${empCode ? ` <span style="color:#9CA3AF">[${esc(empCode)}]</span>` : ''} has submitted a resignation request that requires your review.`)}
${infoTable(`
  ${infoRow('Employee', `${employeeName}${empCode ? ' [' + empCode + ']' : ''}`)}
  ${infoRow('Submitted On', fmtDate(submitDate))}
  ${infoRow('Requested Last Working Day', fmtDate(endDate))}
  ${reason ? infoRow('Reason', reason) : ''}
`)}
${btn('Review Resignation', `${feUrl()}/manager/resignations`, '#9333EA')}`
  }),
  text: `${employeeName} has submitted a resignation. Last working day requested: ${fmtDate(endDate)}.`
});

exports.resignationApproved = ({ employeeName, lastWorkingDay, reviewerName, companyName = '' }) => ({
  subject: `Resignation Accepted — Last Working Day: ${esc(fmtDate(lastWorkingDay))}`,
  html: layout({ companyName,
    title: 'Resignation Accepted',
    body: `
${greeting(employeeName)}
${lead(`Your resignation has been ${badgeBlue('Accepted')}.`)}
${infoTable(`
  ${infoRow('Last Working Day', fmtDate(lastWorkingDay))}
  ${infoRow('Accepted By', reviewerName)}
`)}
<p style="font-size:13px;color:#6B7280;margin:12px 0 0">The HR team will reach out to you regarding exit formalities, full &amp; final settlement, and your experience letter.</p>`
  }),
  text: `Your resignation has been accepted. Last working day: ${fmtDate(lastWorkingDay)}.`
});

exports.resignationRejected = ({ employeeName, reviewerName, remarks, companyName = '' }) => ({
  subject: `Update on Your Resignation Request`,
  html: layout({ companyName,
    title: 'Resignation Not Accepted',
    body: `
${greeting(employeeName)}
${lead('Your resignation request has not been accepted at this time.')}
${remarks ? remarksBox('Reason', remarks) : ''}
<p style="font-size:14px;color:#4B5563;margin:0">For further discussion, please reach out to <strong>${esc(reviewerName)}</strong> or your HR team directly.</p>`
  }),
  text: `Your resignation request was not accepted. Reason: ${remarks || 'Contact HR for details'}.`
});





exports.ticketCreated = ({ agentName, reporterName, ticketId, subject: ticketSubject, priority, category, companyName = '' }) => ({
  subject: `[#${ticketId}] New Helpdesk Ticket: ${esc(ticketSubject)}`,
  html: layout({ companyName,
    title: `New Ticket #${ticketId}`,
    subtitle: esc(ticketSubject),
    body: `
${greeting(agentName)}
${lead('A new helpdesk ticket has been assigned to you and requires attention.')}
${infoTable(`
  ${infoRow('Ticket ID', '#' + ticketId)}
  ${infoRow('Subject', ticketSubject)}
  ${infoRow('Raised By', reporterName)}
  ${category ? infoRow('Category', category) : ''}
  ${infoRow('Priority', priority || 'Normal')}
`)}
${btn('View &amp; Respond to Ticket', `${feUrl()}/helpdesk/${ticketId}`)}`
  }),
  text: `New ticket #${ticketId}: "${ticketSubject}" raised by ${reporterName}.`
});

exports.ticketResolved = ({ reporterName, ticketId, subject: ticketSubject, companyName = '' }) => ({
  subject: `[#${ticketId}] Your Helpdesk Request Has Been Resolved`,
  html: layout({ companyName,
    title: `Ticket #${ticketId} Resolved`,
    accent: '#16a34a',
    body: `
${greeting(reporterName)}
${lead(`Your helpdesk request has been ${badgeGreen('✓ Resolved')}.`)}
${infoTable(`
  ${infoRow('Ticket ID', '#' + ticketId)}
  ${infoRow('Subject', ticketSubject)}
`)}
<p style="color:#6B7280;font-size:13px;margin:0">If you have further questions or the issue persists, please raise a new ticket.</p>`
  }),
  text: `Your ticket #${ticketId} (${ticketSubject}) has been resolved.`
});

exports.ticketUpdated = ({ reporterName, ticketId, subject: ticketSubject, updateMessage, companyName = '' }) => ({
  subject: `[#${ticketId}] Update on Your Helpdesk Request`,
  html: layout({ companyName,
    title: `Ticket #${ticketId} — Update`,
    body: `
${greeting(reporterName)}
${lead('There is an update on your helpdesk ticket.')}
${infoTable(`
  ${infoRow('Ticket ID', '#' + ticketId)}
  ${infoRow('Subject', ticketSubject)}
`)}
${updateMessage ? remarksBox('Update', updateMessage) : ''}
${btn('View Ticket', `${feUrl()}/helpdesk/${ticketId}`)}`
  }),
  text: `Update on ticket #${ticketId}: ${updateMessage}`
});





exports.timesheetSubmitted = ({ managerName, employeeName, weekLabel, totalHours, companyName = '' }) => ({
  subject: `[Action Required] Timesheet Submitted — ${esc(employeeName)}`,
  html: layout({ companyName,
    title: 'Timesheet Submitted — Review Required',
    body: `
${greeting(managerName)}
${lead(`<strong>${esc(employeeName)}</strong> has submitted a timesheet for your approval.`)}
${infoTable(`
  ${weekLabel ? infoRow('Week', weekLabel) : ''}
  ${totalHours ? infoRow('Total Hours', totalHours + ' hrs') : ''}
  ${infoRow('Employee', employeeName)}
`)}
${btn('Review Timesheet', `${feUrl()}/manager/timesheets`)}`
  }),
  text: `${employeeName} has submitted a timesheet for ${weekLabel} (${totalHours} hrs).`
});

exports.timesheetApproved = ({ employeeName, weekLabel, companyName = '' }) => ({
  subject: `Your Timesheet Has Been Approved`,
  html: layout({ companyName,
    title: 'Timesheet Approved ✓',
    accent: '#16a34a',
    body: `
${greeting(employeeName)}
${lead(`Your timesheet${weekLabel ? ` for <strong>${esc(weekLabel)}</strong>` : ''} has been ${badgeGreen('✓ Approved')}.`)}
${btn('View Timesheets', `${feUrl()}/tasks`)}`
  }),
  text: `Your timesheet for ${weekLabel} has been approved.`
});

exports.timesheetRejected = ({ employeeName, weekLabel, remarks, companyName = '' }) => ({
  subject: `Your Timesheet Requires Revision`,
  html: layout({ companyName,
    title: 'Timesheet Needs Revision',
    accent: '#DC2626',
    body: `
${greeting(employeeName)}
${lead(`Your timesheet${weekLabel ? ` for <strong>${esc(weekLabel)}</strong>` : ''} has been ${badgeRed('Returned for Revision')}.`)}
${remarks ? remarksBox('Manager Remarks', remarks) : ''}
${btn('Update Timesheet', `${feUrl()}/tasks`)}`
  }),
  text: `Your timesheet for ${weekLabel} has been returned for revision. Remarks: ${remarks}`
});

exports.timesheetReminder = ({ employeeName, weekLabel, companyName = '' }) => ({
  subject: `Reminder: Please Submit Your Timesheet`,
  html: layout({ companyName,
    title: 'Timesheet Submission Reminder',
    body: `
${greeting(employeeName)}
${lead(`This is a friendly reminder to submit your timesheet${weekLabel ? ` for <strong>${esc(weekLabel)}</strong>` : ''} at the earliest.`)}
${btn('Submit Timesheet', `${feUrl()}/tasks`)}`
  }),
  text: `Reminder: Please submit your timesheet for ${weekLabel}.`
});





exports.documentExpiry = ({ employeeName, documentType, expiryDate, daysLeft, companyName = '' }) => ({
  subject: `${daysLeft <= 7 ? 'URGENT: ' : ''}${esc(documentType)} Expires in ${daysLeft} Day(s)`,
  html: layout({ companyName,
    title: daysLeft <= 7 ? '⚠ Document Expiring Soon — Urgent' : 'Document Expiry Reminder',
    accent: daysLeft <= 7 ? '#DC2626' : ORANGE,
    body: `
${greeting(employeeName)}
${lead(`Your <strong>${esc(documentType)}</strong> is expiring soon. Please renew it before the expiry date to avoid any compliance issues.`)}
${infoTable(`
  ${infoRow('Document Type', documentType)}
  ${infoRow('Expiry Date', fmtDate(expiryDate))}
  ${infoRow('Days Remaining', daysLeft + ' day(s)')}
`)}
${btn('Upload Renewed Document', `${feUrl()}/documents`)}`
  }),
  text: `${documentType} expires on ${fmtDate(expiryDate)} (${daysLeft} days left). Please renew.`
});





exports.emailDeliveryFailed = ({ to, template, error, attempts, companyName = '' }) => ({
  subject: `[HRMS Alert] Email Delivery Failed — ${esc(template)}`,
  html: layout({ companyName,
    title: 'Email Delivery Failed',
    accent: '#DC2626',
    body: `
<p style="font-size:14px;color:#374151;margin:0 0 16px">An email could not be delivered after all retry attempts.</p>
${infoTable(`
  ${infoRow('Recipient', to)}
  ${infoRow('Template', template)}
  ${infoRow('Error', error)}
  ${infoRow('Attempts Made', String(attempts))}
  ${infoRow('Time', new Date().toLocaleString('en-IN'))}
`)}
<p style="font-size:13px;color:#6B7280;margin:0">Please check SMTP configuration and retry manually if required.</p>`
  }),
  text: `Email delivery failed. Recipient: ${to}, Template: ${template}, Error: ${error}`
});





exports.recruiterAssigned = ({ recruiterName, jobTitle, jobCode, client, vacancies, skillSet, loginUrl, companyName = '' }) => ({
  subject: `[${co(companyName)}] New Job Assigned — ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'New Job Assignment',
    subtitle: esc(jobTitle),
    body: `
${greeting(`Hi ${recruiterName}`)}
${lead('A new job has been assigned to you by HR. Please review the details below and begin sourcing candidates.')}
${infoTable(`
  ${infoRow('Job Title', jobTitle)}
  ${jobCode ? infoRow('Job Code', jobCode) : ''}
  ${client ? infoRow('Client / Department', client) : ''}
  ${infoRow('Vacancies', String(vacancies || 1))}
  ${skillSet ? infoRow('Skills Required', skillSet) : ''}
`)}
${btn('View Job &amp; Upload Candidates', esc(loginUrl || `${feUrl()}/recruitment`))}`
  }),
  text: `Hi ${recruiterName}, job "${jobTitle}" assigned. Vacancies: ${vacancies || 1}. Skills: ${skillSet || '—'}.`
});

exports.tlJobAssigned = ({ tlName, recruiterName, jobTitle, jobCode, client, vacancies, skillSet, companyName = '' }) => ({
  subject: `[${co(companyName)}] Team Update — ${esc(recruiterName)} Assigned to ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'Team Job Assignment Update',
    body: `
${greeting(`Hi ${tlName}`)}
${lead(`A new job has been assigned to your team member <strong>${esc(recruiterName)}</strong>.`)}
${infoTable(`
  ${infoRow('Job Title', jobTitle)}
  ${jobCode ? infoRow('Job Code', jobCode) : ''}
  ${client ? infoRow('Client / Department', client) : ''}
  ${infoRow('Vacancies', String(vacancies || 1))}
  ${skillSet ? infoRow('Skills Required', skillSet) : ''}
  ${infoRow('Assigned To', recruiterName)}
`)}
${btn('View in HRMS', `${feUrl()}/recruitment`)}`
  }),
  text: `Hi ${tlName}, job "${jobTitle}" assigned to ${recruiterName}. Vacancies: ${vacancies || 1}.`
});

exports.tlCandidateUpdate = ({ tlName, recruiterName, candidateName, jobTitle, status, companyName = '' }) => ({
  subject: `[${co(companyName)}] Candidate ${esc(status)} — ${esc(candidateName)}`,
  html: layout({ companyName,
    title: `Candidate ${esc(status)}`,
    body: `
${greeting(`Hi ${tlName}`)}
${lead(`Your team member <strong>${esc(recruiterName)}</strong> has updated a candidate status.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Job Title', jobTitle)}
  ${infoRow('New Status', status)}
  ${infoRow('Updated By', recruiterName)}
`)}
${btn('View Candidate', `${feUrl()}/recruitment`)}`
  }),
  text: `Hi ${tlName}, ${recruiterName} marked ${candidateName} as ${status} for ${jobTitle}.`
});

exports.tlOfferUpdate = ({ tlName, candidateName, jobTitle, event, ctc, dateOfJoining, companyName = '' }) => ({
  subject: `[${co(companyName)}] Offer ${esc(event)} — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: `Offer ${esc(event)}`,
    body: `
${greeting(`Hi ${tlName}`)}
${lead(`An offer for a candidate sourced by your team has been <strong>${esc(event)}</strong>.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Job Title', jobTitle)}
  ${infoRow('Offer Status', event)}
  ${ctc ? infoRow('CTC', 'INR ' + Number(ctc).toLocaleString('en-IN')) : ''}
  ${dateOfJoining ? infoRow('Date of Joining', fmtDate(dateOfJoining)) : ''}
`)}
${btn('View Offer', `${feUrl()}/recruitment`)}`
  }),
  text: `Hi ${tlName}, offer for ${candidateName} (${jobTitle}) has been ${event}.`
});





exports.candidateSubmittedToHR = ({ hrName, recruiterName, candidateName, jobTitle, candidateCode, companyName = '' }) => ({
  subject: `[${co(companyName)}] New Candidate for Review — ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'New Candidate Submitted for Review',
    body: `
${greeting(`Hi ${hrName}`)}
${lead(`<strong>${esc(recruiterName)}</strong> has submitted a new candidate for review.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${candidateCode ? infoRow('Reference', candidateCode) : ''}
  ${infoRow('Position', jobTitle)}
  ${infoRow('Submitted By', recruiterName)}
`)}
${btn('Review Candidate', `${feUrl()}/recruitment/candidates`)}`
  }),
  text: `Hi ${hrName}, ${recruiterName} submitted ${candidateName} for ${jobTitle}.`
});

exports.candidateStatusToRecruiter = ({ recruiterName, candidateName, jobTitle, status, companyName = '' }) => ({
  subject: `[${co(companyName)}] Candidate Status Updated — ${esc(candidateName)}`,
  html: layout({ companyName,
    title: 'Candidate Status Updated',
    body: `
${greeting(`Hi ${recruiterName}`)}
${lead('The status of your candidate has been updated by HR.')}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${infoRow('New Status', status)}
`)}
${btn('View Candidate', `${feUrl()}/recruitment/candidates`)}`
  }),
  text: `${candidateName} status updated to "${status}" for ${jobTitle}.`
});

exports.interviewScheduledCandidate = ({ candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer, companyName = '' }) => ({
  subject: `Interview Scheduled — ${esc(jobTitle)} at ${co(companyName)}`,
  html: layout({ companyName,
    title: 'Your Interview Has Been Scheduled',
    subtitle: `${esc(jobTitle)} at ${co(companyName)}`,
    body: `
${greeting(candidateName)}
${lead(`Your interview for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co(companyName)}</strong> has been scheduled. Please ensure you are available at the scheduled time.`)}
${infoTable(`
  ${infoRow('Position', jobTitle)}
  ${level ? infoRow('Interview Round', level) : ''}
  ${infoRow('Date', interviewDate ? fmtDate(interviewDate) : '—')}
  ${interviewTime ? infoRow('Time', interviewTime) : ''}
  ${interviewType ? infoRow('Mode', interviewType) : ''}
  ${interviewer ? infoRow('Interviewer', interviewer) : ''}
`)}
<p style="color:#6B7280;font-size:13px;margin:0">Best of luck! Please be on time and carry relevant documents.</p>`
  }),
  text: `Dear ${candidateName}, your interview for ${jobTitle} is on ${fmtDate(interviewDate)}${interviewTime ? ' at ' + interviewTime : ''}.`
});

exports.interviewScheduledHR = ({ hrName, candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer, scheduledByName, companyName = '' }) => ({
  subject: `[${co(companyName)}] Interview Scheduled — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'Interview Scheduled',
    body: `
${greeting(`Hi ${hrName}`)}
${lead('An interview has been scheduled for a candidate in your pipeline.')}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${level ? infoRow('Round', level) : ''}
  ${infoRow('Date', interviewDate ? fmtDate(interviewDate) : '—')}
  ${interviewTime ? infoRow('Time', interviewTime) : ''}
  ${interviewType ? infoRow('Mode', interviewType) : ''}
  ${interviewer ? infoRow('Interviewer', interviewer) : ''}
  ${scheduledByName ? infoRow('Scheduled By', scheduledByName) : ''}
`)}
${btn('View Interview', `${feUrl()}/recruitment/interviews`)}`
  }),
  text: `Interview for ${candidateName} (${jobTitle}) on ${fmtDate(interviewDate)}.`
});

exports.interviewFeedbackToHR = ({ hrName, candidateName, jobTitle, level, interviewerName, feedbackStatus, feedbackComments, companyName = '' }) => ({
  subject: `[${co(companyName)}] Interview Feedback Received — ${esc(candidateName)}`,
  html: layout({ companyName,
    title: 'Interview Feedback Submitted',
    body: `
${greeting(`Hi ${hrName}`)}
${lead('Interview feedback has been submitted for a candidate.')}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${level ? infoRow('Round', level) : ''}
  ${interviewerName ? infoRow('Interviewer', interviewerName) : ''}
  ${feedbackStatus ? infoRow('Outcome', feedbackStatus) : ''}
`)}
${feedbackComments ? remarksBox('Comments', feedbackComments) : ''}
${btn('View Details', `${feUrl()}/recruitment/interviews`)}`
  }),
  text: `Feedback received for ${candidateName} (${jobTitle}). Outcome: ${feedbackStatus || '—'}.`
});

exports.candidateSelectedAdmin = ({ candidateName, jobTitle, recruiterName, companyName = '' }) => ({
  subject: `[${co(companyName)}] Candidate Selected — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'Candidate Selected — Offer Required',
    accent: '#16a34a',
    body: `
${greeting('Hi Admin')}
${lead(`A candidate has been marked as ${badgeGreen('Selected')} and is ready for an offer letter.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${recruiterName ? infoRow('Sourced By', recruiterName) : ''}
  ${infoRow('Next Step', 'Prepare and release the offer letter')}
`)}
${btn('Create Offer', `${feUrl()}/recruitment/offers`)}`
  }),
  text: `${candidateName} selected for ${jobTitle}. Please release an offer.`
});

exports.offerReleasedToHR = ({ hrName, candidateName, jobTitle, ctc, dateOfJoining, companyName = '' }) => ({
  subject: `[${co(companyName)}] Offer Released — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({ companyName,
    title: 'Offer Released',
    body: `
${greeting(`Hi ${hrName}`)}
${lead('An offer letter has been released to the following candidate. Awaiting acceptance.')}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${ctc ? infoRow('CTC', fmtINR(ctc) + ' per annum') : ''}
  ${dateOfJoining ? infoRow('Expected Joining', fmtDate(dateOfJoining)) : ''}
  ${infoRow('Status', 'Offer Sent — Awaiting Acceptance')}
`)}
${btn('View Offer', `${feUrl()}/recruitment/offers`)}`
  }),
  text: `Offer released to ${candidateName} for ${jobTitle}. Awaiting acceptance.`
});

exports.offerAcceptedAdmin = ({ candidateName, jobTitle, dateOfJoining, companyName = '' }) => ({
  subject: `[${co(companyName)}] Offer Accepted — ${esc(candidateName)} Joining ${dateOfJoining ? fmtDate(dateOfJoining) : ''}`,
  html: layout({ companyName,
    title: 'Offer Accepted ✓',
    accent: '#16a34a',
    body: `
${greeting('Hi Admin')}
${lead(`<strong>${esc(candidateName)}</strong> has ${badgeGreen('✓ Accepted')} the offer for <strong>${esc(jobTitle)}</strong>.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${dateOfJoining ? infoRow('Expected Joining', fmtDate(dateOfJoining)) : ''}
  ${infoRow('Next Step', 'Initiate employee onboarding')}
`)}
${btn('View in HRMS', `${feUrl()}/recruitment/candidates`)}`
  }),
  text: `${candidateName} accepted the offer for ${jobTitle}.`
});





exports.joiningInvitation = ({ candidateName, jobTitle, joiningUrl, expiresAt, ctc, dateOfJoining, offerCode, basic, hra, telephoneAllowance, leaveTravel, specialAllowance, grossSalary, pfContribution, statutoryBonus, gratuity, esi, companyName = '' }) => {
  const ann = (v) => Number(v) || 0;
  const mon = (v) => Math.round((Number(v) || 0) / 12);
  const ctcAnnual = ann(ctc);

  const ctcRow = (label, annVal) => !annVal ? '' : `<tr>
    <td style="padding:8px 12px;border-bottom:1px solid #FFE8CC;font-size:12px;color:#374151">${esc(label)}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #FFE8CC;font-size:12px;text-align:right;color:#111827;font-family:monospace">${fmtINR(mon(annVal))}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #FFE8CC;font-size:12px;text-align:right;color:#111827;font-family:monospace">${fmtINR(ann(annVal))}</td>
  </tr>`;
  const ctcTotal = (label, annVal) => `<tr style="background:#FFF3E0">
    <td style="padding:8px 12px;font-size:12px;font-weight:700;color:${ORANGE}">${esc(label)}</td>
    <td style="padding:8px 12px;font-size:12px;font-weight:700;text-align:right;color:${ORANGE};font-family:monospace">${fmtINR(mon(annVal))}</td>
    <td style="padding:8px 12px;font-size:12px;font-weight:700;text-align:right;color:${ORANGE};font-family:monospace">${fmtINR(ann(annVal))}</td>
  </tr>`;

  const ctcTable = `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden;border:1px solid ${CREAM_B}">
  <thead>
    <tr style="background:${ORANGE}">
      <th style="padding:9px 12px;text-align:left;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.5px">COMPONENT</th>
      <th style="padding:9px 12px;text-align:right;color:rgba(255,255,255,0.8);font-size:11px;font-weight:600">MONTHLY</th>
      <th style="padding:9px 12px;text-align:right;color:rgba(255,255,255,0.8);font-size:11px;font-weight:600">YEARLY</th>
    </tr>
  </thead>
  <tbody style="background:${CREAM}">
    ${ctcRow('Basic', basic)}
    ${ctcRow('HRA', hra)}
    ${ctcRow('Telephone / Internet Expenses', telephoneAllowance)}
    ${ctcRow('Leave Travel Allowance', leaveTravel)}
    ${ctcRow('Spl. Allowance', specialAllowance)}
    ${ctcTotal('Gross Salary', grossSalary)}
    ${ctcRow("Company's PF Contribution", pfContribution)}
    ${ann(statutoryBonus) ? ctcRow('Statutory Bonus', statutoryBonus) : ''}
    ${ann(gratuity) ? ctcRow('Gratuity', gratuity) : ''}
    ${ann(esi) ? ctcRow('ESI (Employer Share)', esi) : ''}
    ${ctcTotal('Cost To Company (CTC)', ctcAnnual)}
  </tbody>
</table>`;

  const body = `
${greeting(candidateName)}
${lead(`We are delighted to offer you the position of <strong>${esc(jobTitle)}</strong> at <strong>${co(companyName)}</strong>. Your complete Offer Letter with all terms, conditions and CTC breakdown is <strong>attached as a PDF</strong>.`)}
${divider}
<p style="font-size:13px;font-weight:700;color:${ORANGE};margin:0 0 8px;letter-spacing:0.5px;text-transform:uppercase">Complete Your Joining Formalities</p>
<p style="font-size:13px;color:#4B5563;margin:0 0 16px">Please submit your joining formalities online before your date of joining using the secure link below.</p>
${btn('&#10003;&nbsp; Complete Joining Formalities', esc(joiningUrl))}
<p style="text-align:center;font-size:11px;color:#9CA3AF;margin:0">Link valid until <strong>${expiresAt ? new Date(expiresAt).toDateString() : '7 days from now'}</strong> &mdash; do not share this link.</p>
<p style="font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:12px;margin-top:16px">The signed Offer Letter PDF is attached. Please bring a copy on your date of joining.</p>`;

  return {
    subject: `Offer Letter — ${jobTitle} at ${emailCfg.companyName || 'HRMS'}`,
    html: layout({ companyName, title: 'Congratulations! Your Offer Letter', subtitle: `Position: ${esc(jobTitle)}`, body }),
    text: `Congratulations ${candidateName}!\nOffer for ${jobTitle} at ${emailCfg.companyName || 'HRMS'}.\nComplete joining formalities at: ${joiningUrl}\nLink valid until: ${expiresAt ? new Date(expiresAt).toDateString() : '7 days from now'}`
  };
};

exports.joiningSubmittedHR = ({ candidateName, candidateEmail, jobTitle, companyName = '' }) => ({
  subject: `[${co(companyName)}] Joining Formalities Submitted — ${esc(candidateName)}`,
  html: layout({ companyName,
    title: 'Joining Formalities Submitted for Review',
    body: `
${greeting('Hi HR Team')}
${lead(`<strong>${esc(candidateName)}</strong> has submitted their joining formalities and is awaiting verification.`)}
${infoTable(`
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Email', candidateEmail)}
  ${infoRow('Position', jobTitle)}
  ${infoRow('Status', 'Pending Verification')}
`)}
${btn('Review Formalities', `${feUrl()}/dashboard/joining-verification`)}`
  }),
  text: `${candidateName} submitted joining formalities. Login to review.`
});

exports.joiningApproved = ({ candidateName, jobTitle, companyName = '' }) => ({
  subject: `[${co(companyName)}] Joining Formalities Approved — Welcome Aboard!`,
  html: layout({ companyName,
    title: 'Joining Formalities Approved — Welcome!',
    accent: '#16a34a',
    body: `
${greeting(candidateName)}
${lead(`Your joining formalities for <strong>${esc(jobTitle)}</strong> have been reviewed and ${badgeGreen('✓ Approved')}.`)}
<p style="font-size:14px;color:#4B5563;margin:0 0 12px">Your employee account will be activated shortly. You will receive login credentials from HR to access the employee portal.</p>
<p style="font-size:13px;color:#6B7280;margin:0">Welcome to the team! We look forward to working with you. If you have any questions before your start date, please contact HR.</p>`
  }),
  text: `Hi ${candidateName}, your joining formalities have been approved. Welcome aboard!`
});

exports.joiningChangesRequested = ({ candidateName, jobTitle, remarks, joiningUrl, companyName = '' }) => ({
  subject: `[${co(companyName)}] Action Required — Update Your Joining Formalities`,
  html: layout({ companyName,
    title: 'Updates Required — Joining Formalities',
    body: `
${greeting(candidateName)}
${lead(`HR has reviewed your joining formalities for <strong>${esc(jobTitle)}</strong> and has requested some updates before they can be approved.`)}
${remarksBox('HR Remarks', remarks || 'Please review and update the highlighted fields.')}
${btn('Update Formalities', esc(joiningUrl))}`
  }),
  text: `Hi ${candidateName}, HR has requested changes to your joining formalities. Update at: ${joiningUrl}`
});

exports.joiningRejected = ({ candidateName, jobTitle, remarks, companyName = '' }) => ({
  subject: `[${co(companyName)}] Joining Formalities — Important Update`,
  html: layout({ companyName,
    title: 'Joining Formalities — Status Update',
    accent: '#DC2626',
    body: `
${greeting(candidateName)}
${lead(`We regret to inform you that your joining formalities for <strong>${esc(jobTitle)}</strong> could not be processed at this time.`)}
${remarks ? remarksBox('HR Remarks', remarks) : ''}
<p style="font-size:14px;color:#4B5563;margin:0">Please contact HR directly for further information and next steps.</p>`
  }),
  text: `Hi ${candidateName}, your joining formalities for ${jobTitle} require attention. Please contact HR.`
});
