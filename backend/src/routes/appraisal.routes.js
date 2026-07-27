const express = require('express');
const router = express.Router();
const c = require('../controllers/appraisal.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);


router.get('/cycle', c.getCycle);
router.get('/cycles', c.getAllCycles);


router.get('/my', c.getMyAppraisal);
router.post('/my/save', c.saveMyAppraisal);


router.get('/team', authorizeRoles('Reporting Manager', 'Admin'), c.getTeamAppraisals);
router.put('/:id/manager-rate', authorizeRoles('Reporting Manager', 'Admin'), c.saveManagerRating);


router.post('/cycles', authorizeRoles('Admin'), c.createCycle);
router.put('/cycle/:id/settings', authorizeRoles('Admin'), c.updateSettings);
router.post('/cycle/:id/rollout', authorizeRoles('Admin'), c.rolloutCycle);
router.post('/cycle/:id/disable', authorizeRoles('Admin'), c.disableCycle);
router.put('/cycle/toggle', authorizeRoles('Admin'), c.toggleCycle);
router.put('/cycle/settings', authorizeRoles('Admin'), c.updateSettings);


router.get('/all', authorizeRoles('Admin'), c.getAllAppraisals);
router.put('/:id/status', authorizeRoles('Admin'), c.updateStatus);


router.get('/enrollments', authorizeRoles('Admin'), c.getEnrollments);
router.post('/enrollments', authorizeRoles('Admin'), c.enrollEmployees);
router.delete('/enrollments/:employeeId', authorizeRoles('Admin'), c.unenrollEmployee);

module.exports = router;
