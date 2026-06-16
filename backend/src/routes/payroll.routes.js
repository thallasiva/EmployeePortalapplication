const express = require('express');
const controller = require('../controllers/payroll.controller');
const validate = require('../middleware/validate');
const {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  generatePayslipSchema,
  generateMyPayslipSchema,
  generateAllPayslipsSchema,
  runPayrollSchema,
  importSalaryStructuresSchema,
} = require('../validators/payroll.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Self-service
router.get('/payslips/me', controller.myPayslips);
router.post('/payslips/me/generate', validate(generateMyPayslipSchema), controller.generateMyPayslip);
router.get('/salary-structures/me', controller.getLatestSalaryStructure);

// Salary structures
router.get('/salary-structures', requirePermission('payroll', 'view'), controller.listSalaryStructures);
router.get('/salary-structures/:id', requirePermission('payroll', 'view'), controller.getSalaryStructure);
router.get('/salary-structures/employees/:employeeId/latest', requirePermission('payroll', 'view'), controller.getLatestSalaryStructure);
router.post('/salary-structures', requirePermission('payroll', 'add'), validate(createSalaryStructureSchema), controller.createSalaryStructure);
router.post('/salary-structures/import', requirePermission('payroll', 'add'), validate(importSalaryStructuresSchema), controller.importSalaryStructures);
router.put('/salary-structures/:id', requirePermission('payroll', 'edit'), validate(updateSalaryStructureSchema), controller.updateSalaryStructure);
router.delete('/salary-structures/:id', requirePermission('payroll', 'delete'), controller.removeSalaryStructure);

// Payslips
router.get('/payslips', requirePermission('payroll', 'view'), controller.listPayslips);
router.get('/payslips/:id/full', controller.getPayslipFull);
router.get('/payslips/:id', requirePermission('payroll', 'view'), controller.getPayslip);
router.post('/payslips/generate', requirePermission('payroll', 'add'), validate(generatePayslipSchema), controller.generatePayslip);
router.post('/payslips/generate-all', requirePermission('payroll', 'add'), validate(generateAllPayslipsSchema), controller.generateAllPayslips);
router.put('/payslips/:id/mark-paid', requirePermission('payroll', 'edit'), controller.markPayslipPaid);

// Payroll runs
router.get('/runs', requirePermission('payroll', 'view'), controller.listPayrollRuns);
router.get('/runs/:id', requirePermission('payroll', 'view'), controller.getPayrollRun);
router.post('/runs', requirePermission('payroll', 'add'), validate(runPayrollSchema), controller.runPayroll);

module.exports = router;
