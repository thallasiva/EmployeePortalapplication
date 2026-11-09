'use strict';
const express = require('express');
const Joi = require('joi');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { requireCompanyModule } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const c = require('../controllers/asset.controller');
const router = express.Router();
const staff = authorizeRoles('Admin', 'HR Manager');
router.use(authenticate, requireCompanyModule('employees'));
router.get('/me', c.mine);
router.get('/categories', c.categories);
router.get('/requests/mine', c.myRequests);
router.post('/requests', validate(Joi.object({
  request_type: Joi.string().valid('New Asset', 'Accessory', 'Replacement').required(),
  category_id: Joi.number().integer().positive().allow(null),
  justification: Joi.string().trim().min(5).max(1000).required(),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
})), c.createRequest);
router.use(authorizeRoles('Admin', 'HR Manager'));
router.get('/dashboard', staff, c.dashboard);
router.post('/categories', validate(Joi.object({
  category_name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().allow('', null).max(255),
  icon: Joi.string().allow('', null).max(40),
})), c.saveCategory);
router.put('/categories/:id', validate(Joi.object({
  category_name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().allow('', null).max(255),
  icon: Joi.string().allow('', null).max(40),
  is_active: Joi.boolean(),
})), c.saveCategory);
router.get('/allocations', c.allocations);
router.get('/returns', c.returns);
router.get('/requests', c.requests);
router.put('/requests/:id/review', validate(Joi.object({
  decision: Joi.string().valid('Approved', 'Rejected').required(),
  review_notes: Joi.string().allow('', null).max(500),
})), c.reviewRequest);
router.post('/requests/:id/fulfill', validate(Joi.object({ asset_id: Joi.number().integer().positive().required() })), c.fulfillRequest);
router.get('/maintenance', c.maintenance);
router.post('/maintenance', validate(Joi.object({
  asset_id: Joi.number().integer().positive().required(),
  issue: Joi.string().trim().min(4).max(1000).required(),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
})), c.createMaintenance);
router.put('/maintenance/:id', validate(Joi.object({
  status: Joi.string().valid('In Progress', 'Resolved', 'Cancelled').required(),
  resolution_notes: Joi.string().allow('', null).max(1000),
})), c.updateMaintenance);
router.get('/transfers', c.transfers);
router.post('/:assetId/transfer', validate(Joi.object({
  to_employee_id: Joi.number().integer().positive().required(),
  remarks: Joi.string().allow('', null).max(500),
})), c.transfer);
router.get('/reports', validate(Joi.object({
  type: Joi.string().valid('inventory', 'allocations', 'maintenance').default('inventory'),
  category_id: Joi.number().integer().positive().allow(''),
  status: Joi.string().valid('All', 'Available', 'Assigned', 'Maintenance', 'Retired').default('All'),
  from_date: Joi.date().iso().allow(''),
  to_date: Joi.date().iso().allow(''),
}).custom((value, helpers) => {
  if (value.from_date && value.to_date && new Date(value.from_date) > new Date(value.to_date)) {
    return helpers.error('date.greater', { limit: 'From date must be on or before to date' });
  }
  return value;
}), 'query'), c.report);
router.get('/', staff, c.list);
router.post('/', staff, validate(Joi.object({
  asset_tag: Joi.string().trim().min(1).max(80).required(),
  asset_name: Joi.string().trim().min(1).max(160).required(),
  category: Joi.string().allow('', null).max(80),
  category_id: Joi.number().integer().positive().allow(null),
  serial_number: Joi.string().allow('', null).max(120),
  purchase_date: Joi.date().iso().allow(null),
  location: Joi.string().allow('', null).max(120),
  notes: Joi.string().allow('', null).max(500),
})), c.create);
router.post('/:id/assign', validate(Joi.object({ employee_id: Joi.number().integer().positive().required() })), c.assign);
router.post('/:id/return', validate(Joi.object({ return_condition: Joi.string().allow('', null).max(255) })), c.returnAsset);
router.put('/:id/status', validate(Joi.object({ status: Joi.string().valid('Available', 'Maintenance', 'Retired').required() })), c.setStatus);
module.exports = router;
