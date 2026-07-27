import React from "react";
import { MONTH_OPTIONS, getYearOptions } from "../constants";
import { getFullName } from "../utils";

const GenerateSlipModal = React.memo(function GenerateSlipModal({
  slipEmployee,
  slipMonth,
  slipYear,
  generating,
  onChangeMonth,
  onChangeYear,
  onCancel,
  onGenerate
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate Payslip</h3>
        <p className="text-sm text-gray-500 mb-4">
          For <strong>{getFullName(slipEmployee)}</strong> ({slipEmployee.emp_code})
        </p>
        <div className="flex gap-3 mb-6">
          <select
            value={slipMonth}
            onChange={(e) => onChangeMonth(Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={slipYear}
            onChange={(e) => onChangeYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            {getYearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate & View"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default GenerateSlipModal;
