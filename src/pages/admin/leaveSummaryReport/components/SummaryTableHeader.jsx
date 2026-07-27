import React from "react";
import { MONTH_LABELS } from "../constants";
import { ltCode } from "../utils";

const SummaryTableHeader = React.memo(function SummaryTableHeader({ leaveTypes, year }) {
  return (
    <thead>
      <tr className="bg-slate-700 text-white">
        <th rowSpan={3} className="sticky left-0 z-20 bg-slate-700 px-3 py-2 text-left whitespace-nowrap min-w-[44px]">Emp No</th>
        <th rowSpan={3} className="sticky left-[72px] z-20 bg-slate-700 px-3 py-2 text-left whitespace-nowrap min-w-[160px]">Employee Name</th>
        <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">Status</th>
        <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">Department</th>
        <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">Designation</th>
        <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">DOJ</th>
        <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-blue-700 border-x border-blue-500">Opening Balance</th>
        <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-emerald-700 border-x border-emerald-500">Leave Eligibility</th>
        <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-amber-700 border-x border-amber-500">Leaves Availed</th>
        {MONTH_LABELS.map((m) => (
          <th key={m} colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-purple-700 border-x border-purple-500 whitespace-nowrap">
            {m}&apos;{String(year).slice(2)}
          </th>
        ))}
        <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-rose-700 border-x border-rose-500">Closing Balance</th>
      </tr>

      <tr>
        {[
          { bg: "bg-blue-600 border-blue-500" },
          { bg: "bg-emerald-600 border-emerald-500" },
          { bg: "bg-amber-600 border-amber-500" },
          ...MONTH_LABELS.map(() => ({ bg: "bg-purple-600 border-purple-500" })),
          { bg: "bg-rose-600 border-rose-500" },
        ].map(({ bg }, si) =>
          leaveTypes.map((lt) => (
            <th key={`${si}-${lt.leave_type_id}`} className={`${bg} px-2 py-1 text-center font-medium border-x`}>
              {ltCode(lt.leave_type_name)}
            </th>
          ))
        )}
      </tr>
    </thead>
  );
});

export default SummaryTableHeader;
