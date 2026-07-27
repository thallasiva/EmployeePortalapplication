const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/salaryTemplate.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

router.get('/',    requirePermission('salary_templates', 'view'),   ctrl.list);
router.get('/:id', requirePermission('salary_templates', 'view'),   ctrl.getOne);
router.post('/',   requirePermission('salary_templates', 'add'),    ctrl.create);
router.put('/:id', requirePermission('salary_templates', 'edit'),   ctrl.update);
router.delete('/:id', requirePermission('salary_templates', 'delete'), ctrl.remove);

module.exports = router;
