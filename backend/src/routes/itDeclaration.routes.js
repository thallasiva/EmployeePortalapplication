const router = require('express').Router();
const ctrl = require('../controllers/itDeclaration.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { proofUpload } = require('../middleware/upload');

router.use(authenticate);


router.get('/cycle', ctrl.getLatestCycle);


router.get('/my', ctrl.getMyDeclaration);
router.post('/my/save', ctrl.saveMyDeclaration);
router.get('/my/proofs', ctrl.getMyProofs);
router.post('/my/proofs', proofUpload.single('file'), ctrl.uploadProof);
router.delete('/my/proofs/:id', ctrl.deleteMyProof);
router.get('/proofs/:id/file', ctrl.downloadProof);


const adminOnly = authorizeRoles('Admin');
const payrollReviewers = authorizeRoles('Admin', 'HR Manager');
router.get('/admin/cycles', adminOnly, ctrl.getAllCycles);
router.post('/admin/cycles', adminOnly, ctrl.createCycle);
router.put('/admin/cycles/:id', adminOnly, ctrl.updateCycle);
router.put('/admin/cycles/:id/toggle', adminOnly, ctrl.toggleCycle);
router.get('/admin/all', payrollReviewers, ctrl.getAllDeclarations);
router.put('/admin/declarations/:id/review', payrollReviewers, ctrl.reviewDeclaration);
router.put('/admin/proofs/:id/review', payrollReviewers, ctrl.reviewProof);
router.get('/admin/proofs/:id/file', payrollReviewers, ctrl.downloadProof);

module.exports = router;
