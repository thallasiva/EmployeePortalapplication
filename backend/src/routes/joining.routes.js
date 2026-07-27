'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/joining.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload   = require('../middleware/upload');

const ADMIN_ONLY   = authorizeRoles('Admin');
const CAN_VIEW     = authorizeRoles('Admin', 'Recruiter Team Lead');

/* ── PUBLIC routes (no auth — token-secured) ─────────────────── */
router.get ('/verify',  ctrl.verifyToken);
router.get ('/form',    ctrl.getFormByToken);   // load all saved fields for reopen
// Accept optional aadhar_doc + pan_doc file uploads alongside the JSON form data
router.post('/save', upload.fields([
  { name: 'aadhar_doc', maxCount: 1 },
  { name: 'pan_doc',    maxCount: 1 },
]), ctrl.saveFormalities);

/* ── Protected routes ─────────────────────────────────────────── */
// Employee: get own joining uploaded docs + acknowledgment status
router.get ('/my-joining-docs',          authenticate,             ctrl.getMyJoiningDocs);
router.get ('/invitations',              authenticate, CAN_VIEW,   ctrl.list);
router.get ('/invitations/:id',          authenticate, CAN_VIEW,   ctrl.getDetail);
router.get ('/by-offer/:offerId',        authenticate, CAN_VIEW,   ctrl.getByOffer);
router.put ('/invitations/:id/review',   authenticate, ADMIN_ONLY, ctrl.review);
router.post('/invitations/:id/resend', authenticate, ADMIN_ONLY, ctrl.resendInvitation);

module.exports = router;
