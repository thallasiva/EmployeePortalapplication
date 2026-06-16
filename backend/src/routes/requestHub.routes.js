const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/requestHub.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const createSchema = Joi.object({
  request_type: Joi.string().max(60).required(),
  title: Joi.string().max(150).required(),
  description: Joi.string().max(255).optional().allow('', null),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Approved', 'Rejected', 'Completed').required(),
});

router.use(authenticate);

router.get('/me', controller.myRequests);
router.post('/', validate(createSchema), controller.create);

router.get('/', requirePermission('settings', 'view'), controller.list);
router.get('/:id', controller.getOne);
router.put('/:id/status', requirePermission('settings', 'edit'), validate(statusSchema), controller.updateStatus);

module.exports = router;
