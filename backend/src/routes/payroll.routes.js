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
  importSalaryStructuresSchema
} = require('../validators/payroll.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');

const router = express.Router();

router.use(authenticate);


router.get('/payslips/me', auditLog('READ_OWN_PAYSLIP'), controller.myPayslips);
router.post('/payslips/me/generate', auditLog('GENERATE_OWN_PAYSLIP'), validate(generateMyPayslipSchema), controller.generateMyPayslip);
router.get('/salary-structures/me', auditLog('READ_OWN_SALARY'), controller.getLatestSalaryStructure);


router.get('/salary-structures',
requirePermission('payroll', 'view'), auditLog('READ_SALARY_LIST'),
controller.listSalaryStructures);

router.get('/salary-structures/:id',
requirePermission('payroll', 'view'), auditLog('READ_SALARY'),
controller.getSalaryStructure);

router.get('/salary-structures/employees/:employeeId/latest',
requirePermission('payroll', 'view'), auditLog('READ_SALARY', (req) => req.params.employeeId),
controller.getLatestSalaryStructure);

router.post('/salary-structures',
requirePermission('payroll', 'add'), auditLog('CREATE_SALARY'),
validate(createSalaryStructureSchema), controller.createSalaryStructure);

router.post('/salary-structures/import',
requirePermission('payroll', 'add'), auditLog('IMPORT_SALARY'),
validate(importSalaryStructuresSchema), controller.importSalaryStructures);

router.put('/salary-structures/:id',
requirePermission('payroll', 'edit'), auditLog('UPDATE_SALARY'),
validate(updateSalaryStructureSchema), controller.updateSalaryStructure);

router.delete('/salary-structures/:id',
requirePermission('payroll', 'delete'), auditLog('DELETE_SALARY'),
controller.removeSalaryStructure);


router.get('/payslips',
requirePermission('payroll', 'view'), auditLog('READ_PAYSLIP_LIST'),
controller.listPayslips);

router.get('/payslips/:id/full',
auditLog('READ_PAYSLIP_FULL'),
controller.getPayslipFull);

router.get('/payslips/:id',
requirePermission('payroll', 'view'), auditLog('READ_PAYSLIP'),
controller.getPayslip);

router.post('/payslips/generate',
requirePermission('payroll', 'add'), auditLog('GENERATE_PAYSLIP'),
validate(generatePayslipSchema), controller.generatePayslip);

router.post('/payslips/generate-all',
requirePermission('payroll', 'add'), auditLog('GENERATE_ALL_PAYSLIPS'),
validate(generateAllPayslipsSchema), controller.generateAllPayslips);

router.put('/payslips/:id/mark-paid',
requirePermission('payroll', 'edit'), auditLog('MARK_PAYSLIP_PAID'),
controller.markPayslipPaid);


router.get('/runs', requirePermission('payroll', 'view'), auditLog('READ_PAYROLL_RUN_LIST'), controller.listPayrollRuns);
router.get('/runs/:id', requirePermission('payroll', 'view'), auditLog('READ_PAYROLL_RUN'), controller.getPayrollRun);
router.post('/runs', requirePermission('payroll', 'add'), auditLog('CREATE_PAYROLL_RUN'), validate(runPayrollSchema), controller.runPayroll);
router.post('/runs/:id/submit-review', requirePermission('payroll', 'add'), controller.submitPayrollReview);
router.put('/runs/:id/review', requirePermission('payroll', 'edit'), controller.reviewPayroll);
router.get('/runs/:id/bank-export', requirePermission('payroll', 'edit'), controller.exportBankFile);
router.get('/inputs', requirePermission('payroll', 'view'), controller.listPayrollInputs);
router.post('/inputs', requirePermission('payroll', 'add'), controller.createPayrollInput);
router.put('/inputs/:id/review', requirePermission('payroll', 'edit'), controller.reviewPayrollInput);

module.exports = router;
