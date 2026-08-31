'use strict';

const { sendMail } = require('./email.service');

// Platform config per interviewType
const PLATFORM = {
  Teams: {
    color:      '#6264a7',
    colorLight: '#eff6ff',
    colorBorder:'#bfdbfe',
    colorText:  '#1e40af',
    label:      'Microsoft Teams',
    icon:       '💼',
    btnLabel:   'Join Teams Meeting',
    modeLabel:  'Microsoft Teams (Online)',
  },
  GoogleMeet: {
    color:      '#1a73e8',
    colorLight: '#f0fdf4',
    colorBorder:'#bbf7d0',
    colorText:  '#166534',
    label:      'Google Meet',
    icon:       '📹',
    btnLabel:   'Join Google Meet',
    modeLabel:  'Google Meet (Online)',
  },
  Zoom: {
    color:      '#2d8cff',
    colorLight: '#fff7ed',
    colorBorder:'#fed7aa',
    colorText:  '#9a3412',
    label:      'Zoom',
    icon:       '🎥',
    btnLabel:   'Join Zoom Meeting',
    modeLabel:  'Zoom (Online)',
  },
};

async function sendInterviewInvite(data) {
  const {
    candidateName, candidateEmail,
    interviewDate, interviewTime, durationMinutes,
    level, interviewType, interviewer, jobTitle,
    joinUrl, recruiterName,
  } = data;

  const platform = PLATFORM[interviewType] || {
    color: '#374151', colorLight: '#f9fafb', colorBorder: '#e5e7eb', colorText: '#374151',
    label: interviewType || 'Interview', icon: '📅', btnLabel: 'View Details', modeLabel: interviewType || 'Interview',
  };

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

  const joinBlock = joinUrl ? `
    <a href="${joinUrl}" style="display:block;width:fit-content;margin:24px auto;background:${platform.color};color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;text-align:center;letter-spacing:0.02em;">
      ${platform.icon} ${platform.btnLabel}
    </a>
    <p style="font-size:12px;color:#6b7280;margin-top:8px;word-break:break-all;text-align:center;">
      Or copy this link: <a href="${joinUrl}" style="color:${platform.color};">${joinUrl}</a>
    </p>` : `
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin:20px 0;font-size:13px;color:#856404;">
      ⏳ Your meeting link is being generated. You will receive it shortly via a follow-up email.
    </div>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,${platform.color} 0%,${platform.color}cc 100%);padding:32px 36px;color:#fff;">
      <h1 style="margin:0;font-size:22px;font-weight:700;">📅 Interview Invitation</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.85;">Scheduled via ${platform.label}</p>
    </div>
    <div style="padding:32px 36px;">
      <div style="font-size:16px;color:#1f1f1f;margin-bottom:20px;">Dear <strong>${candidateName}</strong>,</div>
      <p style="font-size:14px;color:#374151;margin-bottom:20px;">
        We are pleased to inform you that you have been shortlisted for an interview for the position of
        <strong>${jobTitle}</strong>. Please find the details below.
      </p>
      <div style="background:#f0f1f9;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #e0e0f0;">
          <span style="font-size:12px;font-weight:700;color:${platform.color};min-width:110px;text-transform:uppercase;letter-spacing:0.04em;">Round</span>
          <span style="font-size:14px;color:#1f1f1f;font-weight:500;">${level}</span>
        </div>
        <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #e0e0f0;">
          <span style="font-size:12px;font-weight:700;color:${platform.color};min-width:110px;text-transform:uppercase;letter-spacing:0.04em;">Date</span>
          <span style="font-size:14px;color:#1f1f1f;font-weight:500;">${formattedDate}</span>
        </div>
        <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #e0e0f0;">
          <span style="font-size:12px;font-weight:700;color:${platform.color};min-width:110px;text-transform:uppercase;letter-spacing:0.04em;">Time</span>
          <span style="font-size:14px;color:#1f1f1f;font-weight:500;">${interviewTime}${endTime ? ` – ${endTime}` : ''} (${durationLabel})</span>
        </div>
        <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #e0e0f0;">
          <span style="font-size:12px;font-weight:700;color:${platform.color};min-width:110px;text-transform:uppercase;letter-spacing:0.04em;">Interviewer</span>
          <span style="font-size:14px;color:#1f1f1f;font-weight:500;">${interviewer || 'TBD'}</span>
        </div>
        <div style="display:flex;gap:12px;padding:8px 0;">
          <span style="font-size:12px;font-weight:700;color:${platform.color};min-width:110px;text-transform:uppercase;letter-spacing:0.04em;">Mode</span>
          <span style="font-size:14px;color:#1f1f1f;font-weight:500;">${platform.modeLabel}</span>
        </div>
      </div>

      ${joinBlock}

      <p style="font-size:13px;color:#374151;margin-top:24px;">
        Please ensure you are available 5 minutes before the scheduled time. If you have any questions,
        feel free to reach out to us.
      </p>
      <p style="font-size:13px;color:#374151;margin-top:16px;">
        Best regards,<br/>
        <strong>${recruiterName}</strong><br/>
        Recruitment Team
      </p>
    </div>
    <div style="background:#f8f9fc;padding:20px 36px;font-size:12px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;">
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
Interviewer: ${interviewer || 'TBD'}
Mode: ${platform.modeLabel}
${joinUrl ? `\nJoin Meeting: ${joinUrl}` : '\nYour meeting link will be sent shortly.'}

Please be available 5 minutes before the scheduled time.

Best regards,
${recruiterName}
Recruitment Team`;

  return sendMail({ to: candidateEmail, subject, html, text });
}

module.exports = { sendInterviewInvite };
