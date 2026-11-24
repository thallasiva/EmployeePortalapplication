'use strict';

const { query } = require('../../config/db');
const { sendMailNow } = require('../email.service');
const logger = require('../../utils/logger');

async function sendInterviewReminders() {
  const upcoming = await query(
    `SELECT i.interview_id, i.interview_date, i.interview_time, i.interviewer,
            c.name AS candidate_name, c.email AS candidate_email, j.title AS job_title,
            TIMESTAMPDIFF(MINUTE, NOW(), TIMESTAMP(i.interview_date, i.interview_time)) AS minutes_until
       FROM rec_interviews i
       JOIN rec_candidates c ON c.candidate_id = i.candidate_id
       LEFT JOIN rec_job_requests j ON j.job_req_id = i.job_req_id
      WHERE i.status = 'Scheduled'
        AND TIMESTAMP(i.interview_date, i.interview_time) BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
      ORDER BY i.interview_date, i.interview_time`
  );
  let sent = 0;
  for (const interview of upcoming) {
    const minutes = Number(interview.minutes_until);
    const reminderType = minutes > 1425 ? '24h' : minutes > 45 && minutes <= 60 ? '1h' : null;
    if (!reminderType) continue;
    if (!interview.candidate_email) {
      logger.warn(`[Recruitment reminders] Interview ${interview.interview_id} has no candidate email`);
      continue;
    }
    const existing = await query(
      'SELECT reminder_id FROM rec_interview_reminder_log WHERE interview_id = ? AND reminder_type = ? LIMIT 1',
      [interview.interview_id, reminderType]
    );
    if (existing.length) continue;
    const result = await sendMailNow({
      to: interview.candidate_email,
      subject: `Reminder: interview for ${interview.job_title || 'your application'}`,
      text: `Hello ${interview.candidate_name || 'Candidate'}, this is a reminder that your interview is scheduled for ${interview.interview_date} at ${String(interview.interview_time).slice(0, 5)}. Interviewer: ${interview.interviewer || 'To be confirmed'}.`,
    });
    if (!result?.sent) {
      logger.warn(`[Recruitment reminders] Interview reminder was not sent for interview ${interview.interview_id}: ${result?.error || 'email delivery failed'}`);
      continue;
    }
    await query(
      'INSERT IGNORE INTO rec_interview_reminder_log (interview_id, reminder_type) VALUES (?, ?)',
      [interview.interview_id, reminderType]
    );
    sent += 1;
  }
  return sent;
}

async function sendFollowupReminders() {
  const due = await query(
    `SELECT f.followup_id, f.candidate_id, f.due_at, f.note, c.name AS candidate_name,
            e.email AS assignee_email
       FROM rec_candidate_followups f
       JOIN rec_candidates c ON c.candidate_id = f.candidate_id
       JOIN employees e ON e.employee_id = f.assigned_to
      WHERE f.status = 'open' AND f.reminder_sent_at IS NULL
        AND f.due_at <= DATE_ADD(NOW(), INTERVAL 15 MINUTE)
      ORDER BY f.due_at ASC
      LIMIT 100`
  );
  let sent = 0;
  for (const followup of due) {
    if (!followup.assignee_email) {
      logger.warn(`[Recruitment reminders] Follow-up task ${followup.followup_id} has no assignee email`);
      continue;
    }
    const result = await sendMailNow({
      to: followup.assignee_email,
      subject: `Recruitment follow-up due: ${followup.candidate_name}`,
      text: `A recruitment follow-up is due for ${followup.candidate_name}.\n\n${followup.note}\nDue: ${followup.due_at}`,
    });
    if (!result?.sent) {
      logger.warn(`[Recruitment reminders] Follow-up reminder was not sent for task ${followup.followup_id}: ${result?.error || 'email delivery failed'}`);
      continue;
    }
    await query('UPDATE rec_candidate_followups SET reminder_sent_at = NOW() WHERE followup_id = ? AND reminder_sent_at IS NULL', [followup.followup_id]);
    sent += 1;
  }
  return sent;
}

async function run() {
  const [interviews, followups] = await Promise.all([
    sendInterviewReminders(),
    sendFollowupReminders(),
  ]);
  return { interviews, followups };
}

module.exports = { run, sendInterviewReminders, sendFollowupReminders };
