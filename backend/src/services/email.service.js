'use strict';
const nodemailer = require('nodemailer');
const { email: emailCfg } = require('../config/env');
const { enqueue } = require('./email/mailQueue');
let _transporter = null;
let _transporterKey = '';
let _settingsCache = null;
let _settingsCacheTime = 0;
const SETTINGS_CACHE_MS = 30_000;

async function getSavedSmtpSettings() {
  if (_settingsCache && Date.now() - _settingsCacheTime < SETTINGS_CACHE_MS) return _settingsCache;
  const { getSmtp } = require('./settings.service');
  _settingsCache = await getSmtp();
  _settingsCacheTime = Date.now();
  return _settingsCache;
}

async function getTransporter(overrides) {
  const settings = overrides || await getSavedSmtpSettings();
  const host = settings.host || emailCfg.host;
  const port = Number(settings.port) || emailCfg.port;
  const user = settings.username || emailCfg.user;
  const pass = settings.password || emailCfg.pass;
  if (!host || !user || !pass) return null;
  const encryption = String(settings.enc || '').toUpperCase();
  const secure = encryption ? encryption === 'SSL' : emailCfg.secure;
  const key = JSON.stringify({ host, port, user, pass, secure, encryption, timeout: settings.timeout });
  if (_transporter && _transporterKey === key) return _transporter;
  if (_transporter) _transporter.close();
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: encryption === 'TLS' || encryption === 'STARTTLS',
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: Number(settings.timeout) ? Number(settings.timeout) * 1000 : undefined,
  });
  _transporterKey = key;
  return _transporter;
}
function clearSmtpCache() {
  if (_transporter) _transporter.close();
  _transporter = null;
  _transporterKey = '';
  _settingsCache = null;
  _settingsCacheTime = 0;
}
function getFromAddress(settings) {
  const email = settings.senderEmail || emailCfg.from;
  if (!email) return undefined;
  return settings.senderName ? `"${settings.senderName}" <${email}>` : email;
}
async function _doSend({ to, cc, bcc, subject, html, text, attachments }) {
  const settings = await getSavedSmtpSettings();
  const transport = await getTransporter(settings);
  if (!transport) {
    console.warn('[EMAIL] SMTP not configured -- skipped | to=' + to + ' | subject=' + subject);
    console.warn('[EMAIL] Configure SMTP in HRMS Settings or the server environment.');
    return { sent: false, error: 'SMTP not configured' };
  }
  if (!to) {
    console.warn('[EMAIL] No recipient -- skipped | subject=' + subject);
    return { sent: false, error: 'Missing recipient' };
  }
  try {
    const info = await transport.sendMail({
      from: getFromAddress(settings),
      replyTo: settings.replyTo || undefined,
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
async function verifySmtp(overrides) {
  const settings = overrides || await getSavedSmtpSettings();
  const t = await getTransporter(settings);
  if (!t) return { ok: false, reason: 'SMTP host, username, or password is not configured.' };
  try {
    await t.verify();
    return { ok: true, host: settings.host || emailCfg.host, port: Number(settings.port) || emailCfg.port };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}
module.exports = { sendMail, sendMailNow, sendBulk, processQueuedJob, verifySmtp, getTransporter, clearSmtpCache };
