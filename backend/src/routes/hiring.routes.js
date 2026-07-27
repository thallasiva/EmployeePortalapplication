const express = require('express');
const controller = require('../controllers/hiring.controller');
const validate = require('../middleware/validate');
const {
  createJobSchema,
  updateJobSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  createReferralSchema,
  updateReferralStatusSchema
} = require('../validators/hiring.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);


router.get('/jobs', controller.listJobs);
router.get('/jobs/:id', controller.getJob);
router.post('/jobs', requirePermission('hiring', 'add'), validate(createJobSchema), controller.createJob);
router.put('/jobs/:id', requirePermission('hiring', 'edit'), validate(updateJobSchema), controller.updateJob);
router.delete('/jobs/:id', requirePermission('hiring', 'delete'), controller.removeJob);


router.get('/applications', requirePermission('hiring', 'view'), controller.listApplications);
router.get('/applications/:id', requirePermission('hiring', 'view'), controller.getApplication);
router.post('/applications', validate(createApplicationSchema), controller.createApplication);
router.put(
  '/applications/:id/status',
  requirePermission('hiring', 'edit'),
  validate(updateApplicationStatusSchema),
  controller.updateApplicationStatus
);


router.get('/referrals/me', controller.myReferrals);
router.get('/referrals', requirePermission('hiring', 'view'), controller.listReferrals);
router.get('/referrals/:id', requirePermission('hiring', 'view'), controller.getReferral);
router.post('/referrals', validate(createReferralSchema), controller.createReferral);
router.put(
  '/referrals/:id/status',
  requirePermission('hiring', 'edit'),
  validate(updateReferralStatusSchema),
  controller.updateReferralStatus
);

module.exports = router;
