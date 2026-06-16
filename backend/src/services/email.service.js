const nodemailer = require('nodemailer');
const { email: emailConfig } = require('../config/env');

let transporter = null;

/**
 * Lazily builds (and caches) the nodemailer transporter from SMTP_* env vars.
 * Returns null if SMTP host/user are not configured, so callers can fail
 * gracefully without crashing the request.
 */
function getTransporter() {
  if (transporter) return transporter;
  if (!emailConfig.host || !emailConfig.user) return null;

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  });

  return transporter;
}

/**
 * Sends an email via the configured SMTP server.
 * @param {{to: string, subject: string, html: string, text?: string}} options
 * @returns {Promise<{sent: boolean, error?: string}>}
 */
async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    return { sent: false, error: 'SMTP is not configured (set SMTP_HOST/SMTP_USER/SMTP_PASS in backend/.env)' };
  }
  if (!to) {
    return { sent: false, error: 'Recipient email address is missing' };
  }

  try {
    await transport.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

module.exports = { sendMail, getTransporter };
