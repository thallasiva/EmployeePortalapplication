import { Download, X } from "lucide-react";
import { useMemo } from "react";
import { calculatePayslip, formatCurrency } from "./PayRollForm";
import { getCurrentPayslipMonthLabel } from "../../lib/dateUtils";
import { downloadPayslip } from "../../utils/payslipDownload";

const PayslipModal = ({ employee, designationLabel, onClose }) => {
  const getFullName = (emp) =>
  `${emp.first_name || ""} ${emp.last_name || emp.lasst_name || ""}`.trim();

  const breakdown = useMemo(() => calculatePayslip(employee.basic || employee.salary), [employee]);
  const month = getCurrentPayslipMonthLabel();
  const fullName = getFullName(employee);

  const earnings = [
  ["Basic Salary", breakdown.basic],
  ["HRA (40%)", breakdown.hra],
  ["Special Allowance (25%)", breakdown.specialAllowance],
  ["LTA (4.5%)", breakdown.lta],
  ["Telephone & Internet (2%)", breakdown.telephoneAndInternet],
  ["Medical Allowance (5%)", breakdown.medicalAllowance],
  ["Conveyance Allowance (3%)", breakdown.conveyance],
  ["Bonus (5%)", breakdown.bonus],
  ["Incentives (5%)", breakdown.incentives],
  ["Arrears (7.5%)", breakdown.arrears],
  ["Other Earnings (1%)", breakdown.otherEarnings]];


  const deductions = [
  ["PF — Employee", breakdown.pf],
  ["Professional Tax", breakdown.professionalTax],
  ["TDS / Income Tax", breakdown.tds]];


  const handleDownload = () => {
    downloadPayslip({
      month,
      text: `Payslip for ${fullName} (${employee.emp_code || `Emp-${employee.employee_id}`}) — Net Salary ${formatCurrency(breakdown.netSalary)}`,
      file: `Payslip-${employee.emp_code || employee.employee_id}-${month.replace(/\s+/g, "-")}.pdf`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

        {}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Payslip — {month}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {fullName} • {employee.emp_code || `Emp-${employee.employee_id}`}
              {designationLabel ? ` • ${designationLabel}` : ""}
            </p>
            <p className="text-sm text-gray-400">{employee.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close">

            <X size={18} />
          </button>
        </div>

        {}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Earnings</h4>
            <div className="space-y-1.5">
              {earnings.map(([label, value]) =>
              <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{formatCurrency(value)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                <span className="text-gray-700">Total Earnings</span>
                <span className="text-emerald-600">{formatCurrency(breakdown.totalEarnings)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Deductions</h4>
            <div className="space-y-1.5">
              {deductions.map(([label, value]) =>
              <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{formatCurrency(value)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                <span className="text-gray-700">Total Deductions</span>
                <span className="text-red-600">{formatCurrency(breakdown.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Gross Earnings</p>
            <p className="text-base font-bold text-gray-800 mt-0.5">{formatCurrency(breakdown.gross)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Total Deductions</p>
            <p className="text-base font-bold text-red-600 mt-0.5">{formatCurrency(breakdown.totalDeductions)}</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-100 p-3">
            <p className="text-xs text-gray-500">Net Pay</p>
            <p className="text-base font-bold text-green-700 mt-0.5">{formatCurrency(breakdown.netSalary)}</p>
          </div>
        </div>

        {}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">Net Salary</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(breakdown.netSalary)}</span>
        </div>

        {}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">

            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">

            <Download size={16} />
            Download Payslip
          </button>
        </div>
      </div>
    </div>);

};

export default PayslipModal;
