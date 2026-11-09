const express = require('express');
const router = express.Router();
const c = require('../controllers/appraisal.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { requireMenuPermission, requireCompanyModule } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  cycleSchema,
  cycleSettingsSchema,
  saveSelfAppraisalSchema,
  managerRatingSchema,
  workflowActionSchema
} = require('../validators/appraisal.validator');
router.use(authenticate);
router.use(requireCompanyModule('performance'));
router.get('/cycle', c.getCycle);
router.get('/cycles', c.getAllCycles);
router.get('/my', c.getMyAppraisal);
router.post('/my/save', validate(saveSelfAppraisalSchema), c.saveMyAppraisal);
router.post('/my/:id/acknowledge', c.acknowledgeAppraisal);
router.get('/team', authorizeRoles('Reporting Manager', 'HR Manager', 'Admin'), requireMenuPermission('performance'), c.getTeamAppraisals);
router.put('/:id/manager-rate', authorizeRoles('Reporting Manager', 'HR Manager', 'Admin'), requireMenuPermission('performance'), validate(managerRatingSchema), c.saveManagerRating);
router.post('/:id/workflow', authorizeRoles('HR Manager', 'Admin'), requireMenuPermission('performance'), validate(workflowActionSchema), c.workflowAction);
router.post('/cycles', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), validate(cycleSchema), c.createCycle);
router.put('/cycle/:id/settings', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), validate(cycleSettingsSchema), c.updateSettings);
router.post('/cycle/:id/rollout', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.rolloutCycle);
router.post('/cycle/:id/disable', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.disableCycle);
router.put('/cycle/toggle', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.toggleCycle);
router.put('/cycle/settings', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), validate(cycleSettingsSchema), c.updateSettings);
router.get('/all', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.getAllAppraisals);
router.put('/:id/status', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.updateStatus);
router.get('/enrollments', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.getEnrollments);
router.post('/enrollments', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.enrollEmployees);
router.delete('/enrollments/:employeeId', authorizeRoles('Admin', 'HR Manager'), requireMenuPermission('performance'), c.unenrollEmployee);
module.exports = router;
