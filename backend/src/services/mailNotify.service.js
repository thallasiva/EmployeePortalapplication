'use strict';












const { sendMail, sendMailNow, sendBulk } = require('./email.service');
const T = require('./email/mailTemplates');
const { email: emailCfg } = require('../config/env');






function fire(fn) {
  Promise.resolve().then(fn).catch((err) => {
    console.error('[mailNotify] Uncaught error (non-fatal):', err.message);
  });
}

function adminEmail() {return emailCfg.adminAlert || null;}








exports.employeeInvite = ({ name, email, tempPassword, role, department }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.employeeInvite({ name, email, tempPassword, role, department });
    await sendMailNow({ to: email, ...tpl, template: 'auth/invite', priority: 'high' });
  });
};




exports.accountLocked = ({ name, email, minutes }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.accountLocked({ name, minutes });
    await sendMailNow({ to: email, ...tpl, template: 'auth/account-locked', priority: 'critical' });
  });
};




exports.passwordChanged = ({ name, email }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.passwordChanged({ name });
    await sendMail({ to: email, ...tpl, template: 'auth/password-changed', priority: 'high' });
  });
};




exports.forgotPassword = ({ name, email, resetUrl, expiresIn }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.forgotPassword({ name, resetUrl, expiresIn });
    await sendMailNow({ to: email, ...tpl, template: 'auth/forgot-password', priority: 'critical' });
  });
};




exports.loginAlert = ({ name, email, ip, device, time }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.loginAlert({ name, ip, device, time });
    await sendMail({ to: email, ...tpl, template: 'auth/login-alert', priority: 'high' });
  });
};








exports.employeeCreated = ({ name, email, empCode, role, department, joiningDate }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.employeeCreated({ name, empCode, role, department, joiningDate });
    await sendMail({ to: email, ...tpl, template: 'employee/created', priority: 'high' });
  });
};




exports.employeeDeactivated = ({ name, email, reason }) => {
  if (!email) return;
  fire(async () => {
    const tpl = T.employeeDeactivated({ name, reason });
    await sendMail({ to: email, ...tpl, template: 'employee/deactivated', priority: 'high' });
  });
};









exports.leaveApplied = (data) => {
  if (!data.managerEmail) return;
  const { leaveRequestId } = data;
  const feUrl = emailCfg.frontendUrl || 'http://localhost:3000';
  fire(async () => {
    const tpl = T.leaveApplied({
      ...data,
      approveUrl: `${feUrl}/manager/leaves?action=approve&id=${leaveRequestId}`,
      rejectUrl: `${feUrl}/manager/leaves?action=reject&id=${leaveRequestId}`
    });
    await sendMail({ to: data.managerEmail, ...tpl, template: 'leave/applied', priority: 'high' });
  });
};




exports.leaveApproved = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.leaveApproved(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'leave/approved', priority: 'high' });
  });
};




exports.leaveRejected = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.leaveRejected(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'leave/rejected', priority: 'high' });
  });
};




exports.leaveCancelled = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.leaveCancelled(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'leave/cancelled', priority: 'medium' });
  });
};










exports.missingCheckInBulk = (employees, date) => {
  fire(async () => {
    const jobs = employees.
    filter((e) => e.email).
    map((e) => {
      const tpl = T.missingCheckIn({ name: e.name || e.first_name, date });
      return { to: e.email, ...tpl, template: 'attendance/missing-checkin', priority: 'medium' };
    });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Missing check-in alerts queued: ${jobs.length}`);
  });
};




exports.missingCheckOutBulk = (employees, date) => {
  fire(async () => {
    const jobs = employees.
    filter((e) => e.email).
    map((e) => {
      const tpl = T.missingCheckOut({ name: e.name || e.first_name, date });
      return { to: e.email, ...tpl, template: 'attendance/missing-checkout', priority: 'medium' };
    });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Missing check-out alerts queued: ${jobs.length}`);
  });
};




exports.attendanceRegularizationRequest = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.attendanceRegularizationRequest(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'attendance/reg-request', priority: 'high' });
  });
};




exports.attendanceRegularized = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.attendanceRegularized(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'attendance/regularized', priority: 'high' });
  });
};




exports.attendanceRegularizationRejected = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.attendanceRegularizationRejected(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'attendance/reg-rejected', priority: 'high' });
  });
};








exports.payslipReleased = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.payslipReleased({
      ...data,
      payslipUrl: `${emailCfg.frontendUrl || 'http://localhost:3000'}/payslips`
    });
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'payroll/payslip', priority: 'medium' });
  });
};





exports.payslipReleasedBulk = (payslips) => {
  fire(async () => {
    const BATCH = 50;
    const feUrl = emailCfg.frontendUrl || 'http://localhost:3000';
    for (let i = 0; i < payslips.length; i += BATCH) {
      const batch = payslips.slice(i, i + BATCH);
      const jobs = batch.
      filter((p) => p.employeeEmail).
      map((p) => {
        const tpl = T.payslipReleased({ ...p, payslipUrl: `${feUrl}/payslips` });
        return { to: p.employeeEmail, ...tpl, template: 'payroll/payslip', priority: 'medium' };
      });
      if (jobs.length) await sendBulk(jobs);
      if (i + BATCH < payslips.length) await new Promise((r) => setTimeout(r, 1000));
    }
    console.info(`[mailNotify] Payslip notifications queued: ${payslips.length}`);
  });
};




exports.salaryRevised = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.salaryRevised(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'payroll/salary-revised', priority: 'high' });
  });
};








exports.applicationAcknowledgment = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.applicationAcknowledgment(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/ack', priority: 'medium' });
  });
};




exports.candidateShortlisted = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.candidateShortlisted(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/shortlisted', priority: 'high' });
  });
};




exports.candidateRejected = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.candidateRejected(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/rejected', priority: 'medium' });
  });
};




exports.offerLetter = (data) => {
  if (!data.candidateEmail) return;
  fire(async () => {
    const tpl = T.offerLetter(data);
    await sendMail({ to: data.candidateEmail, ...tpl, template: 'recruitment/offer-letter', priority: 'high' });
  });
};




exports.offerAccepted = (data) => {
  if (!data.recruiterEmail) return;
  fire(async () => {
    const tpl = T.offerAccepted(data);
    await sendMail({ to: data.recruiterEmail, ...tpl, template: 'recruitment/offer-accepted', priority: 'high' });
  });
};




exports.offerRejected = (data) => {
  if (!data.recruiterEmail) return;
  fire(async () => {
    const tpl = T.offerRejected(data);
    await sendMail({ to: data.recruiterEmail, ...tpl, template: 'recruitment/offer-rejected', priority: 'high' });
  });
};








exports.resignationSubmitted = (data) => {
  if (!data.managerEmail) return;
  fire(async () => {
    const tpl = T.resignationSubmitted(data);
    await sendMail({ to: data.managerEmail, ...tpl, template: 'resignation/submitted', priority: 'high' });
  });
};




exports.resignationApproved = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.resignationApproved(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'resignation/approved', priority: 'high' });
  });
};




exports.resignationRejected = (data) => {
  if (!data.employeeEmail) return;
  fire(async () => {
    const tpl = T.resignationRejected(data);
    await sendMail({ to: data.employeeEmail, ...tpl, template: 'resignation/rejected', priority: 'high' });
  });
};








exports.ticketCreated = (data) => {
  if (!data.agentEmail) return;
  fire(async () => {
    const tpl = T.ticketCreated(data);
    await sendMail({ to: data.agentEmail, ...tpl, template: 'helpdesk/created', priority: 'high' });
  });
};




exports.ticketResolved = (data) => {
  if (!data.reporterEmail) return;
  fire(async () => {
    const tpl = T.ticketResolved(data);
    await sendMail({ to: data.reporterEmail, ...tpl, template: 'helpdesk/resolved', priority: 'medium' });
  });
};




exports.ticketUpdated = (data) => {
  if (!data.reporterEmail) return;
  fire(async () => {
    const tpl = T.ticketUpdated(data);
    await sendMail({ to: data.reporterEmail, ...tpl, template: 'helpdesk/updated', priority: 'medium' });
  });
};





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
    const jobs = employees.
    filter((e) => e.email).
    map((e) => {
      const tpl = T.timesheetReminder({ employeeName: e.name || e.first_name, weekLabel });
      return { to: e.email, ...tpl, template: 'timesheet/reminder', priority: 'low' };
    });
    if (jobs.length) await sendBulk(jobs);
  });
};









exports.documentExpiryBulk = (docs) => {
  fire(async () => {
    const jobs = docs.
    filter((d) => d.employeeEmail).
    map((d) => {
      const tpl = T.documentExpiry(d);
      return {
        to: d.employeeEmail,
        ...tpl,
        template: 'documents/expiry',
        priority: d.daysLeft <= 7 ? 'high' : 'medium'
      };
    });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Document expiry alerts queued: ${jobs.length}`);
  });
};





exports.emailDeliveryFailed = (data) => {
  const to = adminEmail();
  if (!to) return;
  fire(async () => {
    const tpl = T.emailDeliveryFailed(data);
    await sendMailNow({ to, ...tpl, template: 'admin/delivery-failed', priority: 'critical' });
  });
};









exports.recruiterAssigned = (recruiters) => {
  if (!Array.isArray(recruiters) || !recruiters.length) return;
  fire(async () => {
    const jobs = recruiters.
    filter((r) => r.email).
    map((r) => {
      const tpl = T.recruiterAssigned({
        recruiterName: r.name || 'Recruiter',
        jobTitle: r.jobTitle || '',
        jobCode: r.jobCode || '',
        client: r.client || '',
        vacancies: r.vacancies,
        skillSet: r.skillSet || '',
        loginUrl: null
      });
      return { to: r.email, ...tpl, template: 'recruitment/recruiter-assigned', priority: 'high' };
    });
    if (jobs.length) await sendBulk(jobs);
    console.info(`[mailNotify] Recruiter assignment emails sent: ${jobs.length}`);
  });
};






exports.candidateSubmittedToHR = ({ hrEmail, hrName, recruiterName, candidateName, jobTitle, candidateCode }) => {
  if (!hrEmail) return;
  fire(async () => {
    const tpl = T.candidateSubmittedToHR({ hrName, recruiterName, candidateName, jobTitle, candidateCode });
    await sendMail({ to: hrEmail, ...tpl, template: 'recruitment/candidate-submitted-hr', priority: 'high' });
  });
};


exports.candidateStatusToRecruiter = ({ recruiterEmail, recruiterName, candidateName, jobTitle, status }) => {
  if (!recruiterEmail) return;
  fire(async () => {
    const tpl = T.candidateStatusToRecruiter({ recruiterName, candidateName, jobTitle, status });
    await sendMail({ to: recruiterEmail, ...tpl, template: 'recruitment/candidate-status-recruiter', priority: 'high' });
  });
};


exports.interviewScheduledCandidate = ({ candidateEmail, candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer }) => {
  if (!candidateEmail) return;
  fire(async () => {
    const tpl = T.interviewScheduledCandidate({ candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer });
    await sendMailNow({ to: candidateEmail, ...tpl, template: 'recruitment/interview-scheduled-candidate', priority: 'high' });
  });
};


exports.interviewScheduledHR = ({ hrEmail, hrName, candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer, scheduledByName }) => {
  if (!hrEmail) return;
  fire(async () => {
    const tpl = T.interviewScheduledHR({ hrName, candidateName, jobTitle, level, interviewDate, interviewTime, interviewType, interviewer, scheduledByName });
    await sendMail({ to: hrEmail, ...tpl, template: 'recruitment/interview-scheduled-hr', priority: 'high' });
  });
};


exports.interviewFeedbackToHR = ({ hrEmail, hrName, candidateName, jobTitle, level, feedbackStatus, feedbackComments, interviewerName }) => {
  if (!hrEmail) return;
  fire(async () => {
    const tpl = T.interviewFeedbackToHR({ hrName, candidateName, jobTitle, level, feedbackStatus, feedbackComments, interviewerName });
    await sendMail({ to: hrEmail, ...tpl, template: 'recruitment/interview-feedback-hr', priority: 'high' });
  });
};


exports.candidateSelectedAdmin = ({ candidateName, jobTitle, recruiterName }) => {
  const to = adminEmail();
  if (!to) return;
  fire(async () => {
    const tpl = T.candidateSelectedAdmin({ candidateName, jobTitle, recruiterName });
    await sendMail({ to, ...tpl, template: 'recruitment/candidate-selected-admin', priority: 'high' });
  });
};


exports.offerReleasedToHR = ({ hrEmail, hrName, candidateName, jobTitle, ctc, dateOfJoining }) => {
  if (!hrEmail) return;
  fire(async () => {
    const tpl = T.offerReleasedToHR({ hrName, candidateName, jobTitle, ctc, dateOfJoining });
    await sendMail({ to: hrEmail, ...tpl, template: 'recruitment/offer-released-hr', priority: 'high' });
  });
};


exports.offerAcceptedAdmin = ({ candidateName, jobTitle, dateOfJoining }) => {
  const to = adminEmail();
  if (!to) return;
  fire(async () => {
    const tpl = T.offerAcceptedAdmin({ candidateName, jobTitle, dateOfJoining });
    await sendMail({ to, ...tpl, template: 'recruitment/offer-accepted-admin', priority: 'high' });
  });
};





exports.joiningInvitation = ({
  candidateName, candidateEmail, jobTitle, joiningUrl, expiresAt,
  ctc, ctcInWords, dateOfJoining, offerCode,
  basic, hra, telephoneAllowance, specialAllowance, grossSalary,
  pfContribution, statutoryBonus, gratuity, esi,
  pdfBuffer, pdfFilename
}) => {
  if (!candidateEmail) return;
  fire(async () => {
    const tpl = T.joiningInvitation({
      candidateName, jobTitle, joiningUrl, expiresAt,
      ctc, ctcInWords, dateOfJoining, offerCode,
      basic, hra, telephoneAllowance, specialAllowance, grossSalary,
      pfContribution, statutoryBonus, gratuity, esi
    });
    const attachments = pdfBuffer ?
    [{ filename: pdfFilename || 'Offer_Letter.pdf', content: pdfBuffer, contentType: 'application/pdf' }] :
    [];
    await sendMailNow({ to: candidateEmail, ...tpl, attachments, template: 'joining/invitation', priority: 'critical' });
  });
};

exports.joiningSubmitted = ({ candidateName, candidateEmail, jobTitle }) => {
  const hrEmail = adminEmail();
  if (!hrEmail) return;
  fire(async () => {
    const tpl = T.joiningSubmittedHR({ candidateName, candidateEmail, jobTitle });
    await sendMail({ to: hrEmail, ...tpl, template: 'joining/submitted-hr', priority: 'high' });
  });
};

exports.joiningApproved = ({ candidateName, candidateEmail, jobTitle }) => {
  if (!candidateEmail) return;
  fire(async () => {
    const tpl = T.joiningApproved({ candidateName, jobTitle });
    await sendMailNow({ to: candidateEmail, ...tpl, template: 'joining/approved', priority: 'critical' });
  });
};

exports.joiningChangesRequested = ({ candidateName, candidateEmail, jobTitle, remarks, changesFields }) => {
  if (!candidateEmail) return;
  fire(async () => {
    const tpl = T.joiningChangesRequested({ candidateName, jobTitle, remarks, changesFields });
    await sendMailNow({ to: candidateEmail, ...tpl, template: 'joining/changes-requested', priority: 'critical' });
  });
};

exports.joiningRejected = ({ candidateName, candidateEmail, jobTitle, remarks }) => {
  if (!candidateEmail) return;
  fire(async () => {
    const tpl = T.joiningRejected({ candidateName, jobTitle, remarks });
    await sendMailNow({ to: candidateEmail, ...tpl, template: 'joining/rejected', priority: 'critical' });
  });
};
