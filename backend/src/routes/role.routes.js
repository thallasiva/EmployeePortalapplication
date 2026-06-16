const express = require('express');
const controller = require('../controllers/role.controller');
const validate = require('../middleware/validate');
const { namedEntitySchema } = require('../validators/common.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();
const schema = namedEntitySchema('role_name');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requirePermission('settings', 'add'), validate(schema), controller.create);
router.put('/:id', requirePermission('settings', 'edit'), validate(schema.fork(['role_name'], (s) => s.optional())), controller.update);
router.delete('/:id', requirePermission('settings', 'delete'), controller.remove);

module.exports = router;
