'use strict';

/**
 * HRMS Mail Notification Service
 *
 * Central hub for all email notifications.
 * Every function is fire-and-forget — never throws, never blocks requests.
 *
 * Usage:
 *   const notify = require('./mailNotify.service');
 *   notify.leaveApplied({ employeeEmail, managerEmail, ... });  // non-blocking
 */

const { sendMail, sendMailNow, sendBulk } = require('./email.service');
const T = require('./email/mailTemplates');
const { email: emailCfg } = require('../config/env');

/* ── helpers ──────────────────────────────────────────────────────────────── */

/**
 * Fire-and-forget wrapper — swallows all errors so callers are never affected.
 */
function fire(fn) {
  Promise.resolve().then(fn).catch((err) => {
    console.error('[mailNotify] Uncaught error (non-fatal):', err.message);
  });
}

function adminEmail() { return emailCfg.adminAlert || null; }

/* ══════════════════════════════════════════════════════════════════════
   AUTH NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Sent when a new employee account is created.
 */
exports.employeeInvite = ({ name, email, tempPassword, role, department }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.employeeInvite({ name, email, tempPassword, role, department });
    await sendMailNow({ to: email, ...tpl, template: 'auth/invite', priority: 'high' });
  });
};

/**
 * Sent after a failed login causes account lockout.
 */
exports.accountLocked = ({ name, email, minutes }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.accountLocked({ name, minutes });
    await sendMailNow({ to: email, ...tpl, template: 'auth/account-locked', priority: 'critical' });
  });
};

/**
 * Sent on successful password change.
 */
exports.passwordChanged = ({ name, email }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.passwordChanged({ name });
    await sendMail({ to: email, ...tpl, template: 'auth/password-changed', priority: 'high' });
  });
};

/**
 * Sent on password reset request.
 */
exports.forgotPassword = ({ name, email, resetUrl, expiresIn }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.forgotPassword({ name, resetUrl, expiresIn });
    await sendMailNow({ to: email, ...tpl, template: 'auth/forgot-password', priority: 'critical' });
  });
};

/**
 * Sent on login from a new IP/device.
 */
exports.loginAlert = ({ name, email, ip, device, time }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.loginAlert({ name, ip, device, time });
    await sendMail({ to: email, ...tpl, template: 'auth/login-alert', priority: 'high' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   EMPLOYEE NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Sent when a new employee profile is created.
 */
exports.employeeCreated = ({ name, email, empCode, role, department, joiningDate }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.employeeCreated({ name, empCode, role, department, joiningDate });
    await sendMail({ to: email, ...tpl, template: 'employee/created', priority: 'high' });
  });
};

/**
 * Sent when an employee account is deactivated.
 */
exports.employeeDeactivated = ({ name, email, reason }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.employeeDeactivated({ name, reason });
    await sendMail({ to: email, ...tpl, template: 'employee/deactivated', priority: 'high' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   LEAVE NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Notify manager when employee applies for leave.
 * @param {{ managerEmail, managerName, employeeName, empCode, leaveType, fromDate, toDate, days, reason, leaveRequestId }} data
 */
exports.leaveApplied = (data) => {
  if (!data.managerEmail) return;
  const { leaveRequestId } = data;
  const feUrl = emailCfg.frontendUrl || 'http://localhost:3000';
  fire(async () => {
    const tpl = T.leaveApplied({
      ...data,
      approveUrl: `${feUrl}/manager/leaves?action=approve&id=${leaveRequestId}`,
      rejectUrl:  `${feUrl}/manager/leaves?action=reject&id=${leaveRequestId}`,
    });
    await sendMail({ to: data.managerEmail, ...tpl, template: 'leave/applied', priority: 'high' });
  });
};

/**
 * Notify employee when leave is approved.
 */
exports.leaveApproved = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.leaveApproved(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'leave/approved', priority: 'high' });
  });
};

/**
 * Notify employee when leave is rejected.
 */
exports.leaveRejected = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.leaveRejected(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'leave/rejected', priority: 'high' });
  });
};

/**
 * Notify manager when employee cancels leave.
 */
exports.leaveCancelled = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.leaveCancelled(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'leave/cancelled', priority: 'medium' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   ATTENDANCE NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Sent via cron to employees who haven't checked in.
 * @param {Array<{name, email}>} employees
 * @param {string} date
 */
exports.missingCheckInBulk = (employees, date) => {
  fire(async () => {
    const jobs = employees
      .filter((e) => e.email)
      .map((e) => {
        const tpl = T.missingCheckIn({ name: e.name || e.first_name, date });
        return { to: e.email, ...tpl, template: 'attendance/missing-checkin', priority: 'medium' };
      });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Missing check-in alerts queued: ${jobs.length}`);
  });
};

/**
 * Sent via cron to employees who haven't checked out.
 */
exports.missingCheckOutBulk = (employees, date) => {
  fire(async () => {
    const jobs = employees
      .filter((e) => e.email)
      .map((e) => {
        const tpl = T.missingCheckOut({ name: e.name || e.first_name, date });
        return { to: e.email, ...tpl, template: 'attendance/missing-checkout', priority: 'medium' };
      });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Missing check-out alerts queued: ${jobs.length}`);
  });
};

/**
 * Notify manager of attendance regularization request.
 */
exports.attendanceRegularizationRequest = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.attendanceRegularizationRequest(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'attendance/reg-request', priority: 'high' });
  });
};

/**
 * Notify employee that attendance was regularized.
 */
exports.attendanceRegularized = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.attendanceRegularized(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'attendance/regularized', priority: 'high' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   PAYROLL NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Send payslip notification to a single employee.
 */
exports.payslipReleased = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.payslipReleased({
      ...data,
      payslipUrl: `${emailCfg.frontendUrl || 'http://localhost:3000'}/payslips`,
    });
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'payroll/payslip', priority: 'medium' });
  });
};

/**
 * Bulk payslip release — batches 50 at a time with 1s delay.
 * @param {Array} payslips — array of payslip data objects with employeeEmail
 */
exports.payslipReleasedBulk = (payslips) => {
  fire(async () => {
    const BATCH = 50;
    const feUrl = emailCfg.frontendUrl || 'http://localhost:3000';
    for (let i = 0; i < payslips.length; i += BATCH) {
      const batch = payslips.slice(i, i + BATCH);
      const jobs  = batch
        .filter((p) => p.employeeEmail)
        .map((p) => {
          const tpl = T.payslipReleased({ ...p, payslipUrl: `${feUrl}/payslips` });
          return { to: p.employeeEmail, ...tpl, template: 'payroll/payslip', priority: 'medium' };
        });
      if (jobs.length) await sendBulk(jobs);
      if (i + BATCH < payslips.length) await new Promise((r) => setTimeout(r, 1000));
    }
    console.info(`[mailNotify] Payslip notifications queued: ${payslips.length}`);
  });
};

/**
 * Salary revision notification.
 */
exports.salaryRevised = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.salaryRevised(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'payroll/salary-revised', priority: 'high' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   RECRUITMENT NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Auto-acknowledge candidate application.
 */
exports.applicationAcknowledgment = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.applicationAcknowledgment(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/ack', priority: 'medium' });
  });
};

/**
 * Candidate shortlisted notification.
 */
exports.candidateShortlisted = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.candidateShortlisted(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/shortlisted', priority: 'high' });
  });
};

/**
 * Candidate rejected notification.
 */
exports.candidateRejected = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.candidateRejected(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/rejected', priority: 'medium' });
  });
};

/**
 * Offer letter sent.
 */
exports.offerLetter = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.offerLetter(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/offer-letter', priority: 'high' });
  });
};

/**
 * Notify recruiter that offer was accepted.
 */
exports.offerAccepted = (data) => {
  if (!data.recruiterEmail) return;
  fire(async () => {
    const tpl = T.offerAccepted(data);
    await sendMail({ to: data.recruiterEmail, ...tpl, template: 'recruitment/offer-accepted', priority: 'high' });
  });
};

/**
 * Notify recruiter that offer was declined.
 */
exports.offerRejected = (data) => {
  if (!data.recruiterEmail) return;
  fire(async () => {
    const tpl = T.offerRejected(data);
    await sendMail({ to: data.recruiterEmail, ...tpl, template: 'recruitment/offer-rejected', priority: 'high' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   RESIGNATION NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Notify manager of submitted resignation.
 */
exports.resignationSubmitted = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.resignationSubmitted(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'resignation/submitted', priority: 'high' });
  });
};

/**
 * Notify employee their resignation was accepted.
 */
exports.resignationApproved = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.resignationApproved(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'resignation/approved', priority: 'high' });
  });
};

/**
 * Notify employee their resignation was not accepted.
 */
exports.resignationRejected = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.resignationRejected(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'resignation/rejected', priority: 'high' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   HELPDESK NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Notify agent of new ticket.
 */
exports.ticketCreated = (data) => {
  if (!data.agentEmail) return;
  fire(async () => {
    const tpl = T.ticketCreated(data);
    await sendMail({ to: data.agentEmail, ...tpl, template: 'helpdesk/created', priority: 'high' });
  });
};

/**
 * Notify reporter that ticket is resolved.
 */
exports.ticketResolved = (data) => {
  if (!data.reporterEmail) return;
  fire(async () => {
    const tpl = T.ticketResolved(data);
    await sendMail({ to: data.reporterEmail, ...tpl, template: 'helpdesk/resolved', priority: 'medium' });
  });
};

/**
 * Notify reporter of ticket update.
 */
exports.ticketUpdated = (data) => {
  if (!data.reporterEmail) return;
  fire(async () => {
    const tpl = T.ticketUpdated(data);
    await sendMail({ to: data.reporterEmail, ...tpl, template: 'helpdesk/updated', priority: 'medium' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   TIMESHEET NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

exports.timesheetSubmitted = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.timesheetSubmitted(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'timesheet/submitted', priority: 'high' });
  });
};

exports.timesheetApproved = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.timesheetApproved(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'timesheet/approved', priority: 'medium' });
  });
};

exports.timesheetRejected = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.timesheetRejected(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'timesheet/rejected', priority: 'high' });
  });
};

exports.timesheetReminderBulk = (employees, weekLabel) => {
  fire(async () => {
    const jobs = employees
      .filter((e) => e.email)
      .map((e) => {
        const tpl = T.timesheetReminder({ employeeName: e.name || e.first_name, weekLabel });
        return { to: e.email, ...tpl, template: 'timesheet/reminder', priority: 'low' };
      });
    if (jobs.length) await sendBulk(jobs);
  });
};

/* ══════════════════════════════════════════════════════════════════════
   DOCUMENT EXPIRY NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/**
 * Bulk document expiry reminders.
 * @param {Array<{ employeeEmail, employeeName, documentType, expiryDate, daysLeft }>} docs
 */
exports.documentExpiryBulk = (docs) => {
  fire(async () => {
    const jobs = docs
      .filter((d) => d.employeeEmail)
      .map((d) => {
        const tpl = T.documentExpiry(d);
        return {
          to:       d.employeeEmail,
          ...tpl,
          template: 'documents/expiry',
          priority: d.daysLeft <= 7 ? 'high' : 'medium',
        };
      });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Document expiry alerts queued: ${jobs.length}`);
  });
};

/* ══════════════════════════════════════════════════════════════════════
   ADMIN ALERT
══════════════════════════════════════════════════════════════════════ */

exports.emailDeliveryFailed = (data) => {
  const to = adminEmail();
  if (!to) return;
  fire(async () => {
    const tpl = T.emailDeliveryFailed(data);
    await sendMailNow({ to, ...tpl, template: 'admin/delivery-failed', priority: 'critical' });
  });
};

/* ══════════════════════════════════════════════════════════════════════
   RECRUITER ASSIGNMENT
══════════════════════════════════════════════════════════════════════ */

/**
 * Notify one or more recruiters that a job has been assigned to them.
 * @param {Array} recruiters  — [{ email, name, jobTitle, jobCode, client, vacancies, skillSet }]
 */
exports.recruiterAssigned = (recruiters) => {
  if (!Array.isArray(recruiters) || !recruiters.length) return;
  fire(async () => {
    const jobs = recruiters
      .filter((r) => r.email)
      .map((r) => {
        const tpl = T.recruiterAssigned({
          recruiterName: r.name     || 'Recruiter',
          jobTitle:      r.jobTitle || '',
          jobCode:       r.jobCode  || '',
          client:        r.client   || '',
          vacancies:     r.vacancies,
          skillSet:      r.skillSet || '',
          loginUrl:      null,
        });
        return { to: r.email, ...tpl, template: 'recruitment/recruiter-assigned', priority: 'high' };
      });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Recruiter assignment emails sent: ${jobs.length}`);
  });
};

/* ══════════════════════════════════════════════════════════════════════
   RECRUITER MANAGER (TEAM LEAD) NOTIFICATIONS
══════════════════════════════════════════════════════════════════════ */

/** Notify TL when a job is assigned to one of their recruiters */
exports.tlJobAssigned = ({ tlEmail, tlName, recruiterName, jobTitle, jobCode, client, vacancies, skillSet }) => {
  if (!tlEmail) return;
  fire(async () => {
    const tpl = T.tlJobAssigned({ tlName, recruiterName, jobTitle, jobCode, client, vacancies, skillSet });
    await sendMail({ to: tlEmail, ...tpl, template: 'recruitment/tl-job-assigned', priority: 'high' });
  });
};

/** Notify TL when a candidate is shortlisted or rejected by their team */
exports.tlCandidateUpdate = ({ tlEmail, tlName, recruiterName, candidateName, jobTitle, status }) => {
  if (!tlEmail) return;
  fire(async () => {
    const tpl = T.tlCandidateUpdate({ tlName, recruiterName, candidateName, jobTitle, status });
    await sendMail({ to: tlEmail, ...tpl, template: 'recruitment/tl-candidate-update', priority: 'medium' });
  });
};

/** Notify TL when an offer is released, accepted, or rejected */
exports.tlOfferUpdate = ({ tlEmail, tlName, recruiterName, candidateName, jobTitle, event, ctc, dateOfJoining }) => {
  if (!tlEmail) return;
  fire(async () => {
    const tpl = T.tlOfferUpdate({ tlName, recruiterName, candidateName, jobTitle, event, ctc, dateOfJoining });
    await sendMail({ to: tlEmail, ...tpl, template: 'recruitment/tl-offer-update', priority: 'high' });
  });
};
