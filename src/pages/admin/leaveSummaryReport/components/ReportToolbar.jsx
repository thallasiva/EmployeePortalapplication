import React from "react";
import { YEARS } from "../constants";

const ReportToolbar = React.memo(function ReportToolbar({
  year,
  onYearChange,
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
  onExportCSV,
  hasData,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Leave Summary Report</h1>
        <p className="text-sm text-slate-500">Full year leave ledger for all employees</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          className="border rounded-lg px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Notice">On Notice</option>
        </select>

        <input
          type="text"
          placeholder="Search employee / dept…"
          className="border rounded-lg px-3 py-1.5 text-sm w-52"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <button
          onClick={onExportCSV}
          disabled={!hasData}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          ↓ Export CSV
        </button>
      </div>
    </div>
  );
});

export default ReportToolbar;
