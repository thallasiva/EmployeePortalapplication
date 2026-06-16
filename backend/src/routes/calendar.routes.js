const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/calendarEvent.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const eventSchema = Joi.object({
  title: Joi.string().max(150).required(),
  description: Joi.string().max(255).optional().allow('', null),
  event_date: Joi.date().iso().required(),
  event_type: Joi.string().max(40).optional(),
});

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requirePermission('settings', 'add'), validate(eventSchema), controller.create);
router.put('/:id', requirePermission('settings', 'edit'), validate(eventSchema.fork(['title', 'event_date'], (s) => s.optional())), controller.update);
router.delete('/:id', requirePermission('settings', 'delete'), controller.remove);

module.exports = router;
