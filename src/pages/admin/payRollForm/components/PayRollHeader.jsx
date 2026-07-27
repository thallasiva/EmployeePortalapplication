import React from "react";
import { ChevronDown, Download, Plus } from "lucide-react";

const PayRollHeader = React.memo(function PayRollHeader({
  exportOpen,
  onToggleExport,
  onExport,
  onAddSalary
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payroll — Employee Salaries</h1>
        <p className="text-sm text-gray-500">
          Manage each employee's salary structure. Use{" "}
          <a href="/dashboard/payroll/payslips" className="text-brand hover:underline font-medium">
            Payslips
          </a>
          {" "}to generate and distribute monthly payslip documents.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={onToggleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Export
            <ChevronDown size={14} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => onExport("CSV")}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as CSV
              </button>
              <button
                type="button"
                onClick={() => onExport("PDF")}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as PDF
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onAddSalary}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <Plus size={16} />
          Add Salary
        </button>
      </div>
    </div>
  );
});

export default PayRollHeader;
