const express = require('express');
const controller = require('../controllers/permission.controller');
const validate = require('../middleware/validate');
const { updateRolePermissionsSchema } = require('../validators/permission.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('settings', 'view'), controller.list);
router.get('/roles/:roleId', requirePermission('settings', 'view'), controller.getRolePermissions);
router.put(
  '/roles/:roleId',
  requirePermission('settings', 'edit'),
  validate(updateRolePermissionsSchema),
  controller.updateRolePermissions
);

module.exports = router;
