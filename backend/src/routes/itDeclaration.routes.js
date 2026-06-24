const router = require('express').Router();
const ctrl   = require('../controllers/itDeclaration.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

// ── Public (all authenticated) ─────────────────────────────────────────────
router.get('/cycle',         ctrl.getLatestCycle);

// ── Employee ───────────────────────────────────────────────────────────────
router.get ('/my',                ctrl.getMyDeclaration);
router.post('/my/save',           ctrl.saveMyDeclaration);
router.get ('/my/proofs',         ctrl.getMyProofs);
router.post('/my/proofs',         upload.single('file'), ctrl.uploadProof);
router.delete('/my/proofs/:id',   ctrl.deleteMyProof);
router.get ('/proofs/:id/file',   ctrl.downloadProof);

// ── Admin only ─────────────────────────────────────────────────────────────
const adminOnly = authorizeRoles('Admin');
router.get ('/admin/cycles',          adminOnly, ctrl.getAllCycles);
router.post('/admin/cycles',          adminOnly, ctrl.createCycle);
router.put ('/admin/cycles/:id',      adminOnly, ctrl.updateCycle);
router.put ('/admin/cycles/:id/toggle', adminOnly, ctrl.toggleCycle);
router.get ('/admin/all',             adminOnly, ctrl.getAllDeclarations);
router.put ('/admin/declarations/:id/review', adminOnly, ctrl.reviewDeclaration);
router.put ('/admin/proofs/:id/review',       adminOnly, ctrl.reviewProof);
router.get ('/admin/proofs/:id/file',         adminOnly, ctrl.downloadProof);

module.exports = router;
