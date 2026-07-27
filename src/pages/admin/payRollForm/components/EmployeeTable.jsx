import React from "react";
import { Pencil } from "lucide-react";
import { getFullName, getInitials, formatDate, formatCurrency } from "../utils";

const EmployeeTable = React.memo(function EmployeeTable({
  visible,
  loading,
  onGenerateSlip,
  onEditSalary
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Loading employees…</p>
      ) : (
        <table className="admin-att-table w-full min-w-[900px]">
          <thead>
            <tr>
              <th>Emp Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Joining Date</th>
              <th>Basic Salary</th>
              <th>CTC (Annual)</th>
              <th>Payslip</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              visible.map((emp) => {
                const annualCTC = emp.structure?.ctc
                  ? Number(emp.structure.ctc)
                  : emp.basic
                  ? emp.basic * 1.12 * 12
                  : 0;
                return (
                  <tr key={emp.employee_id}>
                    <td className="font-medium text-gray-700">
                      {emp.emp_code || `EMP-${emp.employee_id}`}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="admin-emp-avatar">{getInitials(emp)}</span>
                        <div>
                          <p className="font-medium text-gray-800">{getFullName(emp)}</p>
                          <p className="text-xs text-gray-400">
                            {emp.designation_name || emp.emp_job_title || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-500">{emp.email}</td>
                    <td className="text-gray-500">{emp.department_name || "—"}</td>
                    <td className="text-gray-500">{formatDate(emp.emp_joining_date)}</td>
                    <td className="font-medium text-gray-700">
                      {emp.basic
                        ? formatCurrency(emp.basic)
                        : <span className="text-amber-500 text-xs">Not set</span>}
                    </td>
                    <td className="font-medium text-gray-700">
                      {annualCTC ? formatCurrency(annualCTC) : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onGenerateSlip(emp)}
                        disabled={!emp.basic}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!emp.basic ? "Set a salary first" : ""}
                      >
                        Generate Slip
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onEditSalary({
                          employeeId: String(emp.employee_id),
                          basic: String(emp.basic || "")
                        })}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label={`Edit salary for ${getFullName(emp)}`}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default EmployeeTable;
