'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const { clientOrigin, env } = require('./config/env');
const routes = require('./routes');
const sanitizeBody = require('./middleware/sanitizeBody');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Security headers (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  })
);

// ── CORS ─────────────────────────────────────────────────────────────────────
// CLIENT_ORIGIN may be a comma-separated list for multi-origin support
// e.g. "https://hrms.vercel.app,https://hrms-preview.vercel.app"
const allowedOrigins = clientOrigin
  ? clientOrigin.split(',').map(o => o.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman) in dev
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })
);

// ── Unique request ID ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// ── Logging (scrub sensitive headers) ────────────────────────────────────────
morgan.token('safe-auth', (req) =>
  req.headers.authorization ? '[REDACTED]' : '-'
);

if (env !== 'test') {
  app.use(
    morgan(
      env === 'production'
        ? ':remote-addr :method :url :status :res[content-length] :response-time ms'
        : ':method :url :status :response-time ms - auth::safe-auth'
    )
  );
}

// ── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Body parsing (strict size limit) ─────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── HTTP Parameter Pollution prevention ───────────────────────────────────────
// Keeps last value when a param is duplicated; arrays in whitelist are allowed.
app.use(hpp({ whitelist: ['sort', 'fields', 'filter', 'ids'] }));

// ── Request body XSS sanitisation ────────────────────────────────────────────
// Strips HTML tags and null bytes from every string field before controllers.
app.use(sanitizeBody);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Tier 1 — Auth endpoints: slow-down then hard cap
const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => (hits - 3) * 500,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

// Tier 2 — Payroll/salary endpoints
const payrollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payroll requests. Please slow down.' },
});

// Tier 3 — General API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

app.use('/api/auth', authSlowDown, authLimiter);
app.use('/api/payroll', payrollLimiter);
app.use('/api', generalLimiter);

// ── Static file serving — uploaded documents ──────────────────────────────────
const { upload: uploadConfig } = require('./config/env');
const uploadDir = require('path').resolve(process.cwd(), uploadConfig.dir);
app.use('/uploads', express.static(uploadDir, { index: false }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Centralised error handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
