import React from "react";
import { MONTH_LABELS } from "../constants";
import { fmt } from "../utils";

const SummaryTableFooter = React.memo(function SummaryTableFooter({ employees, leaveTypes }) {
  if (!employees.length) return null;

  return (
    <tfoot>
      <tr className="bg-slate-800 text-white font-medium">
        <td className="sticky left-0 z-10 bg-slate-800 px-3 py-2" colSpan={2}>Totals</td>
        <td colSpan={4} className="px-3 py-2 text-slate-400 text-xs">{employees.length} employees</td>

        {leaveTypes.map((lt) => {
          const total = employees.reduce(
            (s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.opening_balance || 0),
            0
          );
          return <td key={`tot-ob-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
        })}
        {leaveTypes.map((lt) => {
          const total = employees.reduce(
            (s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.granted || 0),
            0
          );
          return <td key={`tot-gr-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
        })}
        {leaveTypes.map((lt) => {
          const total = employees.reduce(
            (s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.availed || 0),
            0
          );
          return <td key={`tot-av-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
        })}
        {MONTH_LABELS.map((_, mi) =>
          leaveTypes.map((lt) => {
            const total = employees.reduce(
              (s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.monthly?.[mi] || 0),
              0
            );
            return <td key={`tot-m${mi}-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
          })
        )}
        {leaveTypes.map((lt) => {
          const total = employees.reduce(
            (s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.closing_balance || 0),
            0
          );
          return <td key={`tot-cl-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
        })}
      </tr>
    </tfoot>
  );
});

export default SummaryTableFooter;
