'use strict';

const nodemailer = require('nodemailer');
const { email: emailCfg } = require('../config/env');
const { enqueue } = require('./email/mailQueue');

let _transporter = null;



function getTransporter() {
  if (_transporter) return _transporter;
  if (!emailCfg.host || !emailCfg.user || !emailCfg.pass) return null;

  _transporter = nodemailer.createTransport({
    host: emailCfg.host,
    port: emailCfg.port,
    secure: emailCfg.secure,
    auth: { user: emailCfg.user, pass: emailCfg.pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });

  return _transporter;
}



async function _doSend({ to, cc, bcc, subject, html, text, attachments }) {
  const transport = getTransporter();

  if (!transport) {
    console.warn('[EMAIL] SMTP not configured -- skipped | to=' + to + ' | subject=' + subject);
    console.warn('[EMAIL] Fix: set SMTP_HOST, SMTP_USER, SMTP_PASS in .env and restart server.');
    return { sent: false, error: 'SMTP not configured' };
  }

  if (!to) {
    console.warn('[EMAIL] No recipient -- skipped | subject=' + subject);
    return { sent: false, error: 'Missing recipient' };
  }

  try {
    const info = await transport.sendMail({
      from: emailCfg.from,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: Array.isArray(cc) ? cc.join(', ') : cc || undefined,
      bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc || undefined,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
      attachments: attachments || undefined
    });
    console.info('[EMAIL] Sent | to=' + to + ' | subject=' + subject + ' | id=' + info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EMAIL] Failed | to=' + to + ' | subject=' + subject + ' | err=' + err.message);
    return { sent: false, error: err.message };
  }
}



async function sendMail(options) {
  try {
    const jobId = await enqueue(options);
    if (jobId) return { queued: true, jobId };
    return await _doSend(options);
  } catch (err) {
    console.error('[EMAIL] sendMail error:', err.message);
    return { sent: false, error: err.message };
  }
}

async function sendMailNow(options) {
  try {
    return await _doSend(options);
  } catch (err) {
    console.error('[EMAIL] sendMailNow error:', err.message);
    return { sent: false, error: err.message };
  }
}

async function sendBulk(emailList) {
  return Promise.allSettled(emailList.map((opts) => sendMail(opts)));
}

async function processQueuedJob(job) {
  return _doSend(job.data);
}

async function verifySmtp() {
  const t = getTransporter();
  if (!t) return { ok: false, reason: 'SMTP not configured -- set SMTP_HOST, SMTP_USER, SMTP_PASS in .env' };
  try {
    await t.verify();
    return { ok: true, host: emailCfg.host, port: emailCfg.port, user: emailCfg.user };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

module.exports = { sendMail, sendMailNow, sendBulk, processQueuedJob, verifySmtp, getTransporter };
