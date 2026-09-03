'use strict';
/**
 * Centralised notification service.
 * Sends emails via nodemailer and logs to notification_log table.
 */
const nodemailer = require('nodemailer');
const { query }  = require('../config/db');

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST) throw new Error('SMTP not configured (SMTP_HOST missing)');
  return {
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    }),
    from: SMTP_FROM || SMTP_USER || 'noreply@hrms.local'
  };
}

async function sendMail({ to, subject, html, employeeId, userId, type }) {
  const { transport, from } = getTransport();
  let status = 'SENT', error = null, sentAt = null;
  try {
    await transport.sendMail({ from, to, subject, html });
    sentAt = new Date();
  } catch (e) {
    status = 'FAILED'; error = e.message;
  }
  // log regardless of success
  await query(
    `INSERT INTO notification_log (user_id,employee_id,type,channel,subject,body,status,error,sent_at)
     VALUES (?,?,?,'EMAIL',?,?,?,?,?)`,
    [userId || null, employeeId || null, type, subject, html, status, error, sentAt]
  ).catch(() => null);
  if (status === 'FAILED') throw new Error(error);
}

// ── Specific notification functions ────────────────────────────────────────

exports.sendMissingCheckoutReminder = async ({ employee_name, work_email, check_in_time, employee_id }) => {
  await sendMail({
    to: work_email,
    subject: '⏰ Reminder: Please check out',
    html: `<p>Hi ${employee_name},</p>
           <p>Our records show you checked in at <strong>${check_in_time}</strong> today but have not yet checked out.</p>
           <p>Please check out via the HRMS app or contact HR if you have already left.</p>
           <p>Thanks,<br>HR Team</p>`,
    employeeId: employee_id,
    type: 'MISSING_CHECKOUT'
  });
};

exports.sendPayrollApprovalNotification = async ({ employee_name, work_email, month, year, net_pay, employee_id }) => {
  await sendMail({
    to: work_email,
    subject: `✅ Payslip Ready — ${month}/${year}`,
    html: `<p>Hi ${employee_name},</p>
           <p>Your payslip for <strong>${month}/${year}</strong> has been approved.</p>
           <p>Net Pay: <strong>₹${Number(net_pay).toLocaleString('en-IN')}</strong></p>
           <p>Log in to the HRMS portal to download your payslip.</p>
           <p>Thanks,<br>HR Team</p>`,
    employeeId: employee_id,
    type: 'PAYSLIP_APPROVED'
  });
};

exports.sendLeaveDecisionNotification = async ({ employee_name, work_email, leave_type, start_date, end_date, approved, remarks, employee_id }) => {
  const decision = approved ? '✅ Approved' : '❌ Rejected';
  await sendMail({
    to: work_email,
    subject: `${decision}: ${leave_type} Leave Request`,
    html: `<p>Hi ${employee_name},</p>
           <p>Your <strong>${leave_type}</strong> leave request (${start_date} – ${end_date}) has been <strong>${approved ? 'approved' : 'rejected'}</strong>.</p>
           ${remarks ? `<p>Remarks: ${remarks}</p>` : ''}
           <p>Thanks,<br>HR Team</p>`,
    employeeId: employee_id,
    type: approved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED'
  });
};

exports.sendProofRejectionNotification = async ({ employee_name, work_email, proof_type, remarks, employee_id }) => {
  await sendMail({
    to: work_email,
    subject: `❌ IT Declaration Proof Rejected — ${proof_type}`,
    html: `<p>Hi ${employee_name},</p>
           <p>Your proof for <strong>${proof_type}</strong> has been rejected.</p>
           ${remarks ? `<p>Reason: ${remarks}</p>` : ''}
           <p>Please re-upload the correct document in the HRMS portal.</p>
           <p>Thanks,<br>HR Team</p>`,
    employeeId: employee_id,
    type: 'PROOF_REJECTED'
  });
};

exports.sendInterviewCompletionNotification = async ({ candidate_name, recruiter_email, job_title, score, recruiter_id }) => {
  await sendMail({
    to: recruiter_email,
    subject: `🎯 AI Interview Completed — ${candidate_name}`,
    html: `<p>Hi,</p>
           <p>The AI interview for candidate <strong>${candidate_name}</strong> applying for <strong>${job_title}</strong> has been completed.</p>
           ${score != null ? `<p>Score: <strong>${score}/100</strong></p>` : ''}
           <p>Log in to the HRMS portal to review the interview details.</p>
           <p>Thanks,<br>Recruitment Team</p>`,
    userId: recruiter_id,
    type: 'INTERVIEW_COMPLETED'
  });
};
