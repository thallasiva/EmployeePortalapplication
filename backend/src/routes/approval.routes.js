'use strict';
const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const controller = require('../controllers/approval.controller');
const router = express.Router();
router.use(authenticate, authorizeRoles('Admin', 'HR Manager', 'Reporting Manager'));
router.get('/', controller.listPending);
module.exports = router;
