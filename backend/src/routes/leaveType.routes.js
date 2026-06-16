const express = require('express');
const controller = require('../controllers/leaveType.controller');
const validate = require('../middleware/validate');
const { createLeaveTypeSchema, updateLeaveTypeSchema } = require('../validators/leaveType.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requirePermission('leave', 'add'), validate(createLeaveTypeSchema), controller.create);
router.put('/:id', requirePermission('leave', 'edit'), validate(updateLeaveTypeSchema), controller.update);
router.delete('/:id', requirePermission('leave', 'delete'), controller.remove);

module.exports = router;
