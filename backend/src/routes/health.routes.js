'use strict';
/**
 * GET /api/health          — public ping (used by load-balancers)
 * GET /api/health/detail   — admin detail (DB, SMTP, env vars, storage)
 */
const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/ApiResponse');
const { query }    = require('../config/db');
const nodemailer   = require('nodemailer');
const fs           = require('fs');
const path         = require('path');

// Public ping
router.get('/', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Detailed health (admin/hr only)
router.get('/detail',
  authenticate,
  authorizeRoles('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const checks = await runHealthChecks();
    const overall = checks.every(c => c.status === 'ok') ? 'ok' : 'degraded';
    new ApiResponse(overall === 'ok' ? 200 : 503, { overall, checks }, 'Health check').send(res);
  })
);

async function runHealthChecks() {
  const results = [];

  // 1. Database
  try {
    const start = Date.now();
    await query('SELECT 1');
    results.push({ name: 'database', status: 'ok', latencyMs: Date.now() - start });
  } catch (e) {
    results.push({ name: 'database', status: 'error', error: e.message });
  }

  // 2. SMTP
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST) throw new Error('SMTP_HOST not configured');
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port: Number(SMTP_PORT) || 587,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      connectionTimeout: 4000
    });
    await transport.verify();
    results.push({ name: 'smtp', status: 'ok', host: SMTP_HOST });
  } catch (e) {
    results.push({ name: 'smtp', status: 'error', error: e.message });
  }

  // 3. OpenAI key
  const openAiKey = process.env.OPENAI_API_KEY || '';
  results.push({
    name: 'openai',
    status: openAiKey.startsWith('sk-') ? 'ok' : 'error',
    error: openAiKey.startsWith('sk-') ? undefined : 'OPENAI_API_KEY not set or invalid'
  });

  // 4. Storage / uploads dir
  try {
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    results.push({ name: 'storage', status: 'ok', path: uploadsDir });
  } catch (e) {
    results.push({ name: 'storage', status: 'error', error: e.message });
  }

  // 5. Required env vars
  const required = ['JWT_SECRET', 'DB_HOST', 'DB_NAME'];
  const missing  = required.filter(k => !process.env[k]);
  results.push({
    name: 'env_vars',
    status: missing.length ? 'error' : 'ok',
    missing: missing.length ? missing : undefined
  });

  return results;
}

module.exports = router;
