const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/salaryComponent.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

const VIEW = requirePermission('salary_components', 'view');
const EDIT = requirePermission('salary_components', 'edit');
const ADD  = requirePermission('salary_components', 'add');

// Components
router.get('/components',         VIEW, ctrl.listComponents);
router.get('/components/:id',     VIEW, ctrl.getComponent);
router.post('/components',        ADD,  ctrl.createComponent);
router.put('/components/:id',     EDIT, ctrl.updateComponent);
router.patch('/components/:id/toggle', EDIT, ctrl.toggleComponent);

// Structures
router.get('/structures',         VIEW, ctrl.listStructures);
router.get('/structures/:id',     VIEW, ctrl.getStructure);
router.post('/structures',        ADD,  ctrl.upsertStructure);
router.put('/structures/:id',     EDIT, ctrl.upsertStructure);
router.delete('/structures/:id/components/:componentId', EDIT, ctrl.removeStructureLine);

// CTC compute
router.post('/compute-ctc',       VIEW, ctrl.computeCTC);

module.exports = router;
