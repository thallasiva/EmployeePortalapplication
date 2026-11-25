const express = require('express');
const controller = require('../controllers/accessControl.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requirePlatformAdmin } = require('../utils/companyScope');
const { updateRolePermissionsSchema } = require('../validators/permission.validator');
const { userRoleAssignmentsSchema } = require('../validators/accessControl.validator');

const router = express.Router();
router.use(authenticate);
router.get('/me/permissions', controller.getMyPermissions);
router.get('/roles', requirePermission('settings', 'view'), controller.listRoles);
router.get('/users', requirePermission('settings', 'view'), controller.listUsers);
router.get('/users/:userId/roles', requirePermission('settings', 'view'), controller.getUserRoles);
router.put(
  '/users/:userId/roles',
  requirePermission('settings', 'edit'),
  validate(userRoleAssignmentsSchema),
  controller.replaceUserRoles
);
router.get('/permissions', requirePlatformAdmin, controller.listPermissions);
router.get('/audit', requirePlatformAdmin, controller.listAuditLogs);
router.get('/roles/:roleId/permissions', requirePlatformAdmin, controller.getRolePermissions);
router.put(
  '/roles/:roleId/permissions',
  requirePlatformAdmin,
  validate(updateRolePermissionsSchema),
  controller.updateRolePermissions
);
module.exports = router;
