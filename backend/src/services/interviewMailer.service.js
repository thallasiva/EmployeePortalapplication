'use strict';

const { sendMail } = require('./email.service');

/**
 * Sends a Teams interview invitation email to the candidate.
 *
 * @param {{
 *   candidateName: string,
 *   candidateEmail: string,
 *   interviewDate: string,      // "2025-08-01"
 *   interviewTime: string,      // "10:00"
 *   durationMinutes: number,
 *   level: string,              // "Round 1"
 *   interviewType: string,      // "Teams"
 *   interviewer: string,
 *   jobTitle: string,
 *   joinUrl: string,
 *   recruiterName: string,
 * }} data
 */
async function sendInterviewInvite(data) {
  const {
    candidateName, candidateEmail,
    interviewDate, interviewTime, durationMinutes,
    level, interviewer, jobTitle, joinUrl, recruiterName,
  } = data;

  // Compute end time for display
  const endTime = (() => {
    if (!interviewTime || !durationMinutes) return null;
    const [h, m] = interviewTime.split(':').map(Number);
    const total = h * 60 + m + Number(durationMinutes);
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  })();

  const formattedDate = new Date(interviewDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const durationLabel = durationMinutes < 60
    ? `${durationMinutes} minutes`
    : `${durationMinutes / 60} hour${durationMinutes > 60 ? 's' : ''}`;

  const subject = `Interview Invitation — ${level} | ${jobTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #5558af 0%, #6264a7 100%); padding: 32px 36px; color: #fff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
    .body { padding: 32px 36px; }
    .greeting { font-size: 16px; color: #1f1f1f; margin-bottom: 20px; }
    .info-box { background: #f0f1f9; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .info-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e0e0f0; align-items: flex-start; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 12px; font-weight: 700; color: #6264a7; min-width: 110px; text-transform: uppercase; letter-spacing: 0.04em; padding-top: 1px; }
    .info-value { font-size: 14px; color: #1f1f1f; font-weight: 500; }
    .join-btn { display: block; width: fit-content; margin: 24px auto; background: #6264a7; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; text-align: center; letter-spacing: 0.02em; }
    .join-btn:hover { background: #5558af; }
    .link-fallback { font-size: 12px; color: #6b7280; margin-top: 8px; word-break: break-all; text-align: center; }
    .footer { background: #f8f9fc; padding: 20px 36px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📅 Interview Invitation</h1>
      <p>You have been scheduled for an interview via Microsoft Teams</p>
    </div>
    <div class="body">
      <div class="greeting">Dear <strong>${candidateName}</strong>,</div>
      <p style="color:#374151;font-size:14px;margin-bottom:20px;">
        We are pleased to inform you that you have been shortlisted for an interview for the position of
        <strong>${jobTitle}</strong>. Please find the details below.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Round</span>
          <span class="info-value">${level}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${interviewTime}${endTime ? ` – ${endTime}` : ''} (${durationLabel})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Interviewer</span>
          <span class="info-value">${interviewer}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mode</span>
          <span class="info-value">Microsoft Teams (Online)</span>
        </div>
      </div>

      <a href="${joinUrl}" class="join-btn">Join Teams Meeting</a>
      <p class="link-fallback">Or copy this link: <a href="${joinUrl}" style="color:#6264a7;">${joinUrl}</a></p>

      <p style="color:#374151;font-size:13px;margin-top:24px;">
        Please ensure you are available 5 minutes before the scheduled time. If you have any questions,
        feel free to reach out.
      </p>

      <p style="color:#374151;font-size:13px;margin-top:16px;">
        Best regards,<br/>
        <strong>${recruiterName}</strong><br/>
        Recruitment Team
      </p>
    </div>
    <div class="footer">
      This is an automated message from the HR Recruitment System. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`;

  const text = `Interview Invitation — ${level} | ${jobTitle}

Dear ${candidateName},

You have been scheduled for a ${level} interview for the position of ${jobTitle}.

Date: ${formattedDate}
Time: ${interviewTime}${endTime ? ` – ${endTime}` : ''} (${durationLabel})
Interviewer: ${interviewer}
Mode: Microsoft Teams (Online)

Join Teams Meeting: ${joinUrl}

Please be available 5 minutes before the scheduled time.

Best regards,
${recruiterName}
Recruitment Team`;

  return sendMail({ to: candidateEmail, subject, html, text });
}

module.exports = { sendInterviewInvite };
