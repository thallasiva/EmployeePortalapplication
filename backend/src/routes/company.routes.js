const express = require('express');
const controller = require('../controllers/company.controller');
const validate = require('../middleware/validate');
const Joi = require('joi');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

const companySchema = Joi.object({
  company_name: Joi.string().max(150).required(),
  address: Joi.string().max(255).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().max(30).optional().allow('', null),
});

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requirePermission('settings', 'add'), validate(companySchema), controller.create);
router.put('/:id', requirePermission('settings', 'edit'), validate(companySchema.fork(['company_name'], (s) => s.optional())), controller.update);
router.delete('/:id', requirePermission('settings', 'delete'), controller.remove);

module.exports = router;
