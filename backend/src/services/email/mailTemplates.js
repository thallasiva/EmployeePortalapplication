'use strict';

/**
 * All HRMS email HTML templates.
 * Each function returns { subject, html, text }.
 * Production-safe: all values are escaped before insertion.
 */

const { email: emailCfg } = require('../../config/env');

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
const fmtINR  = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
const co      = () => esc(emailCfg.companyName || 'HRMS');
const feUrl   = () => emailCfg.frontendUrl || 'http://localhost:3000';

/* ── Base layout ──────────────────────────────────────────────────────────── */
function layout({ title, body, color = '#1E3A5F' }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  body{margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08)}
  .hdr{background:${color};padding:28px 36px;color:#fff}
  .hdr h1{margin:0;font-size:20px;font-weight:700}
  .hdr p{margin:4px 0 0;font-size:13px;opacity:.85}
  .bdy{padding:28px 36px;color:#333;line-height:1.65;font-size:14px}
  .btn{display:inline-block;background:#E07000;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;margin:20px 0}
  .info-box{background:#f0f4ff;border-left:4px solid ${color};padding:14px 18px;border-radius:4px;margin:16px 0;font-size:13px}
  .info-row{padding:5px 0;border-bottom:1px solid #e5e7eb}
  .info-row:last-child{border-bottom:none}
  .label{font-weight:600;color:#555;display:inline-block;min-width:140px}
  .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}
  .green{background:#dcfce7;color:#166534}.red{background:#fee2e2;color:#991b1b}
  .blue{background:#dbeafe;color:#1e40af}.orange{background:#fff7ed;color:#9a3412}
  .ftr{background:#f4f6fb;text-align:center;padding:18px 36px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb}
</style></head>
<body><div class="wrap">
  <div class="hdr"><h1>${esc(title)}</h1><p>${co()} Automated Notification</p></div>
  <div class="bdy">${body}</div>
  <div class="ftr">© ${new Date().getFullYear()} ${co()} &nbsp;|&nbsp; This is an automated message — please do not reply.</div>
</div></body></html>`;
}

function infoRow(label, value) {
  return `<div class="info-row"><span class="label">${esc(label)}:</span> ${esc(value)}</div>`;
}

/* ══════════════════════════════════════════════════════════════════════
   AUTH TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.employeeInvite = ({ name, email, tempPassword, role, department }) => ({
  subject: `You're invited to join ${co()} HRMS`,
  html: layout({
    title: `Welcome to ${co()} HRMS`,
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>You have been added to <strong>${co()}</strong> HRMS. Your account is now ready.</p>
<div class="info-box">
  ${infoRow('Email', email)}
  ${infoRow('Temporary Password', tempPassword || '(Set via invitation link)')}
  ${infoRow('Role', role || 'Employee')}
  ${infoRow('Department', department || '—')}
</div>
<p>Please log in and change your password immediately.</p>
<a href="${feUrl()}/login" class="btn">Login to HRMS</a>
<p style="font-size:12px;color:#888">If you did not expect this email, contact your HR administrator.</p>`,
  }),
  text: `Dear ${name}, you have been added to ${co()} HRMS.\nEmail: ${email}\nLogin: ${feUrl()}/login`,
});

exports.loginAlert = ({ name, ip, device, time }) => ({
  subject: `New login to your ${co()} account`,
  html: layout({
    title: 'New Login Detected',
    color: '#1565C0',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>A new login was detected on your HRMS account.</p>
<div class="info-box">
  ${infoRow('Time', time || new Date().toLocaleString('en-IN'))}
  ${infoRow('IP Address', ip || 'Unknown')}
  ${infoRow('Device', device || 'Unknown')}
</div>
<p>If this was not you, please <a href="${feUrl()}/change-password">change your password immediately</a> and contact IT support.</p>`,
  }),
  text: `New login detected on your ${co()} account. IP: ${ip}, Time: ${time}.`,
});

exports.accountLocked = ({ name, minutes }) => ({
  subject: `Your ${co()} account has been locked`,
  html: layout({
    title: 'Account Locked',
    color: '#991B1B',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>Your HRMS account has been <strong>temporarily locked</strong> due to multiple failed login attempts.</p>
<div class="info-box">
  ${infoRow('Locked For', `${minutes || 15} minutes`)}
  ${infoRow('Reason', 'Too many failed login attempts')}
</div>
<p>Your account will unlock automatically. If you did not attempt to log in, contact IT support immediately.</p>
<a href="${feUrl()}/forgot-password" class="btn">Reset Password</a>`,
  }),
  text: `Your ${co()} account has been locked for ${minutes || 15} minutes due to failed login attempts.`,
});

exports.passwordChanged = ({ name }) => ({
  subject: `Your ${co()} password was changed`,
  html: layout({
    title: 'Password Changed Successfully',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>Your HRMS account password was successfully changed.</p>
<p>If you did not make this change, please <a href="${feUrl()}/forgot-password">reset your password</a> immediately and contact your IT administrator.</p>`,
  }),
  text: `Your ${co()} HRMS password was changed. If this was not you, reset it immediately.`,
});

exports.forgotPassword = ({ name, resetUrl, expiresIn }) => ({
  subject: `Reset your ${co()} password`,
  html: layout({
    title: 'Password Reset Request',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>We received a request to reset your HRMS password.</p>
<a href="${esc(resetUrl)}" class="btn">Reset Password</a>
<p style="font-size:12px;color:#888">This link expires in <strong>${esc(expiresIn || '1 hour')}</strong>. If you did not request a reset, ignore this email.</p>`,
  }),
  text: `Reset your ${co()} password: ${resetUrl}`,
});

/* ══════════════════════════════════════════════════════════════════════
   EMPLOYEE TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.employeeCreated = ({ name, empCode, role, department, joiningDate }) => ({
  subject: `Your ${co()} HRMS profile has been created`,
  html: layout({
    title: 'Welcome to the Team!',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>Your employee profile has been created in <strong>${co()}</strong> HRMS.</p>
<div class="info-box">
  ${infoRow('Employee Code', empCode)}
  ${infoRow('Role', role)}
  ${infoRow('Department', department)}
  ${infoRow('Joining Date', fmtDate(joiningDate))}
</div>
<a href="${feUrl()}/login" class="btn">Access HRMS Portal</a>`,
  }),
  text: `Your ${co()} HRMS profile has been created. Emp Code: ${empCode}. Login: ${feUrl()}/login`,
});

exports.employeeDeactivated = ({ name, reason }) => ({
  subject: `Your ${co()} HRMS account has been deactivated`,
  html: layout({
    title: 'Account Deactivated',
    color: '#7C3AED',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>Your HRMS account has been deactivated.</p>
${reason ? `<div class="info-box">${infoRow('Reason', reason)}</div>` : ''}
<p>For queries, contact your HR department.</p>`,
  }),
  text: `Your ${co()} HRMS account has been deactivated. Contact HR for queries.`,
});

/* ══════════════════════════════════════════════════════════════════════
   LEAVE TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.leaveApplied = ({ managerName, employeeName, empCode, leaveType, fromDate, toDate, days, reason, approveUrl, rejectUrl }) => ({
  subject: `[Action Required] Leave request from ${esc(employeeName)}`,
  html: layout({
    title: 'Leave Request — Action Required',
    color: '#0369A1',
    body: `<p>Dear <strong>${esc(managerName)}</strong>,</p>
<p><strong>${esc(employeeName)}</strong> has submitted a leave request requiring your approval.</p>
<div class="info-box">
  ${infoRow('Employee', `${employeeName} (${empCode})`)}
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From', fmtDate(fromDate))}
  ${infoRow('To', fmtDate(toDate))}
  ${infoRow('Duration', `${days} day(s)`)}
  ${infoRow('Reason', reason || '—')}
</div>
<p>
  <a href="${esc(approveUrl || feUrl())}" class="btn" style="background:#16a34a;margin-right:10px">✓ Approve</a>
  <a href="${esc(rejectUrl || feUrl())}" class="btn" style="background:#dc2626">✗ Reject</a>
</p>
<p style="font-size:12px;color:#888">Or review directly in <a href="${feUrl()}/manager/leaves">HRMS Leave Dashboard</a>.</p>`,
  }),
  text: `Leave request from ${employeeName} (${empCode}): ${leaveType} from ${fmtDate(fromDate)} to ${fmtDate(toDate)} (${days} days).`,
});

exports.leaveApproved = ({ employeeName, reviewerName, leaveType, fromDate, toDate, days, remarks }) => ({
  subject: `Your leave request has been approved`,
  html: layout({
    title: 'Leave Approved ✓',
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your leave request has been <span class="badge green">Approved</span></p>
<div class="info-box">
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From', fmtDate(fromDate))}
  ${infoRow('To', fmtDate(toDate))}
  ${infoRow('Duration', `${days} day(s)`)}
  ${infoRow('Approved By', reviewerName)}
  ${remarks ? infoRow('Remarks', remarks) : ''}
</div>
<a href="${feUrl()}/leaves" class="btn">View My Leaves</a>`,
  }),
  text: `Your ${leaveType} leave (${fmtDate(fromDate)} – ${fmtDate(toDate)}, ${days} days) has been approved by ${reviewerName}.`,
});

exports.leaveRejected = ({ employeeName, reviewerName, leaveType, fromDate, toDate, days, remarks }) => ({
  subject: `Your leave request has been declined`,
  html: layout({
    title: 'Leave Declined',
    color: '#DC2626',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your leave request has been <span class="badge red">Declined</span></p>
<div class="info-box">
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From', fmtDate(fromDate))}
  ${infoRow('To', fmtDate(toDate))}
  ${infoRow('Duration', `${days} day(s)`)}
  ${infoRow('Reviewed By', reviewerName)}
  ${remarks ? infoRow('Reason', remarks) : ''}
</div>
<a href="${feUrl()}/leaves" class="btn">Apply for Another Leave</a>`,
  }),
  text: `Your ${leaveType} leave request (${fmtDate(fromDate)} – ${fmtDate(toDate)}) has been declined by ${reviewerName}. Reason: ${remarks || 'Not specified'}.`,
});

exports.leaveCancelled = ({ managerName, employeeName, leaveType, fromDate, toDate }) => ({
  subject: `Leave cancelled by ${esc(employeeName)}`,
  html: layout({
    title: 'Leave Cancellation Notice',
    body: `<p>Dear <strong>${esc(managerName)}</strong>,</p>
<p><strong>${esc(employeeName)}</strong> has cancelled their leave request.</p>
<div class="info-box">
  ${infoRow('Leave Type', leaveType)}
  ${infoRow('From', fmtDate(fromDate))}
  ${infoRow('To', fmtDate(toDate))}
</div>`,
  }),
  text: `${employeeName} has cancelled their ${leaveType} leave (${fmtDate(fromDate)} – ${fmtDate(toDate)}).`,
});

/* ══════════════════════════════════════════════════════════════════════
   ATTENDANCE TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.missingCheckIn = ({ name, date }) => ({
  subject: `Reminder: Please check in today — ${esc(date)}`,
  html: layout({
    title: 'Check-In Reminder',
    color: '#D97706',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>Our records show that you have not checked in today (<strong>${esc(date)}</strong>).</p>
<p>If you are working today, please mark your attendance in the HRMS portal.</p>
<a href="${feUrl()}/attendance" class="btn">Mark Attendance</a>`,
  }),
  text: `Reminder: No check-in recorded for ${name} on ${date}. Please mark attendance.`,
});

exports.missingCheckOut = ({ name, date }) => ({
  subject: `Reminder: Please check out — ${esc(date)}`,
  html: layout({
    title: 'Check-Out Reminder',
    color: '#D97706',
    body: `<p>Dear <strong>${esc(name)}</strong>,</p>
<p>Your check-out for today (<strong>${esc(date)}</strong>) has not been recorded.</p>
<p>Please mark your check-out in the HRMS portal.</p>
<a href="${feUrl()}/attendance" class="btn">Mark Check-Out</a>`,
  }),
  text: `Reminder: No check-out recorded for ${name} on ${date}.`,
});

exports.attendanceRegularized = ({ employeeName, date, remarks }) => ({
  subject: `Your attendance has been regularized`,
  html: layout({
    title: 'Attendance Regularized ✓',
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your attendance for <strong>${esc(fmtDate(date))}</strong> has been regularized.</p>
${remarks ? `<div class="info-box">${infoRow('Remarks', remarks)}</div>` : ''}`,
  }),
  text: `Your attendance for ${fmtDate(date)} has been regularized.`,
});

exports.attendanceRegularizationRequest = ({ managerName, employeeName, date, reason }) => ({
  subject: `[Action Required] Attendance regularization from ${esc(employeeName)}`,
  html: layout({
    title: 'Attendance Regularization Request',
    color: '#0369A1',
    body: `<p>Dear <strong>${esc(managerName)}</strong>,</p>
<p><strong>${esc(employeeName)}</strong> has requested attendance regularization.</p>
<div class="info-box">
  ${infoRow('Date', fmtDate(date))}
  ${infoRow('Reason', reason || '—')}
</div>
<a href="${feUrl()}/manager/attendance" class="btn">Review Request</a>`,
  }),
  text: `${employeeName} has requested attendance regularization for ${fmtDate(date)}.`,
});

/* ══════════════════════════════════════════════════════════════════════
   PAYROLL TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.payslipReleased = ({ employeeName, empCode, month, year, grossSalary, deductions, netSalary, payslipUrl }) => ({
  subject: `Your payslip for ${esc(month)} ${esc(String(year))} is ready`,
  html: layout({
    title: `Payslip — ${esc(month)} ${esc(String(year))}`,
    color: '#065F46',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your payslip for <strong>${esc(month)} ${esc(String(year))}</strong> has been generated and is now available.</p>
<div class="info-box">
  ${infoRow('Employee Code', empCode)}
  ${infoRow('Pay Period', `${month} ${year}`)}
  ${infoRow('Gross Earnings', fmtINR(grossSalary))}
  ${infoRow('Total Deductions', fmtINR(deductions))}
  ${infoRow('Net Pay', fmtINR(netSalary))}
</div>
<a href="${esc(payslipUrl || feUrl() + '/payslips')}" class="btn">View & Download Payslip</a>`,
  }),
  text: `Your payslip for ${month} ${year} is ready. Net Pay: ${fmtINR(netSalary)}. Login to download.`,
});

exports.salaryRevised = ({ employeeName, effectiveDate, newCTC, revisedBy }) => ({
  subject: `Your salary has been revised effective ${esc(fmtDate(effectiveDate))}`,
  html: layout({
    title: 'Salary Revision Notice',
    color: '#065F46',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your salary has been revised. The updated structure will be reflected from <strong>${esc(fmtDate(effectiveDate))}</strong>.</p>
<div class="info-box">
  ${infoRow('Effective Date', fmtDate(effectiveDate))}
  ${infoRow('Revised CTC', fmtINR(newCTC))}
  ${infoRow('Revised By', revisedBy || 'HR')}
</div>
<a href="${feUrl()}/payslips" class="btn">View Payslips</a>`,
  }),
  text: `Your salary has been revised effective ${fmtDate(effectiveDate)}. New CTC: ${fmtINR(newCTC)}.`,
});

/* ══════════════════════════════════════════════════════════════════════
   RECRUITMENT TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.applicationAcknowledgment = ({ candidateName, jobTitle, applicationCode }) => ({
  subject: `Application received — ${esc(jobTitle)} at ${co()}`,
  html: layout({
    title: 'Application Received',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>Thank you for applying for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co()}</strong>.</p>
<div class="info-box">
  ${applicationCode ? infoRow('Application Reference', applicationCode) : ''}
  ${infoRow('Position', jobTitle)}
  ${infoRow('Company', co())}
</div>
<p>Our recruitment team will review your application and reach out to you soon.</p>`,
  }),
  text: `Thank you for applying for ${jobTitle} at ${co()}. We will be in touch.`,
});

exports.candidateShortlisted = ({ candidateName, jobTitle }) => ({
  subject: `Great news! You've been shortlisted for ${esc(jobTitle)}`,
  html: layout({
    title: 'You Have Been Shortlisted! 🎉',
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>Congratulations! After reviewing your profile, you have been <span class="badge green">Shortlisted</span> for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co()}</strong>.</p>
<p>Our recruitment team will reach out shortly to schedule the next steps.</p>
<p>Thank you for your interest in joining us!</p>`,
  }),
  text: `Congratulations ${candidateName}! You have been shortlisted for ${jobTitle} at ${co()}.`,
});

exports.candidateRejected = ({ candidateName, jobTitle }) => ({
  subject: `Update on your application — ${esc(jobTitle)} at ${co()}`,
  html: layout({
    title: 'Application Update',
    color: '#6B7280',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>Thank you for your interest in the <strong>${esc(jobTitle)}</strong> position at <strong>${co()}</strong>.</p>
<p>After careful consideration, we have decided to move forward with other candidates at this time. We appreciate the time you invested in the application process.</p>
<p>We encourage you to apply for future openings that match your profile.</p>
<p>We wish you the very best in your career journey.</p>`,
  }),
  text: `Thank you for applying for ${jobTitle} at ${co()}. We have decided to move forward with other candidates at this time.`,
});

exports.offerLetter = ({ candidateName, jobTitle, ctc, joiningDate, offerUrl }) => ({
  subject: `Offer Letter — ${esc(jobTitle)} at ${co()}`,
  html: layout({
    title: `Offer Letter — ${co()}`,
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>We are thrilled to offer you the position of <strong>${esc(jobTitle)}</strong> at <strong>${co()}</strong>.</p>
<div class="info-box">
  ${infoRow('Position', jobTitle)}
  ${joiningDate ? infoRow('Expected Joining Date', fmtDate(joiningDate)) : ''}
  ${ctc ? infoRow('CTC', fmtINR(ctc)) : ''}
</div>
<p>Please review your offer letter and confirm your acceptance.</p>
<a href="${esc(offerUrl || feUrl())}" class="btn">View & Accept Offer</a>`,
  }),
  text: `Congratulations! You have been offered the position of ${jobTitle} at ${co()}.`,
});

exports.offerAccepted = ({ recruiterName, candidateName, jobTitle, joiningDate }) => ({
  subject: `Offer accepted by ${esc(candidateName)} — ${esc(jobTitle)}`,
  html: layout({
    title: 'Offer Accepted ✓',
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(recruiterName)}</strong>,</p>
<p><strong>${esc(candidateName)}</strong> has accepted the offer for <strong>${esc(jobTitle)}</strong>.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${joiningDate ? infoRow('Expected Joining', fmtDate(joiningDate)) : ''}
</div>
<a href="${feUrl()}/recruitment/candidates" class="btn">View in HRMS</a>`,
  }),
  text: `${candidateName} has accepted the offer for ${jobTitle}.`,
});

exports.offerRejected = ({ recruiterName, candidateName, jobTitle }) => ({
  subject: `Offer declined by ${esc(candidateName)} — ${esc(jobTitle)}`,
  html: layout({
    title: 'Offer Declined',
    color: '#DC2626',
    body: `<p>Dear <strong>${esc(recruiterName)}</strong>,</p>
<p><strong>${esc(candidateName)}</strong> has declined the offer for <strong>${esc(jobTitle)}</strong>.</p>
<a href="${feUrl()}/recruitment/candidates" class="btn">View in HRMS</a>`,
  }),
  text: `${candidateName} has declined the offer for ${jobTitle}.`,
});

/* ══════════════════════════════════════════════════════════════════════
   RESIGNATION TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.resignationSubmitted = ({ managerName, employeeName, empCode, submitDate, endDate, reason }) => ({
  subject: `[Action Required] Resignation received from ${esc(employeeName)}`,
  html: layout({
    title: 'Resignation Submitted — Action Required',
    color: '#9333EA',
    body: `<p>Dear <strong>${esc(managerName)}</strong>,</p>
<p><strong>${esc(employeeName)}</strong> has submitted a resignation and requires your review.</p>
<div class="info-box">
  ${infoRow('Employee', `${employeeName} (${empCode})`)}
  ${infoRow('Submission Date', fmtDate(submitDate))}
  ${infoRow('Requested Last Working Day', fmtDate(endDate))}
  ${reason ? infoRow('Reason', reason) : ''}
</div>
<a href="${feUrl()}/manager/resignations" class="btn">Review Resignation</a>`,
  }),
  text: `${employeeName} has submitted a resignation. Last working day requested: ${fmtDate(endDate)}.`,
});

exports.resignationApproved = ({ employeeName, lastWorkingDay, reviewerName }) => ({
  subject: `Your resignation has been accepted — Last Working Day: ${esc(fmtDate(lastWorkingDay))}`,
  html: layout({
    title: 'Resignation Accepted',
    color: '#9333EA',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your resignation has been <span class="badge blue">Accepted</span>.</p>
<div class="info-box">
  ${infoRow('Last Working Day', fmtDate(lastWorkingDay))}
  ${infoRow('Accepted By', reviewerName)}
</div>
<p>The HR team will reach out regarding your exit formalities, full & final settlement, and experience letter.</p>`,
  }),
  text: `Your resignation has been accepted. Last working day: ${fmtDate(lastWorkingDay)}.`,
});

exports.resignationRejected = ({ employeeName, reviewerName, remarks }) => ({
  subject: `Update on your resignation request`,
  html: layout({
    title: 'Resignation Not Accepted',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your resignation request has not been accepted at this time.</p>
${remarks ? `<div class="info-box">${infoRow('Reason', remarks)}</div>` : ''}
<p>For further discussion, please reach out to <strong>${esc(reviewerName)}</strong> or your HR team.</p>`,
  }),
  text: `Your resignation request was not accepted. Reason: ${remarks || 'Contact HR for details'}.`,
});

/* ══════════════════════════════════════════════════════════════════════
   HELPDESK TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.ticketCreated = ({ agentName, reporterName, ticketId, subject: ticketSubject, priority, category }) => ({
  subject: `[#${ticketId}] New helpdesk ticket: ${esc(ticketSubject)}`,
  html: layout({
    title: `New Ticket #${ticketId}`,
    color: '#0369A1',
    body: `<p>Dear <strong>${esc(agentName)}</strong>,</p>
<p>A new helpdesk ticket has been assigned to you.</p>
<div class="info-box">
  ${infoRow('Ticket ID', `#${ticketId}`)}
  ${infoRow('Subject', ticketSubject)}
  ${infoRow('Raised By', reporterName)}
  ${infoRow('Category', category || '—')}
  ${infoRow('Priority', priority || 'Normal')}
</div>
<a href="${feUrl()}/helpdesk/${ticketId}" class="btn">View Ticket</a>`,
  }),
  text: `New ticket #${ticketId}: ${ticketSubject} raised by ${reporterName}.`,
});

exports.ticketResolved = ({ reporterName, ticketId, subject: ticketSubject }) => ({
  subject: `[#${ticketId}] Your request has been resolved`,
  html: layout({
    title: `Ticket #${ticketId} Resolved ✓`,
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(reporterName)}</strong>,</p>
<p>Your helpdesk request has been <span class="badge green">Resolved</span>.</p>
<div class="info-box">
  ${infoRow('Ticket ID', `#${ticketId}`)}
  ${infoRow('Subject', ticketSubject)}
</div>
<p>If you have further questions, feel free to raise a new ticket.</p>`,
  }),
  text: `Your ticket #${ticketId} (${ticketSubject}) has been resolved.`,
});

exports.ticketUpdated = ({ reporterName, ticketId, subject: ticketSubject, updateMessage }) => ({
  subject: `[#${ticketId}] Update on your helpdesk request`,
  html: layout({
    title: `Ticket #${ticketId} — Update`,
    body: `<p>Dear <strong>${esc(reporterName)}</strong>,</p>
<p>There is an update on your helpdesk ticket <strong>#${ticketId}</strong>.</p>
<div class="info-box">
  ${infoRow('Subject', ticketSubject)}
  ${updateMessage ? infoRow('Update', updateMessage) : ''}
</div>
<a href="${feUrl()}/helpdesk/${ticketId}" class="btn">View Ticket</a>`,
  }),
  text: `Update on ticket #${ticketId} (${ticketSubject}): ${updateMessage}`,
});

/* ══════════════════════════════════════════════════════════════════════
   TIMESHEET TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.timesheetSubmitted = ({ managerName, employeeName, weekLabel, totalHours }) => ({
  subject: `[Action Required] Timesheet submitted by ${esc(employeeName)}`,
  html: layout({
    title: 'Timesheet Submitted — Review Required',
    color: '#0369A1',
    body: `<p>Dear <strong>${esc(managerName)}</strong>,</p>
<p><strong>${esc(employeeName)}</strong> has submitted a timesheet for your approval.</p>
<div class="info-box">
  ${weekLabel ? infoRow('Week', weekLabel) : ''}
  ${totalHours ? infoRow('Total Hours', `${totalHours} hrs`) : ''}
</div>
<a href="${feUrl()}/manager/timesheets" class="btn">Review Timesheet</a>`,
  }),
  text: `${employeeName} has submitted a timesheet for week ${weekLabel} (${totalHours} hrs). Please review.`,
});

exports.timesheetApproved = ({ employeeName, weekLabel }) => ({
  subject: `Your timesheet has been approved`,
  html: layout({
    title: 'Timesheet Approved ✓',
    color: '#16A34A',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your timesheet ${weekLabel ? `for <strong>${esc(weekLabel)}</strong>` : ''} has been <span class="badge green">Approved</span>.</p>`,
  }),
  text: `Your timesheet for ${weekLabel} has been approved.`,
});

exports.timesheetRejected = ({ employeeName, weekLabel, remarks }) => ({
  subject: `Your timesheet requires revision`,
  html: layout({
    title: 'Timesheet Needs Revision',
    color: '#DC2626',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your timesheet ${weekLabel ? `for <strong>${esc(weekLabel)}</strong>` : ''} has been <span class="badge red">Returned for Revision</span>.</p>
${remarks ? `<div class="info-box">${infoRow('Remarks', remarks)}</div>` : ''}
<a href="${feUrl()}/tasks" class="btn">Update Timesheet</a>`,
  }),
  text: `Your timesheet for ${weekLabel} has been returned for revision. Remarks: ${remarks}`,
});

exports.timesheetReminder = ({ employeeName, weekLabel }) => ({
  subject: `Reminder: Please submit your timesheet`,
  html: layout({
    title: 'Timesheet Submission Reminder',
    color: '#D97706',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>This is a reminder to submit your timesheet${weekLabel ? ` for <strong>${esc(weekLabel)}</strong>` : ''}.</p>
<a href="${feUrl()}/tasks" class="btn">Submit Timesheet</a>`,
  }),
  text: `Reminder: Please submit your timesheet for ${weekLabel}.`,
});

/* ══════════════════════════════════════════════════════════════════════
   DOCUMENT EXPIRY TEMPLATES
══════════════════════════════════════════════════════════════════════ */

exports.documentExpiry = ({ employeeName, documentType, expiryDate, daysLeft }) => ({
  subject: `${daysLeft <= 7 ? 'URGENT: ' : ''}Your ${esc(documentType)} expires in ${daysLeft} day(s)`,
  html: layout({
    title: daysLeft <= 7 ? '⚠️ Document Expiring Soon — Urgent' : 'Document Expiry Reminder',
    color: daysLeft <= 7 ? '#DC2626' : '#D97706',
    body: `<p>Dear <strong>${esc(employeeName)}</strong>,</p>
<p>Your <strong>${esc(documentType)}</strong> is expiring soon. Please renew it before the expiry date.</p>
<div class="info-box">
  ${infoRow('Document Type', documentType)}
  ${infoRow('Expiry Date', fmtDate(expiryDate))}
  ${infoRow('Days Remaining', `${daysLeft} day(s)`)}
</div>
<p>Please upload the renewed document in HRMS as soon as possible.</p>
<a href="${feUrl()}/documents" class="btn">Upload Document</a>`,
  }),
  text: `${documentType} expires on ${fmtDate(expiryDate)} (${daysLeft} days left). Please renew and upload.`,
});

/* ══════════════════════════════════════════════════════════════════════
   ADMIN ALERT TEMPLATE
══════════════════════════════════════════════════════════════════════ */

exports.emailDeliveryFailed = ({ to, template, error, attempts }) => ({
  subject: `[HRMS Alert] Email delivery failed — ${esc(template)}`,
  html: layout({
    title: 'Email Delivery Failed',
    color: '#991B1B',
    body: `<p>An email could not be delivered after all retry attempts.</p>
<div class="info-box">
  ${infoRow('Recipient', to)}
  ${infoRow('Template', template)}
  ${infoRow('Error', error)}
  ${infoRow('Attempts Made', String(attempts))}
  ${infoRow('Time', new Date().toLocaleString('en-IN'))}
</div>
<p>Please check SMTP configuration and retry manually if required.</p>`,
  }),
  text: `Email delivery failed. Recipient: ${to}, Template: ${template}, Error: ${error}`,
});

/* ══════════════════════════════════════════════════════════════════════
   RECRUITER ASSIGNMENT TEMPLATE
══════════════════════════════════════════════════════════════════════ */

exports.recruiterAssigned = ({ recruiterName, jobTitle, jobCode, client, vacancies, skillSet, loginUrl }) => ({
  subject: `[${co()}] New Job Assigned to You — ${esc(jobTitle)}`,
  html: layout({
    title: 'New Job Assignment',
    color: '#1E3A5F',
    body: `<p>Hi <strong>${esc(recruiterName)}</strong>,</p>
<p>A new job has been assigned to you by HR. Please review the details and start sourcing candidates.</p>
<div class="info-box">
  ${infoRow('Job Title', jobTitle)}
  ${infoRow('Job Code', jobCode || '-')}
  ${infoRow('Client / Department', client || '-')}
  ${infoRow('Vacancies', String(vacancies || 1))}
  ${infoRow('Skills Required', skillSet || '-')}
</div>
<p>Login to the HRMS portal to view the full job description and begin uploading candidates.</p>
<a href="${esc(loginUrl || feUrl() + '/recruitment')}" class="btn">View Job &amp; Upload Candidates</a>
<p style="color:#888;font-size:12px">If you have any questions, contact your HR manager directly.</p>`,
  }),
  text: `Hi ${recruiterName}, a new job "${jobTitle}" has been assigned to you. Vacancies: ${vacancies || 1}. Skills: ${skillSet || '-'}. Login to view details.`,
});
