const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/office.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const router = express.Router();

const schema = Joi.object({
  company_id: Joi.number().integer().positive().allow(null),
  branch_code: Joi.string().trim().max(32).pattern(/^[A-Za-z0-9_-]+$/).required(),
  office_name: Joi.string().trim().max(100).required(),
  country_id: Joi.number().integer().positive().required(),
  region_id: Joi.number().integer().positive().allow(null),
  state: Joi.string().max(120).allow('', null),
  city: Joi.string().max(120).allow('', null),
  location: Joi.string().max(100).allow('', null),
  address: Joi.string().max(255).allow('', null),
  postal_code: Joi.string().max(32).allow('', null),
  currency: Joi.string().length(3).uppercase().allow('', null),
  timezone: Joi.string().max(64).allow('', null),
  holiday_calendar: Joi.string().max(100).allow('', null),
  contact_email: Joi.string().email().max(254).allow('', null),
  contact_phone: Joi.string().max(40).allow('', null),
  branch_head_employee_id: Joi.number().integer().positive().allow(null),
  hr_manager_employee_id: Joi.number().integer().positive().allow(null),
  working_days: Joi.array().items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')).unique().allow(null),
  status: Joi.string().valid('Active', 'Inactive'),
  geo_latitude: Joi.number().min(-90).max(90).allow(null),
  geo_longitude: Joi.number().min(-180).max(180).allow(null),
  geo_radius_meters: Joi.number().integer().min(50).max(50000).allow(null),
  geo_fence_enabled: Joi.boolean(),
});

router.use(authenticate);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requirePermission('settings', 'add'), validate(schema), controller.create);
router.put('/:id', requirePermission('settings', 'edit'), validate(schema.fork(['branch_code', 'office_name', 'country_id'], (field) => field.optional())), controller.update);
router.patch('/:id/status', requirePermission('settings', 'edit'), validate(Joi.object({
  status: Joi.string().valid('Active', 'Inactive').required(),
})), controller.update);
router.get('/:id/departments', requirePermission('settings', 'view'), controller.listDepartments);
router.put('/:id/departments', requirePermission('settings', 'edit'), validate(Joi.object({
  department_ids: Joi.array().items(Joi.number().integer().positive()).unique().required(),
})), controller.setDepartments);
router.delete('/:id', requirePermission('settings', 'delete'), controller.remove);

module.exports = router;
