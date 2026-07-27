const express = require('express');
const Joi = require('joi');
const ctrl = require('../controllers/orgHierarchy.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

const canView = requirePermission('employees', 'view');
const canEdit = requirePermission('employees', 'edit');


router.get('/stats', canView, ctrl.getDashboardStats);


router.get('/tree', canView, ctrl.getHierarchyTree);
router.get('/unassigned', canView, ctrl.getUnassigned);
router.get('/managers', canView, ctrl.getManagers);
router.get('/managers/:id', canView, ctrl.getManagerDetails);


router.get('/search', canView, ctrl.searchEmployee);


router.post('/assign', canEdit, validate(Joi.object({
  employee_id: Joi.number().integer().required(),
  new_manager_id: Joi.number().integer().required(),
  reason: Joi.string().max(255).allow('', null).optional()
})), ctrl.assignManager);

router.post('/bulk-assign', canEdit, validate(Joi.object({
  employee_ids: Joi.array().items(Joi.number().integer()).min(1).required(),
  new_manager_id: Joi.number().integer().required(),
  reason: Joi.string().max(255).allow('', null).optional()
})), ctrl.bulkAssign);

router.post('/transfer', canEdit, validate(Joi.object({
  old_manager_id: Joi.number().integer().required(),
  new_manager_id: Joi.number().integer().required(),
  reason: Joi.string().max(255).allow('', null).optional()
})), ctrl.transferManager);


router.get('/delegations', canView, ctrl.listDelegations);
router.post('/delegations', canEdit, validate(Joi.object({
  employee_id: Joi.number().integer().required(),
  delegate_employee_id: Joi.number().integer().required(),
  module: Joi.string().max(60).allow('', null).optional(),
  from_date: Joi.alternatives().try(Joi.date().iso(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)).required(),
  to_date: Joi.alternatives().try(Joi.date().iso(), Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)).required(),
  reason: Joi.string().max(255).allow('', null).optional()
})), ctrl.createDelegation);
router.put('/delegations/:id/cancel', canEdit, ctrl.cancelDelegation);


router.get('/history', canView, ctrl.getHistory);

module.exports = router;
