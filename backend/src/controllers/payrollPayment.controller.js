'use strict';
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const paymentService = require('../services/payrollPayment.service');

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const exportBankFile = asyncHandler(async (req, res) => {
  const { batch, rows } = await paymentService.createExport({
    runId: req.params.id,
    companyId: req.user.companyId,
    userId: req.user.employeeId,
  });
  const header = ['EMP_CODE', 'EMPLOYEE_NAME', 'ACCOUNT_NUMBER', 'IFSC_CODE', 'AMOUNT'];
  const csv = [header.map(csvCell).join(','), ...rows.map((row) => [
    row.emp_code, row.employee_name, row.account_number, String(row.ifsc_code).toUpperCase(), Number(row.payment_amount ?? row.net_pay).toFixed(2),
  ].map(csvCell).join(','))].join('\r\n');
  res.set('X-Payment-Batch-Id', String(batch.payment_batch_id));
  res.set('X-Payment-Batch-Reference', batch.batch_reference);
  res.attachment(`${batch.batch_reference}.csv`).type('text/csv; charset=utf-8').send(csv);
});

const listBatches = asyncHandler(async (req, res) => {
  const rows = await paymentService.list({
    companyId: req.user.companyId,
    status: req.query.status,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  new ApiResponse(200, rows, 'Payroll payment batches fetched').send(res);
});

const getBatch = asyncHandler(async (req, res) => {
  const batch = await paymentService.details({ batchId: req.params.id, companyId: req.user.companyId });
  new ApiResponse(200, batch, 'Payroll payment batch fetched').send(res);
});

const reconcileBatch = asyncHandler(async (req, res) => {
  const batch = await paymentService.reconcile({
    batchId: req.params.id,
    companyId: req.user.companyId,
    userId: req.user.employeeId,
    items: req.body.items,
    notes: req.body.notes,
  });
  new ApiResponse(200, batch, 'Payroll payment results reconciled').send(res);
});

module.exports = { exportBankFile, listBatches, getBatch, reconcileBatch };
