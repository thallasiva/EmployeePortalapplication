/**
 * Salary Masking Utilities — Frontend
 * =====================================
 * Provides helpers that mask salary fields for non-admin users
 * in the UI. The backend already masks at the API level; these
 * helpers add a second layer so the UI never accidentally renders
 * raw values that should be hidden.
 *
 * Usage:
 *   import { isSalaryVisible, maskSalaryValue, formatSalary } from '../utils/salaryMask';
 */

import { isAdmin } from '../data/auth';

/** Salary fields that must be masked for non-admins */
export const SENSITIVE_SALARY_FIELDS = [
  'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
  'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'ctc',
  'allowances', 'gross_earnings', 'deductions', 'net_pay',
  'account_number', 'pan_number', 'uan_number',
];

const MASK = '••••••';

/**
 * Returns true if the current user can see salary data.
 * Admins always can. Employees can see their own data (when ownEmployeeId matches).
 *
 * @param {object} user            Current user from auth store / localStorage
 * @param {number} [ownEmployeeId] employee_id of the record being displayed
 */
export function isSalaryVisible(user, ownEmployeeId = null) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (ownEmployeeId && user.employeeId === Number(ownEmployeeId)) return true;
  return false;
}

/**
 * Returns the value if visible, or MASK otherwise.
 *
 * @param {*}      value
 * @param {boolean} visible  result of isSalaryVisible()
 */
export function maskSalaryValue(value, visible) {
  if (visible) return value;
  return MASK;
}

/**
 * Formats a numeric salary value as Indian Rupees.
 * Returns MASK if not visible.
 *
 * @param {number|string} value
 * @param {boolean}       visible
 */
export function formatSalary(value, visible) {
  if (!visible) return MASK;
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Returns a copy of a salary row with sensitive fields masked if not visible.
 *
 * @param {object}  row
 * @param {boolean} visible
 */
export function applyMask(row, visible) {
  if (!row) return row;
  if (visible) return row;
  const masked = { ...row };
  for (const field of SENSITIVE_SALARY_FIELDS) {
    if (masked[field] !== undefined) {
      masked[field] = MASK;
    }
  }
  return masked;
}
