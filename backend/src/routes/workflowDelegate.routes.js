const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/workflowDelegate.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const createSchema = Joi.object({
  employee_id: Joi.number().integer().optional(),
  delegate_employee_id: Joi.number().integer().required(),
  module: Joi.string().max(60).optional(),
  from_date: Joi.date().iso().required(),
  to_date: Joi.date().iso().min(Joi.ref('from_date')).required(),
});

router.use(authenticate);

router.get('/me', controller.myDelegations);
router.post('/', validate(createSchema), controller.create);
router.put('/:id/cancel', controller.cancel);

router.get('/', requirePermission('settings', 'view'), controller.list);
router.get('/:id', requirePermission('settings', 'view'), controller.getOne);

module.exports = router;
