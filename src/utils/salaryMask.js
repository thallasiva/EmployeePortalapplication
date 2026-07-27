











import { isAdmin } from '../data/auth';


export const SENSITIVE_SALARY_FIELDS = [
'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'ctc',
'allowances', 'gross_earnings', 'deductions', 'net_pay',
'account_number', 'pan_number', 'uan_number'];


const MASK = '••••••';








export function isSalaryVisible(user, ownEmployeeId = null) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (ownEmployeeId && user.employeeId === Number(ownEmployeeId)) return true;
  return false;
}







export function maskSalaryValue(value, visible) {
  if (visible) return value;
  return MASK;
}








export function formatSalary(value, visible) {
  if (!visible) return MASK;
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n);
}







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
