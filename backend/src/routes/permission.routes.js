const express = require('express');
const controller = require('../controllers/accessControl.controller');
const validate = require('../middleware/validate');
const { updateRolePermissionsSchema } = require('../validators/permission.validator');
const { authenticate } = require('../middleware/auth');
const { requirePlatformAdmin } = require('../utils/companyScope');
const router = express.Router();
router.use(authenticate);
router.get('/', requirePlatformAdmin, controller.listPermissions);
router.get('/roles/:roleId', requirePlatformAdmin, controller.getRolePermissions);
router.put(
  '/roles/:roleId',
  requirePlatformAdmin,
  validate(updateRolePermissionsSchema),
  controller.updateRolePermissions
);
module.exports = router;
