const express = require('express');
const controller = require('../controllers/employee.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  contactInfoSchema,
  bankDetailsSchema,
} = require('../validators/employee.validator');

const router = express.Router();

router.use(authenticate);

router.get('/me', controller.getMe);
router.get('/org-chart', controller.orgChart);
router.get('/directory', controller.directory);
router.get('/my-team', controller.myTeam);

router.get('/', requirePermission('employees', 'view'), controller.list);
router.post('/', requirePermission('employees', 'add'), validate(createEmployeeSchema), controller.create);

router.get('/:id', requirePermission('employees', 'view'), controller.getOne);
router.put('/:id', requirePermission('employees', 'edit'), validate(updateEmployeeSchema), controller.update);
router.delete('/:id', requirePermission('employees', 'delete'), controller.remove);

router.get('/:id/contact-info', requirePermission('employees', 'view'), controller.getContactInfo);
router.put('/:id/contact-info', requirePermission('employees', 'edit'), validate(contactInfoSchema), controller.updateContactInfo);

router.get('/:id/bank-details', requirePermission('employees', 'view'), controller.getBankDetails);
router.put('/:id/bank-details', requirePermission('employees', 'edit'), validate(bankDetailsSchema), controller.updateBankDetails);

module.exports = router;
