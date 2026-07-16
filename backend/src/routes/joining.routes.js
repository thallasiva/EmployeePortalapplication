'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/joining.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const ADMIN_ONLY = authorizeRoles('Admin');

/* ── PUBLIC routes (no auth — token-secured) ─────────────────── */
router.get ('/verify',  ctrl.verifyToken);
router.post('/save',    ctrl.saveFormalities);

/* ── Protected routes (HR/Admin) ─────────────────────────────── */
router.get ('/invitations',              authenticate, ADMIN_ONLY, ctrl.list);
router.get ('/invitations/:id',          authenticate, ADMIN_ONLY, ctrl.getDetail);
router.get ('/by-offer/:offerId',        authenticate, ADMIN_ONLY, ctrl.getByOffer);
router.put ('/invitations/:id/review',   authenticate, ADMIN_ONLY, ctrl.review);
router.post('/invitations/:id/resend', authenticate, ADMIN_ONLY, ctrl.resendInvitation);

module.exports = router;
