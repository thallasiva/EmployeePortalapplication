import React from "react";
import { Mail, Upload } from "lucide-react";
import { MONTH_OPTIONS, getYearOptions } from "../constants/payslipOptions";

const PayslipsHeader = React.memo(function PayslipsHeader({
  month,
  year,
  onMonthChange,
  onYearChange,
  generating,
  onImport,
  onGenerateAll,
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-600 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold">Payslips</h1>
          <p className="mt-0.5 text-sm text-white/80">
            Import salary structures, generate payslips and email them to employees.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none [&>option]:text-gray-800"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none [&>option]:text-gray-800"
          >
            {getYearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onImport}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
        >
          <Upload size={16} />
          Import Salary Structures (CSV)
        </button>
        <button
          type="button"
          onClick={onGenerateAll}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-white/90 disabled:opacity-60"
        >
          <Mail size={16} />
          {generating ? "Generating..." : "Generate All Employee Payslips"}
        </button>
      </div>
    </div>
  );
});

export default PayslipsHeader;
