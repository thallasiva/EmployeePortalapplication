const express = require('express');
const router  = express.Router();
const c = require('../controllers/appraisal.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);

/* Public (all authenticated) */
router.get('/cycle', c.getCycle);

/* Employee */
router.get('/my',        c.getMyAppraisal);
router.post('/my/save',  c.saveMyAppraisal);

/* Manager + Admin */
router.get('/team',             authorizeRoles('Reporting Manager','Admin'), c.getTeamAppraisals);
router.put('/:id/manager-rate', authorizeRoles('Reporting Manager','Admin'), c.saveManagerRating);

/* Admin only */
router.get('/all',              authorizeRoles('Admin'), c.getAllAppraisals);
router.put('/:id/status',       authorizeRoles('Admin'), c.updateStatus);
router.put('/cycle/toggle',     authorizeRoles('Admin'), c.toggleCycle);
router.put('/cycle/settings',   authorizeRoles('Admin'), c.updateSettings);

module.exports = router;
