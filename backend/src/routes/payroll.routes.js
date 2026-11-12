'use strict';
const express = require('express');
const controller = require('../controllers/payroll.controller');
const paymentController = require('../controllers/payrollPayment.controller');
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
const { requirePermission, requireCompanyModule } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');
const Joi = require('joi');
const attendanceAdjustmentSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  lop_adjustment: Joi.number().min(-31).max(31).precision(1).default(0),
  hold_salary: Joi.boolean().default(false),
  reason: Joi.string().trim().min(3).max(255).required(),
});
const paymentReconciliationSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    payment_item_id: Joi.number().integer().positive().required(),
    status: Joi.string().valid('PAID', 'PARTIAL', 'FAILED', 'PENDING').required(),
    paid_amount: Joi.number().precision(2).positive(),
    payment_reference: Joi.string().trim().max(120).allow('', null),
    failure_reason: Joi.string().trim().max(500).allow('', null),
  })).min(1).max(1000).required(),
  notes: Joi.string().trim().max(1000).allow('', null),
});
const payrollPolicySchema = Joi.object({
  effective_from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  currency_code: Joi.string().uppercase().length(3).required(),
  payroll_frequency: Joi.string().valid('MONTHLY', 'SEMIMONTHLY', 'BIWEEKLY', 'WEEKLY').required(),
  cutoff_day: Joi.number().integer().min(1).max(31).required(),
  salary_payment_day: Joi.number().integer().min(1).max(31).required(),
  working_days_method: Joi.string().valid('CALENDAR_DAYS', 'WORKING_DAYS', 'FIXED_DIVISOR').required(),
  fixed_working_days: Joi.number().positive().max(31).allow(null).when('working_days_method', { is: 'FIXED_DIVISOR', then: Joi.required() }),
  lop_calculation_method: Joi.string().valid('CALENDAR_DAYS', 'WORKING_DAYS', 'FIXED_DIVISOR').required(),
  rounding_method: Joi.string().valid('HALF_UP', 'UP', 'DOWN', 'FLOOR', 'CEIL').required(),
  financial_year_start_month: Joi.number().integer().min(1).max(12).required(),
  approval_employee_ids: Joi.array().items(Joi.number().integer().positive()).unique().max(10).default([]),
  statutory_rules: Joi.object().unknown(true).default({}),
});
const payrollPayGroupSchema = Joi.object({
  group_name: Joi.string().trim().min(2).max(100).required(),
  payroll_frequency: Joi.string().valid('MONTHLY', 'SEMIMONTHLY', 'BIWEEKLY', 'WEEKLY').required(),
  currency_code: Joi.string().uppercase().length(3).required(),
  cutoff_day: Joi.number().integer().min(1).max(31).required(),
  salary_payment_day: Joi.number().integer().min(1).max(31).required(),
});
const payrollGroupAssignmentSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  pay_group_id: Joi.number().integer().positive().required(),
  effective_from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});
const payrollPeriodReasonSchema = Joi.object({ reason: Joi.string().trim().max(500).allow('', null) });
const payrollReopenSchema = Joi.object({ reason: Joi.string().trim().min(5).max(500).required() });
const router = express.Router();
router.use(authenticate);
router.use(requireCompanyModule('payroll'));
// ── Employee self-service ─────────────────────────────────────────────────
router.get('/payslips/me', auditLog('READ_OWN_PAYSLIP'), controller.myPayslips);
router.post('/payslips/me/generate', auditLog('GENERATE_OWN_PAYSLIP'), validate(generateMyPayslipSchema), controller.generateMyPayslip);
router.get('/salary-structures/me', auditLog('READ_OWN_SALARY'), controller.getLatestSalaryStructure);
// ── Salary structures ─────────────────────────────────────────────────────
router.get('/salary-structures', requirePermission('payroll','view'), auditLog('READ_SALARY_LIST'), controller.listSalaryStructures);
router.get('/salary-structures/:id', requirePermission('payroll','view'), auditLog('READ_SALARY'), controller.getSalaryStructure);
router.get('/salary-structures/employees/:employeeId/latest', requirePermission('payroll','view'), auditLog('READ_SALARY', r => r.params.employeeId), controller.getLatestSalaryStructure);
router.post('/salary-structures', requirePermission('payroll','add'), auditLog('CREATE_SALARY'), validate(createSalaryStructureSchema), controller.createSalaryStructure);
router.post('/salary-structures/import', requirePermission('payroll','add'), auditLog('IMPORT_SALARY'), validate(importSalaryStructuresSchema), controller.importSalaryStructures);
router.put('/salary-structures/:id', requirePermission('payroll','edit'), auditLog('UPDATE_SALARY'), validate(updateSalaryStructureSchema), controller.updateSalaryStructure);
router.delete('/salary-structures/:id', requirePermission('payroll','delete'), auditLog('DELETE_SALARY'), controller.removeSalaryStructure);
// ── Payslips ──────────────────────────────────────────────────────────────
router.get('/payslips', requirePermission('payroll','view'), auditLog('READ_PAYSLIP_LIST'), controller.listPayslips);
router.get('/payslips/:id/full', auditLog('READ_PAYSLIP_FULL'), controller.getPayslipFull);
router.get('/payslips/:id', requirePermission('payroll','view'), auditLog('READ_PAYSLIP'), controller.getPayslip);
router.post('/payslips/generate', requirePermission('payroll','add'), auditLog('GENERATE_PAYSLIP'), validate(generatePayslipSchema), controller.generatePayslip);
router.post('/payslips/generate-all', requirePermission('payroll','add'), auditLog('GENERATE_ALL_PAYSLIPS'), validate(generateAllPayslipsSchema), controller.generateAllPayslips);
// ── Payroll runs ──────────────────────────────────────────────────────────
// Attendance → salary: per-employee attendance and computed pay before processing
router.get('/dashboard', requirePermission('payroll','view'), auditLog('READ_PAYROLL_DASHBOARD'), controller.dashboard);
router.get('/settings', requirePermission('payroll','view'), auditLog('READ_PAYROLL_POLICY'), controller.getPayrollPolicy);
router.put('/settings', requirePermission('payroll','edit'), auditLog('UPDATE_PAYROLL_POLICY'), validate(payrollPolicySchema), controller.savePayrollPolicy);
router.get('/pay-groups', requirePermission('payroll','view'), auditLog('READ_PAYROLL_PAY_GROUPS'), controller.listPayrollPayGroups);
router.get('/pay-groups/assignments', requirePermission('payroll','view'), auditLog('READ_PAYROLL_GROUP_ASSIGNMENTS'), controller.listPayrollGroupAssignments);
router.post('/pay-groups/assignments', requirePermission('payroll','edit'), auditLog('ASSIGN_PAYROLL_GROUP'), validate(payrollGroupAssignmentSchema), controller.assignPayrollGroup);
router.post('/pay-groups', requirePermission('payroll','add'), auditLog('CREATE_PAYROLL_PAY_GROUP'), validate(payrollPayGroupSchema), controller.createPayrollPayGroup);
router.put('/pay-groups/:id', requirePermission('payroll','edit'), auditLog('UPDATE_PAYROLL_PAY_GROUP'), validate(payrollPayGroupSchema), controller.updatePayrollPayGroup);
router.delete('/pay-groups/:id', requirePermission('payroll','delete'), auditLog('DEACTIVATE_PAYROLL_PAY_GROUP'), controller.deactivatePayrollPayGroup);
router.get('/attendance-summary', requirePermission('payroll','view'), auditLog('READ_PAYROLL_ATTENDANCE'), controller.attendanceSummary);
router.get('/periods/:year/:month', requirePermission('payroll','view'), auditLog('READ_PAYROLL_PERIOD'), controller.payrollPeriod);
router.post('/periods/:year/:month/lock-inputs', requirePermission('payroll','edit'), auditLog('LOCK_PAYROLL_INPUTS'), validate(payrollPeriodReasonSchema), controller.lockPayrollInputs);
router.post('/periods/:year/:month/close', requirePermission('payroll','edit'), auditLog('CLOSE_PAYROLL_PERIOD'), validate(payrollPeriodReasonSchema), controller.closePayrollPeriod);
router.post('/periods/:year/:month/reopen', requirePermission('payroll','edit'), auditLog('REOPEN_PAYROLL_PERIOD'), validate(payrollReopenSchema), controller.reopenPayrollPeriod);
router.put('/attendance-summary/:employeeId/adjustment', requirePermission('payroll','edit'), auditLog('ADJUST_PAYROLL_ATTENDANCE', r => r.params.employeeId), validate(attendanceAdjustmentSchema), controller.saveAttendanceAdjustment);
router.get('/runs', requirePermission('payroll','view'), auditLog('READ_PAYROLL_RUN_LIST'), controller.listPayrollRuns);
router.get('/runs/:id', requirePermission('payroll','view'), auditLog('READ_PAYROLL_RUN'), controller.getPayrollRun);
router.post('/runs', requirePermission('payroll','add'), auditLog('CREATE_PAYROLL_RUN'), validate(runPayrollSchema), controller.runPayroll);
router.post('/runs/:id/submit-review', requirePermission('payroll','add'), controller.submitPayrollReview);
router.put('/runs/:id/review', requirePermission('payroll','edit'), controller.reviewPayroll);
router.post('/runs/:id/bank-export', requirePermission('payroll','edit'), auditLog('CREATE_PAYROLL_PAYMENT_BATCH'), paymentController.exportBankFile);
router.get('/payment-batches', requirePermission('payroll','view'), auditLog('READ_PAYROLL_PAYMENT_BATCHES'), paymentController.listBatches);
router.get('/payment-batches/:id', requirePermission('payroll','view'), auditLog('READ_PAYROLL_PAYMENT_BATCH'), paymentController.getBatch);
router.post('/payment-batches/:id/reconcile', requirePermission('payroll','edit'), auditLog('RECONCILE_PAYROLL_PAYMENT_BATCH'), validate(paymentReconciliationSchema), paymentController.reconcileBatch);
// ── Payroll lock / unlock ─────────────────────────────────────────────────
router.post('/runs/:id/lock', requirePermission('payroll','edit'), auditLog('LOCK_PAYROLL_RUN'), controller.lockPayrollRun);
router.delete('/runs/:id/lock', requirePermission('payroll','edit'), auditLog('UNLOCK_PAYROLL_RUN'), controller.unlockPayrollRun);
// ── Payroll inputs ────────────────────────────────────────────────────────
router.get('/inputs', requirePermission('payroll','view'), controller.listPayrollInputs);
router.post('/inputs', requirePermission('payroll','add'), controller.createPayrollInput);
router.put('/inputs/:id/review', requirePermission('payroll','edit'), controller.reviewPayrollInput);
module.exports = router;
