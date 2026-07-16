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

/* ── Recruiter Manager (Team Lead) Templates ─────────────────────────── */

exports.tlJobAssigned = ({ tlName, recruiterName, jobTitle, jobCode, client, vacancies, skillSet }) => ({
  subject: `[${co()}] Team Update — ${esc(recruiterName)} assigned to ${esc(jobTitle)}`,
  html: layout({
    title: 'Team Job Assignment',
    color: '#1E3A5F',
    body: `<p>Hi <strong>${esc(tlName)}</strong>,</p>
<p>A new job has been assigned to your team member <strong>${esc(recruiterName)}</strong>. Here are the details:</p>
<div class="info-box">
  ${infoRow('Job Title', jobTitle)}
  ${infoRow('Job Code', jobCode || '-')}
  ${infoRow('Client / Department', client || '-')}
  ${infoRow('Vacancies', String(vacancies || 1))}
  ${infoRow('Skills Required', skillSet || '-')}
  ${infoRow('Assigned To', recruiterName)}
</div>
<a href="${esc(feUrl() + '/recruitment')}" class="btn">View in HRMS</a>`,
  }),
  text: `Hi ${tlName}, job "${jobTitle}" has been assigned to your team member ${recruiterName}. Vacancies: ${vacancies || 1}.`,
});

exports.tlCandidateUpdate = ({ tlName, recruiterName, candidateName, jobTitle, status }) => ({
  subject: `[${co()}] Candidate ${esc(status)} — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({
    title: `Candidate ${esc(status)}`,
    color: status === 'Shortlisted' ? '#16a34a' : '#dc2626',
    body: `<p>Hi <strong>${esc(tlName)}</strong>,</p>
<p>Your team member <strong>${esc(recruiterName)}</strong> has updated a candidate status:</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Job Title', jobTitle)}
  ${infoRow('New Status', status)}
  ${infoRow('Updated By', recruiterName)}
</div>
<a href="${esc(feUrl() + '/recruitment')}" class="btn">View Candidate</a>`,
  }),
  text: `Hi ${tlName}, ${recruiterName} marked ${candidateName} as ${status} for ${jobTitle}.`,
});

/* ══════════════════════════════════════════════════════════════════════
   RECRUITMENT FLOW NOTIFICATION TEMPLATES (Steps 2 – 10)
══════════════════════════════════════════════════════════════════════ */

/** Step 2 — HR Manager: new candidate submitted by recruiter */
exports.candidateSubmittedToHR = ({ hrName, recruiterName, candidateName, jobTitle, candidateCode }) => ({
  subject: `[${co()}] New Candidate Submitted for Review — ${esc(jobTitle)}`,
  html: layout({
    title: 'New Candidate Submitted for Review',
    color: '#1E3A5F',
    body: `<p>Hi <strong>${esc(hrName)}</strong>,</p>
<p>Your recruiter <strong>${esc(recruiterName)}</strong> has submitted a new candidate for the following position:</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${candidateCode ? infoRow('Reference', candidateCode) : ''}
  ${infoRow('Position', jobTitle)}
  ${infoRow('Submitted By', recruiterName)}
</div>
<p>Please review the candidate profile and take appropriate action.</p>
<a href="${feUrl()}/recruitment/candidates" class="btn">Review Candidate</a>`,
  }),
  text: `Hi ${hrName}, ${recruiterName} submitted ${candidateName} for ${jobTitle}. Please review.`,
});

/** Steps 3 & 6 — Recruiter: candidate status changed by HR */
exports.candidateStatusToRecruiter = ({ recruiterName, candidateName, jobTitle, status }) => ({
  subject: `[${co()}] Candidate Status Updated — ${esc(candidateName)}`,
  html: layout({
    title: 'Candidate Status Updated',
    color: '#1E3A5F',
    body: `<p>Hi <strong>${esc(recruiterName)}</strong>,</p>
<p>The status of your candidate has been updated by HR.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${infoRow('New Status', status)}
</div>
<a href="${feUrl()}/recruitment/candidates" class="btn">View Candidate</a>`,
  }),
  text: `Hi ${recruiterName}, ${candidateName}'s status was updated to "${status}" for ${jobTitle}.`,
});

/** Steps 4 & 7 — Candidate: interview scheduled */
exports.interviewScheduledCandidate = ({ candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer }) => ({
  subject: `Interview Scheduled — ${esc(jobTitle)} at ${co()}`,
  html: layout({
    title: 'Your Interview Has Been Scheduled',
    color: '#1E3A5F',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>Your interview for the position of <strong>${esc(jobTitle)}</strong> at <strong>${co()}</strong> has been scheduled.</p>
<div class="info-box">
  ${infoRow('Position', jobTitle)}
  ${level ? infoRow('Round', level) : ''}
  ${infoRow('Date', interviewDate ? fmtDate(interviewDate) : '—')}
  ${interviewTime ? infoRow('Time', interviewTime) : ''}
  ${interviewType ? infoRow('Mode', interviewType) : ''}
  ${interviewer ? infoRow('Interviewer', interviewer) : ''}
</div>
<p>Please ensure you are available at the scheduled time. Best of luck!</p>`,
  }),
  text: `Dear ${candidateName}, your interview for ${jobTitle} at ${co()} is on ${interviewDate ? fmtDate(interviewDate) : '—'}${interviewTime ? ' at ' + interviewTime : ''}. Interviewer: ${interviewer || '—'}.`,
});

/** Steps 4 & 7 — HR Manager: interview scheduled notification */
exports.interviewScheduledHR = ({ hrName, candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer, scheduledByName }) => ({
  subject: `[${co()}] Interview Scheduled — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({
    title: 'Interview Scheduled',
    color: '#1E3A5F',
    body: `<p>Hi <strong>${esc(hrName)}</strong>,</p>
<p>An interview has been scheduled for a candidate on your team's pipeline.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${level ? infoRow('Round', level) : ''}
  ${infoRow('Date', interviewDate ? fmtDate(interviewDate) : '—')}
  ${interviewTime ? infoRow('Time', interviewTime) : ''}
  ${interviewType ? infoRow('Mode', interviewType) : ''}
  ${interviewer ? infoRow('Interviewer', interviewer) : ''}
  ${scheduledByName ? infoRow('Scheduled By', scheduledByName) : ''}
</div>
<a href="${feUrl()}/recruitment/interviews" class="btn">View Interview</a>`,
  }),
  text: `Hi ${hrName}, interview for ${candidateName} (${jobTitle}) on ${interviewDate ? fmtDate(interviewDate) : '—'}${interviewTime ? ' at ' + interviewTime : ''}.`,
});

/** Step 5 — HR Manager: interview feedback submitted */
exports.interviewFeedbackToHR = ({ hrName, candidateName, jobTitle, level, feedbackStatus, feedbackComments, interviewerName }) => ({
  subject: `[${co()}] Interview Feedback Received — ${esc(candidateName)}`,
  html: layout({
    title: 'Interview Feedback Submitted',
    color: '#1E3A5F',
    body: `<p>Hi <strong>${esc(hrName)}</strong>,</p>
<p>Interview feedback has been submitted for a candidate in your pipeline.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${level ? infoRow('Round', level) : ''}
  ${interviewerName ? infoRow('Interviewer', interviewerName) : ''}
  ${feedbackStatus ? infoRow('Outcome', feedbackStatus) : ''}
  ${feedbackComments ? infoRow('Comments', feedbackComments) : ''}
</div>
<a href="${feUrl()}/recruitment/interviews" class="btn">View Details</a>`,
  }),
  text: `Hi ${hrName}, feedback received for ${candidateName} (${jobTitle}). Outcome: ${feedbackStatus || '—'}.`,
});

/** Step 8 — Admin: candidate marked Selected */
exports.candidateSelectedAdmin = ({ candidateName, jobTitle, recruiterName }) => ({
  subject: `[${co()}] Candidate Selected — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({
    title: 'Candidate Selected — Offer Pending',
    color: '#16A34A',
    body: `<p>Hi Admin,</p>
<p>A candidate has been marked as <span class="badge green">Selected</span> and is ready for an offer letter.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${recruiterName ? infoRow('Sourced By', recruiterName) : ''}
  ${infoRow('Next Step', 'Please prepare and release an offer letter')}
</div>
<a href="${feUrl()}/recruitment/offers" class="btn">Create Offer</a>`,
  }),
  text: `${candidateName} has been selected for ${jobTitle} (sourced by ${recruiterName || '—'}). Please release an offer.`,
});

/** Step 9 — HR Manager: offer released */
exports.offerReleasedToHR = ({ hrName, candidateName, jobTitle, ctc, dateOfJoining }) => ({
  subject: `[${co()}] Offer Released — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({
    title: 'Offer Released',
    color: '#16A34A',
    body: `<p>Hi <strong>${esc(hrName)}</strong>,</p>
<p>An offer letter has been released to the following candidate.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${ctc ? infoRow('CTC', fmtINR(ctc)) : ''}
  ${dateOfJoining ? infoRow('Expected Joining', fmtDate(dateOfJoining)) : ''}
  ${infoRow('Status', 'Offer Sent — Awaiting Acceptance')}
</div>
<a href="${feUrl()}/recruitment/offers" class="btn">View Offer</a>`,
  }),
  text: `Hi ${hrName}, offer released to ${candidateName} for ${jobTitle}${ctc ? ' (CTC: ' + fmtINR(ctc) + ')' : ''}. Awaiting acceptance.`,
});

/** Step 10 — Admin: offer accepted */
exports.offerAcceptedAdmin = ({ candidateName, jobTitle, dateOfJoining }) => ({
  subject: `[${co()}] Offer Accepted — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({
    title: 'Offer Accepted ✓',
    color: '#16A34A',
    body: `<p>Hi Admin,</p>
<p><strong>${esc(candidateName)}</strong> has <span class="badge green">Accepted</span> the offer for <strong>${esc(jobTitle)}</strong>.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Position', jobTitle)}
  ${dateOfJoining ? infoRow('Expected Joining', fmtDate(dateOfJoining)) : ''}
  ${infoRow('Next Step', 'Initiate employee onboarding')}
</div>
<a href="${feUrl()}/recruitment/candidates" class="btn">View in HRMS</a>`,
  }),
  text: `${candidateName} has accepted the offer for ${jobTitle}.${dateOfJoining ? ' Expected joining: ' + fmtDate(dateOfJoining) : ''}`,
});

/* ── Recruiter Manager (Team Lead) Templates ──────────────────────────────────────── */

exports.tlOfferUpdate = ({ tlName, recruiterName, candidateName, jobTitle, event, ctc, dateOfJoining }) => ({
  subject: `[${co()}] Offer ${esc(event)} — ${esc(candidateName)} for ${esc(jobTitle)}`,
  html: layout({
    title: `Offer ${esc(event)}`,
    color: event === 'Accepted' ? '#16a34a' : event === 'Released' ? '#1E3A5F' : '#dc2626',
    body: `<p>Hi <strong>${esc(tlName)}</strong>,</p>
<p>An offer for a candidate sourced by your team has been <strong>${esc(event)}</strong>.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Job Title', jobTitle)}
  ${infoRow('Offer Status', event)}
  ${ctc ? infoRow('CTC', 'INR ' + Number(ctc).toLocaleString('en-IN')) : ''}
  ${dateOfJoining ? infoRow('Date of Joining', dateOfJoining) : ''}
</div>
<a href="${esc(feUrl() + '/recruitment')}" class="btn">View Offer</a>`,
  }),
  text: `Hi ${tlName}, offer for ${candidateName} (${jobTitle}) has been ${event}. CTC: ${ctc || '-'}.`,
});

/* ── Joining Formalities Templates ─────────────────────────────────────────── */

exports.joiningInvitation = ({
  candidateName, jobTitle, joiningUrl, expiresAt,
  ctc, ctcInWords, dateOfJoining, offerCode,
  basic = 0, hra = 0, telephoneAllowance = 0, specialAllowance = 0, grossSalary = 0,
  pfContribution = 0, statutoryBonus = 0, gratuity = 0, esi = 0,
}) => {
  /* All stored values are ANNUAL. Monthly = value / 12 */
  const ann = (v) => Number(v) || 0;
  const mon = (v) => Math.round((Number(v) || 0) / 12);
  const ctcAnnual = ann(ctc);
  const ctcLabel  = ctcAnnual ? fmtINR(ctcAnnual) + ' per annum' : '';

  /* CTC table row builders */
  const tblRow = (label, annVal) => {
    if (!annVal) return '';
    return `<tr>
      <td style="padding:6px 12px;border:1px solid #E5E7EB;font-size:12px;color:#374151">${esc(label)}</td>
      <td style="padding:6px 12px;border:1px solid #E5E7EB;font-size:12px;text-align:right;color:#111827">${fmtINR(mon(annVal))}</td>
      <td style="padding:6px 12px;border:1px solid #E5E7EB;font-size:12px;text-align:right;color:#111827">${fmtINR(ann(annVal))}</td>
    </tr>`;
  };
  const boldRow = (label, annVal) =>
    `<tr style="background:#EFF6FF;font-weight:700">
      <td style="padding:6px 12px;border:1px solid #BFDBFE;font-size:12px;color:#1E3A5F">${esc(label)}</td>
      <td style="padding:6px 12px;border:1px solid #BFDBFE;font-size:12px;text-align:right;color:#1E3A5F">${fmtINR(mon(annVal))}</td>
      <td style="padding:6px 12px;border:1px solid #BFDBFE;font-size:12px;text-align:right;color:#1E3A5F">${fmtINR(ann(annVal))}</td>
    </tr>`;

  const ctcTable = `
<table style="width:100%;border-collapse:collapse;margin:12px 0">
  <thead>
    <tr style="background:#1E3A5F">
      <th style="padding:8px 12px;text-align:left;color:#fff;font-size:12px;border:1px solid #1E3A5F">COMPONENTS</th>
      <th style="padding:8px 12px;text-align:right;color:#fff;font-size:12px;border:1px solid #1E3A5F">MONTHLY</th>
      <th style="padding:8px 12px;text-align:right;color:#fff;font-size:12px;border:1px solid #1E3A5F">YEARLY</th>
    </tr>
  </thead>
  <tbody>
    ${tblRow('Basic', basic)}
    ${tblRow('HRA', hra)}
    ${tblRow('Telephone / Internet Expenses', telephoneAllowance)}
    ${tblRow('Spl. Allowance', specialAllowance)}
    ${boldRow('Gross Salary', grossSalary)}
    ${tblRow("Company's PF Contribution", pfContribution)}
    ${Number(statutoryBonus) ? tblRow('Statutory Bonus', statutoryBonus) : ''}
    ${Number(gratuity)       ? tblRow('Gratuity', gratuity) : ''}
    ${Number(esi)            ? tblRow('ESI (Employer Share)', esi) : ''}
    ${boldRow('Cost To Company (CTC)', ctcAnnual)}
  </tbody>
</table>`;

  const body = `
<p style="margin:0 0 12px">Dear <strong>${esc(candidateName)}</strong>,</p>
<p style="margin:0 0 14px;color:#374151">
  We are pleased to offer you the position of <strong>${esc(jobTitle)}</strong> at <strong>${co()}</strong>.
  Your complete Offer Letter with all terms, conditions and CTC breakdown is <strong>attached as a PDF</strong>.
</p>

<div class="info-box">
  ${offerCode ? infoRow('Offer Reference', offerCode) : ''}
  ${dateOfJoining ? infoRow('Date of Joining', fmtDate(dateOfJoining)) : ''}
</div>

<p style="margin:20px 0 8px;font-weight:700;font-size:13px;color:#1E3A5F">COMPLETE YOUR JOINING FORMALITIES</p>
<p style="margin:0 0 12px;font-size:13px;color:#374151">
  Please submit your joining formalities online before your date of joining:
</p>

<div style="text-align:center;margin:24px 0 20px">
  <a href="${esc(joiningUrl)}"
     style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;
            padding:14px 40px;border-radius:6px;font-size:15px;font-weight:700;letter-spacing:.3px">
    &#10003;&nbsp;&nbsp;Complete Joining Formalities
  </a>
  <p style="margin:10px 0 0;font-size:11px;color:#9CA3AF">
    Link valid until <strong>${expiresAt ? new Date(expiresAt).toDateString() : '7 days from now'}</strong>.
    Do not share this link with anyone.
  </p>
</div>

<p style="font-size:12px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:12px;margin-top:8px">
  The Offer Letter PDF is attached. Please sign and return a copy on your date of joining.
</p>`;

  return {
    subject: `Offer Letter &mdash; ${jobTitle} at ${emailCfg.companyName || 'HRMS'}`,
    html: layout({ title: 'Congratulations! Your Offer Letter', color: '#1E3A5F', body }),
    text: `Congratulations ${candidateName}!\n\nOffer for ${jobTitle} at ${emailCfg.companyName || 'HRMS'}.\nCTC: ${ctcLabel}\nDate of Joining: ${dateOfJoining ? new Date(dateOfJoining).toDateString() : 'As agreed'}\n\nComplete joining formalities at: ${joiningUrl}\nLink valid until: ${expiresAt ? new Date(expiresAt).toDateString() : '7 days from now'}\n\nOffer Letter PDF is attached.`,
  };
};

exports.joiningSubmittedHR = ({ candidateName, candidateEmail, jobTitle }) => ({
  subject: `[${co()}] Joining Formalities Submitted — ${esc(candidateName)}`,
  html: layout({
    title: 'Joining Formalities Submitted for Review',
    color: '#1E3A5F',
    body: `<p>Hi HR Team,</p>
<p><strong>${esc(candidateName)}</strong> has submitted their joining formalities for review.</p>
<div class="info-box">
  ${infoRow('Candidate', candidateName)}
  ${infoRow('Email', candidateEmail)}
  ${infoRow('Position', jobTitle)}
  ${infoRow('Status', 'Pending Verification')}
</div>
<a href="${esc(feUrl() + '/dashboard/joining-verification')}" class="btn">Review Formalities</a>`,
  }),
  text: `${candidateName} has submitted joining formalities. Login to review.`,
});

exports.joiningApproved = ({ candidateName, jobTitle }) => ({
  subject: `[${co()}] Joining Formalities Approved — Welcome Aboard!`,
  html: layout({
    title: 'Joining Formalities Approved',
    color: '#16a34a',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>Your joining formalities for <strong>${esc(jobTitle)}</strong> have been reviewed and <strong>approved</strong>.</p>
<p>Your employee account will be activated shortly. You will receive login credentials from HR to access the employee portal.</p>
<p>Welcome to the team! We look forward to working with you.</p>
<p style="color:#888;font-size:12px">If you have questions, please contact HR.</p>`,
  }),
  text: `Hi ${candidateName}, your joining formalities have been approved. Welcome aboard!`,
});

exports.joiningChangesRequested = ({ candidateName, jobTitle, remarks, joiningUrl }) => ({
  subject: `[${co()}] Action Required — Update Your Joining Formalities`,
  html: layout({
    title: 'Updates Required for Joining Formalities',
    color: '#d97706',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>HR has reviewed your joining formalities for <strong>${esc(jobTitle)}</strong> and requires the following updates:</p>
<div class="info-box" style="border-left:4px solid #d97706">
  <p style="margin:0;color:#374151">${esc(remarks || 'Please review and update the highlighted fields.')}</p>
</div>
<p>Please click the link below to update and resubmit your formalities:</p>
<a href="${esc(joiningUrl)}" class="btn">Update Formalities</a>`,
  }),
  text: `Hi ${candidateName}, HR has requested changes to your joining formalities. Please update at: ${joiningUrl}`,
});

exports.joiningRejected = ({ candidateName, jobTitle, remarks }) => ({
  subject: `[${co()}] Joining Formalities — Important Update`,
  html: layout({
    title: 'Joining Formalities Status Update',
    color: '#dc2626',
    body: `<p>Dear <strong>${esc(candidateName)}</strong>,</p>
<p>We regret to inform you that your joining formalities for <strong>${esc(jobTitle)}</strong> could not be processed.</p>
${remarks ? `<div class="info-box"><p style="margin:0;color:#374151">${esc(remarks)}</p></div>` : ''}
<p>Please contact HR for further information.</p>`,
  }),
  text: `Hi ${candidateName}, there is an important update regarding your joining formalities for ${jobTitle}. Please contact HR.`,
});
