import { Download, X } from "lucide-react";
import { useMemo } from "react";
import { calculatePayslip, formatCurrency } from "./PayRollForm";
import { getCurrentPayslipMonthLabel } from "../../lib/dateUtils";
import { downloadPayslip } from "../../utils/payslipDownload";

const PayslipModal = ({ employee, designationLabel, onClose }) =>
{
    const getFullName = (emp) => `${emp.first_name || ""} ${emp.lasst_name || ""}`.trim();

    const breakdown = useMemo(() => calculatePayslip(employee.salary), [employee.salary]);
    const month = getCurrentPayslipMonthLabel();
    const fullName = getFullName(employee);

    const earnings = [
        ["Basic (50%)", breakdown.basic],
        ["HRA (40% of Basic)", breakdown.hra],
        ["Conveyance", breakdown.conveyance],
        ["Medical Allowance", breakdown.medicalAllowance],
        ["Special Allowance", breakdown.specialAllowance],
    ];

    const deductions = [
        ["PF", breakdown.pf],
        ["ESI", breakdown.esi],
        ["Professional Tax", breakdown.professionalTax],
        ["TDS", breakdown.tds],
    ];

    const handleDownload = () =>
    {
        downloadPayslip({
            month,
            text: `Payslip for ${fullName} (Emp-${employee.employee_id}) - Net Salary ${formatCurrency(
                breakdown.netSalary
            )}`,
            file: `Payslip-Emp-${employee.employee_id}-${month.replace(/\s+/g, "-")}.pdf`,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Payslip — {month}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {fullName} • Emp-{String(employee.employee_id).padStart(3, "0")} • {designationLabel}
                        </p>
                        <p className="text-sm text-gray-400">{employee.email}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 mb-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Earnings</h4>
                        <div className="space-y-2">
                            {earnings.map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-medium text-gray-800">{formatCurrency(value)}</span>
                                </div>
                            ))}
                            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                                <span className="text-gray-700">Total Earnings</span>
                                <span className="text-green-600">{formatCurrency(breakdown.totalEarnings)}</span>
                            </div>
                        </div>
                    </div>

                    Hello Testing
                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-gray-500">
                                Gross Salary
                            </p>

                            <p className="text-xl font-bold">
                                ₹ {breakdown.gross.toLocaleString()}
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-gray-500">
                                Total Deductions
                            </p>

                            <p className="text-xl font-bold text-red-600">
                                ₹ {breakdown.totalDeductions.toLocaleString()}
                            </p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-4">
                            <p className="text-sm text-gray-500">
                                Net Salary
                            </p>

                            <p className="text-2xl font-bold text-green-600">
                                ₹ {breakdown.netSalary.toLocaleString()}
                            </p>
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 ">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">Deductions</h4>
                        <div className="space-y-2">
                            {deductions.map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-medium text-gray-800">{formatCurrency(value)}</span>
                                </div>
                            ))}
                            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                                <span className="text-gray-700">Total Deductions</span>
                                <span className="text-red-600">{formatCurrency(breakdown.totalDeductions)}</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">Net Salary</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(breakdown.netSalary)}</span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        <Download size={16} />
                        Download Payslip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayslipModal;