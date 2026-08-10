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
        upgradeInsecureRequests: []
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true
  })
);


app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id']
  })
);


app.use((req, res, next) => {
  const id = crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});


morgan.token('safe-auth', (req) =>
req.headers.authorization ? '[REDACTED]' : '-'
);

if (env !== 'test') {
  app.use(
    morgan(
      env === "development" ? //'production' ?
      ':remote-addr :method :url :status :res[content-length] :response-time ms' :
      ':method :url :status :response-time ms - auth::safe-auth'
    )
  );
}


app.use(compression());


app.use(cookieParser());


const path = require('path');
app.use('/public', express.static(path.join(__dirname, '../../src/assets'), {
  maxAge: '7d',
  immutable: false,
  setHeaders: (res) => {res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');}
}));


app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));



app.use(hpp({ whitelist: ['sort', 'fields', 'filter', 'ids'] }));



app.use(sanitizeBody);



const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => (hits - 3) * 500
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' }
});


const payrollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payroll requests. Please slow down.' }
});


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

app.use('/api/auth', authSlowDown, authLimiter);
app.use('/api/payroll', payrollLimiter);
app.use('/api', generalLimiter);


const { upload: uploadConfig } = require('./config/env');
const uploadDir = require('path').resolve(process.cwd(), uploadConfig.dir);
app.use('/uploads', express.static(uploadDir, { index: false }));


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    env,
    database: req.app.locals.dbConnected ? 'connected' : 'disconnected'
  });
});

app.get('/api/health/', async (req, res) => {
  try {
   
    const result = "Middleware Working";
    res.status(result.ok ? 200 : 503).json(result);
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.get('/api/health/email', async (req, res) => {
  try {
    const { verifySmtp } = require('./services/email.service');
    const result = await verifySmtp();
    res.status(result.ok ? 200 : 503).json(result);
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});



app.post('/api/health/email/send-test', async (req, res) => {
  try {
    const { sendMailNow } = require('./services/email.service');
    const to = req.body.to || 'test@example.com';
    const result = await sendMailNow({
      to,
      subject: 'HRMS Test Email',
      html: '<p>This is a test email from your HRMS system. SMTP delivery confirmed.</p>',
      text: 'This is a test email from your HRMS system. SMTP is working correctly.'
    });
    res.status(result.sent ? 200 : 500).json(result);
  } catch (err) {
    res.status(500).json({ sent: false, error: err.message });
  }
});


app.get('/api/health/email/send-test', async (req, res) => {
  try {
    const { sendMailNow } = require('./services/email.service');
    const to = req.query.to || 'pavan@yopmail.com';
    const result = await sendMailNow({
      to,
      subject: 'HRMS Test Email',
      html: '<p>This is a test email from your HRMS system. SMTP delivery confirmed.</p>',
      text: 'HRMS test email -- SMTP delivery confirmed.'
    });
    res.status(result.sent ? 200 : 500).json(result);
  } catch (err) {
    res.status(500).json({ sent: false, error: err.message });
  }
});


app.get('/api/health/email/send-pdf-test', async (req, res) => {
  try {
    const { sendMailNow } = require('./services/email.service');
    const { generateOfferLetterPdf } = require('./utils/offerLetterPdf');
    const to = req.query.to || 'pavan@yopmail.com';

    const pdfBuffer = await generateOfferLetterPdf({
      candidateName: 'Test Candidate',
      jobTitle: 'Software Engineer',
      offerCode: 'TEST/001',
      dateOfJoining: new Date().toISOString(),
      ctc: 3245438,
      ctcInWords: 'Thirty Two Lakh Forty Five Thousand Four Hundred Thirty Eight Rupees Only',
      basic: 1800000, hra: 720000, telephoneAllowance: 36000,
      specialAllowance: 165438, grossSalary: 2721438,
      pfContribution: 216000, statutoryBonus: 46250,
      gratuity: 86580, esi: 0
    });

    const result = await sendMailNow({
      to,
      subject: 'HRMS -- Offer Letter PDF Test',
      html: '<p>Test email with PDF attachment. If you see this email with an attached PDF, the system is working correctly.</p>',
      text: 'Test email with PDF attachment.',
      attachments: [{ filename: 'Offer_Letter_TEST.pdf', content: pdfBuffer, contentType: 'application/pdf' }]
    });

    res.status(result.sent ? 200 : 500).json({
      ...result,
      pdfSize: pdfBuffer.length,
      attachmentIncluded: true
    });
  } catch (err) {
    res.status(500).json({ sent: false, error: err.message, stack: err.stack?.split('\n').slice(0, 5) });
  }
});


app.use("/api", routes);


app.use(notFoundHandler);

module.exports = app;
