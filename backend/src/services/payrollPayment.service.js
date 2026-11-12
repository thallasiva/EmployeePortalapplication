'use strict';
const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const toBatchStatus = ({ total, paid, failed, pending, partial }) => {
  if (paid === total && total > 0) return 'COMPLETED';
  if (partial > 0 || (pending > 0 && (paid > 0 || failed > 0))) return 'PARTIAL';
  if (pending > 0) return 'AWAITING_RECONCILIATION';
  if (failed === total && total > 0) return 'FAILED';
  return 'PARTIAL';
};

class PayrollPaymentService {
  async createExport({ runId, companyId, userId }) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    return withTransaction(async (conn) => {
      const [[run]] = await conn.query(
        'SELECT payroll_run_id, company_id, month, year, review_status, is_locked, rule_version_id FROM payroll_runs WHERE payroll_run_id=? AND company_id=? FOR UPDATE',
        [runId, company]
      );
      if (!run) throw ApiError.notFound('Payroll run not found');
      if (run.review_status !== 'APPROVED' || !Number(run.is_locked)) {
        throw ApiError.conflict('Approve and lock payroll before exporting its payment file');
      }
      const [rows] = await conn.query(
        `SELECT p.payslip_id, p.employee_id, p.net_pay, p.status AS payslip_status,
                GREATEST(p.net_pay-COALESCE(i.paid_amount,0),0) AS payment_amount,
                e.emp_code, TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS employee_name,
                b.account_number, b.ifsc_code
           FROM payslips p
           JOIN employees e ON e.employee_id=p.employee_id AND e.company_id=?
           LEFT JOIN employee_bank_details b ON b.employee_id=e.employee_id
           LEFT JOIN payroll_payment_items i ON i.payslip_id=p.payslip_id
          WHERE p.payroll_run_id=? AND p.status='Generated'
          ORDER BY e.emp_code, p.payslip_id`,
        [company, runId]
      );
      if (!rows.length) throw ApiError.badRequest('No generated payslips are available for payment');
      const invalid = rows.filter((row) => !row.account_number || !IFSC_RE.test(String(row.ifsc_code || '').toUpperCase()));
      if (invalid.length) {
        throw ApiError.badRequest(`Bank export blocked. Add a valid account number and IFSC for: ${invalid.map((r) => r.employee_name).join(', ')}`);
      }

      const reference = `PAY-${company}-${run.year}${String(run.month).padStart(2, '0')}-${runId}`;
      let currencyCode = 'INR';
      if (run.rule_version_id) {
        const [[ruleVersion]] = await conn.query(
          'SELECT snapshot_json FROM payroll_rule_versions WHERE rule_version_id=? AND company_id=? LIMIT 1',
          [run.rule_version_id, company]
        );
        if (ruleVersion?.snapshot_json) {
          const snapshot = typeof ruleVersion.snapshot_json === 'string' ? JSON.parse(ruleVersion.snapshot_json) : ruleVersion.snapshot_json;
          currencyCode = String(snapshot?.payroll_policy?.currency_code || currencyCode).toUpperCase();
        }
      }
      await conn.query(
        `INSERT INTO payroll_payment_batches (company_id, payroll_run_id, batch_reference, currency_code, status, created_by)
         VALUES (?, ?, ?, ?, 'AWAITING_RECONCILIATION', ?)
         ON DUPLICATE KEY UPDATE payment_batch_id=LAST_INSERT_ID(payment_batch_id)`,
        [company, runId, reference, currencyCode, userId || null]
      );
      const [[batch]] = await conn.query(
        'SELECT payment_batch_id, batch_reference, status FROM payroll_payment_batches WHERE company_id=? AND payroll_run_id=? FOR UPDATE',
        [company, runId]
      );
      for (const row of rows) {
        await conn.query(
          `INSERT IGNORE INTO payroll_payment_items (payment_batch_id, payslip_id, employee_id, amount)
           VALUES (?, ?, ?, ?)`,
          [batch.payment_batch_id, row.payslip_id, row.employee_id, row.net_pay]
        );
      }
      await conn.query('UPDATE payroll_runs SET payment_exported_at=COALESCE(payment_exported_at,NOW()) WHERE payroll_run_id=? AND company_id=?', [runId, company]);
      return { batch, rows };
    });
  }

  async list({ companyId, status, limit = 50, offset = 0 }) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    return query(
      `SELECT b.*, r.month, r.year,
              COUNT(i.payment_item_id) AS employee_count,
              SUM(i.amount) AS batch_amount,
                SUM(i.status IN ('PENDING','PARTIAL')) AS pending_count,
              SUM(i.status='PAID') AS paid_count,
              SUM(i.status='FAILED') AS failed_count
         FROM payroll_payment_batches b
         JOIN payroll_runs r ON r.payroll_run_id=b.payroll_run_id AND r.company_id=b.company_id
         LEFT JOIN payroll_payment_items i ON i.payment_batch_id=b.payment_batch_id
        WHERE b.company_id=? AND (? IS NULL OR b.status=?)
        GROUP BY b.payment_batch_id
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?`,
      [company, status || null, status || null, safeLimit, safeOffset]
    );
  }

  async details({ batchId, companyId }) {
    const company = Number(companyId);
    const batches = await query(
      `SELECT b.*, r.month, r.year FROM payroll_payment_batches b
        JOIN payroll_runs r ON r.payroll_run_id=b.payroll_run_id AND r.company_id=b.company_id
       WHERE b.payment_batch_id=? AND b.company_id=? LIMIT 1`,
      [batchId, company]
    );
    if (!batches.length) throw ApiError.notFound('Payment batch not found');
    const items = await query(
      `SELECT i.payment_item_id, i.payslip_id, i.employee_id, i.amount, i.paid_amount, i.status,
              i.payment_reference, i.failure_reason, i.confirmed_at,
              e.emp_code, TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS employee_name,
              d.department_name
         FROM payroll_payment_items i
         JOIN employees e ON e.employee_id=i.employee_id AND e.company_id=?
         LEFT JOIN departments d ON d.department_id=e.department_id
        WHERE i.payment_batch_id=? ORDER BY e.emp_code`,
      [company, batchId]
    );
    return { ...batches[0], items };
  }

  async reconcile({ batchId, companyId, userId, items, notes }) {
    const company = Number(companyId);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    if (!Array.isArray(items) || !items.length) throw ApiError.badRequest('Add at least one payment result to reconcile');
    await withTransaction(async (conn) => {
      const [[batch]] = await conn.query(
        'SELECT payment_batch_id FROM payroll_payment_batches WHERE payment_batch_id=? AND company_id=? FOR UPDATE',
        [batchId, company]
      );
      if (!batch) throw ApiError.notFound('Payment batch not found');
      const seen = new Set();
      for (const item of items) {
        const id = Number(item.payment_item_id);
        const status = String(item.status || '').toUpperCase();
        if (!Number.isInteger(id) || seen.has(id)) throw ApiError.badRequest('Payment item IDs must be valid and unique');
        seen.add(id);
        if (!['PAID', 'PARTIAL', 'FAILED', 'PENDING'].includes(status)) throw ApiError.badRequest('Payment status must be PAID, PARTIAL, FAILED, or PENDING');
        if (['PAID', 'PARTIAL'].includes(status) && !String(item.payment_reference || '').trim()) {
          throw ApiError.badRequest('A bank confirmation/reference is required for a confirmed payment');
        }
        if (status === 'FAILED' && !String(item.failure_reason || '').trim()) {
          throw ApiError.badRequest('Add a failure reason for failed payments');
        }
        const [[existing]] = await conn.query(
          'SELECT status, amount, paid_amount FROM payroll_payment_items WHERE payment_item_id=? AND payment_batch_id=? FOR UPDATE',
          [id, batchId]
        );
        if (!existing) throw ApiError.badRequest('A payment item does not belong to this batch');
        if (existing.status === 'PAID' && status !== 'PAID') {
          throw ApiError.conflict('A bank-confirmed payment cannot be changed through reconciliation');
        }
        const paidAmount = status === 'PAID' ? Number(existing.amount) : status === 'PARTIAL' ? Number(item.paid_amount || 0) : Number(existing.paid_amount || 0);
        if (status === 'PARTIAL' && !(paidAmount > 0 && paidAmount < Number(existing.amount))) {
          throw ApiError.badRequest('A partial payment amount must be greater than zero and less than the full amount');
        }
        if (status === 'PAID' && !Number.isFinite(paidAmount)) throw ApiError.badRequest('Invalid paid amount');
        await conn.query(
          `UPDATE payroll_payment_items
              SET retry_count=retry_count + IF(status='FAILED' AND ? <> 'FAILED',1,0),
                  status=?, paid_amount=?, payment_reference=?, failure_reason=?,
                  confirmed_at=IF(? IN ('PAID','PARTIAL'),NOW(),NULL), reconciled_by=?
            WHERE payment_item_id=? AND payment_batch_id=?`,
          [status, status, paidAmount, item.payment_reference?.trim() || null, item.failure_reason?.trim() || null, status, userId || null, id, batchId]
        );
        if (status === 'PAID') {
          await conn.query("UPDATE payslips SET status='Paid' WHERE payslip_id=(SELECT payslip_id FROM payroll_payment_items WHERE payment_item_id=? AND payment_batch_id=?)", [id, batchId]);
        }
      }
      const [[counts]] = await conn.query(
        `SELECT COUNT(*) AS total,
                SUM(status='PAID') AS paid,
                SUM(status='FAILED') AS failed,
                SUM(status='PENDING') AS pending,
                SUM(status='PARTIAL') AS partial
           FROM payroll_payment_items WHERE payment_batch_id=?`,
        [batchId]
      );
      const status = toBatchStatus({ total: Number(counts.total), paid: Number(counts.paid || 0), failed: Number(counts.failed || 0), pending: Number(counts.pending || 0), partial: Number(counts.partial || 0) });
      await conn.query(
        `UPDATE payroll_payment_batches SET status=?, reconciled_by=?, reconciled_at=NOW(), notes=COALESCE(?,notes)
          WHERE payment_batch_id=?`,
        [status, userId || null, notes?.trim() || null, batchId]
      );
    });
    return this.details({ batchId, companyId });
  }
}

module.exports = new PayrollPaymentService();
