'use strict';

const express = require('express');
const controller = require('../controllers/mfa.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

const codeSchema = Joi.object({ code: Joi.string().required() });
const verifySchema = Joi.object({
  mfaTempToken: Joi.string().required(),
  code: Joi.string().required(),
});

// Status & setup — require an authenticated session
router.get('/status',  authenticate, controller.status);
router.get('/setup',   authenticate, controller.setup);
router.post('/enable', authenticate, validate(codeSchema),  controller.enable);
router.post('/disable',authenticate, validate(codeSchema),  controller.disable);

// Verify is called without a full JWT (user only has a mfaTempToken)
router.post('/verify', validate(verifySchema), controller.verify);

module.exports = router;
