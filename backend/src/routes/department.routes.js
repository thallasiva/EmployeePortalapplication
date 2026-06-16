const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/department.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const schema = Joi.object({
  department_name: Joi.string().max(100).required(),
  company_id: Joi.number().integer().allow(null),
});

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requirePermission('settings', 'add'), validate(schema), controller.create);
router.put('/:id', requirePermission('settings', 'edit'), validate(schema.fork(['department_name'], (s) => s.optional())), controller.update);
router.delete('/:id', requirePermission('settings', 'delete'), controller.remove);

module.exports = router;
