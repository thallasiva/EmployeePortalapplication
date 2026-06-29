const express = require('express');
const router  = express.Router();
const c = require('../controllers/appraisal.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);

/* Public (all authenticated) */
router.get('/cycle',  c.getCycle);      // active cycle
router.get('/cycles', c.getAllCycles);  // all cycles history

/* Employee */
router.get('/my',       c.getMyAppraisal);
router.post('/my/save', c.saveMyAppraisal);

/* Manager + Admin */
router.get('/team',             authorizeRoles('Reporting Manager', 'Admin'), c.getTeamAppraisals);
router.put('/:id/manager-rate', authorizeRoles('Reporting Manager', 'Admin'), c.saveManagerRating);

/* Admin: cycle lifecycle */
router.post('/cycles',              authorizeRoles('Admin'), c.createCycle);
router.put('/cycle/:id/settings',   authorizeRoles('Admin'), c.updateSettings);
router.post('/cycle/:id/rollout',   authorizeRoles('Admin'), c.rolloutCycle);
router.post('/cycle/:id/disable',   authorizeRoles('Admin'), c.disableCycle);
router.put('/cycle/toggle',         authorizeRoles('Admin'), c.toggleCycle);
router.put('/cycle/settings',       authorizeRoles('Admin'), c.updateSettings);

/* Admin: submissions */
router.get('/all',             authorizeRoles('Admin'), c.getAllAppraisals);
router.put('/:id/status',      authorizeRoles('Admin'), c.updateStatus);

/* Enrollment (Admin) */
router.get('/enrollments',                    authorizeRoles('Admin'), c.getEnrollments);
router.post('/enrollments',                   authorizeRoles('Admin'), c.enrollEmployees);
router.delete('/enrollments/:employeeId',     authorizeRoles('Admin'), c.unenrollEmployee);

module.exports = router;
