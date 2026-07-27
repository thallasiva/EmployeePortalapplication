import React from "react";
import { useLeaveSummary } from "./hooks/useLeaveSummary";
import { ltCode } from "./utils";
import ReportToolbar from "./components/ReportToolbar";
import SummaryTableHeader from "./components/SummaryTableHeader";
import SummaryTableBody from "./components/SummaryTableBody";
import SummaryTableFooter from "./components/SummaryTableFooter";

export default function LeaveSummaryReport() {
  const {
    year, setYear,
    statusFilter, setStatus,
    search, setSearch,
    data, loading, error,
    tableRef,
    employees, leaveTypes,
    handleExportCSV,
  } = useLeaveSummary();

  return (
    <div className="p-4">
      <ReportToolbar
        year={year}
        onYearChange={setYear}
        statusFilter={statusFilter}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        onExportCSV={handleExportCSV}
        hasData={employees.length > 0}
      />

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Loading leave summary…
        </div>
      ) : (
        <div ref={tableRef} className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="text-xs border-collapse min-w-max">
            <SummaryTableHeader leaveTypes={leaveTypes} year={year} />
            <SummaryTableBody employees={employees} leaveTypes={leaveTypes} />
            <SummaryTableFooter employees={employees} leaveTypes={leaveTypes} />
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {(data?.leaveTypes || []).map((lt) => (
          <span key={lt.leave_type_id} className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">{ltCode(lt.leave_type_name)}</span>
            = {lt.leave_type_name}
          </span>
        ))}
      </div>
    </div>
  );
}
