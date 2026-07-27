import React from "react";
import { MONTH_LABELS } from "../constants";
import { fmt } from "../utils";

const SummaryTableBody = React.memo(function SummaryTableBody({ employees, leaveTypes }) {
  if (employees.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={999} className="py-12 text-center text-slate-400">
            No employees found
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {employees.map((emp, idx) => {
        const ld = (ltId) => emp.leave_data?.find((d) => d.leave_type_id === ltId) || {};
        const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
        return (
          <tr key={emp.employee_id} className={`${rowBg} hover:bg-blue-50 transition-colors`}>
            <td className={`sticky left-0 z-10 ${rowBg} px-3 py-2 font-mono text-slate-600 whitespace-nowrap border-b border-slate-100`}>
              {emp.emp_code || "—"}
            </td>
            <td className={`sticky left-[72px] z-10 ${rowBg} px-3 py-2 font-medium text-slate-800 whitespace-nowrap border-b border-slate-100`}>
              {emp.employee_name}
            </td>
            <td className="px-3 py-2 whitespace-nowrap border-b border-slate-100">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  emp.employee_status === "Active"
                    ? "bg-green-100 text-green-700"
                    : emp.employee_status === "Inactive"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {emp.employee_status}
              </span>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-slate-600 border-b border-slate-100">{emp.department_name || "—"}</td>
            <td className="px-3 py-2 whitespace-nowrap text-slate-600 border-b border-slate-100">{emp.designation_name || "—"}</td>
            <td className="px-3 py-2 whitespace-nowrap text-slate-500 border-b border-slate-100">
              {emp.emp_joining_date ? emp.emp_joining_date.slice(0, 10) : "—"}
            </td>

            {leaveTypes.map((lt) => (
              <td key={`ob-${lt.leave_type_id}`} className="px-2 py-2 text-center text-blue-800 bg-blue-50 border-b border-blue-100 border-x border-blue-100">
                {fmt(ld(lt.leave_type_id).opening_balance)}
              </td>
            ))}
            {leaveTypes.map((lt) => (
              <td key={`gr-${lt.leave_type_id}`} className="px-2 py-2 text-center text-emerald-800 bg-emerald-50 border-b border-emerald-100 border-x border-emerald-100">
                {fmt(ld(lt.leave_type_id).granted)}
              </td>
            ))}
            {leaveTypes.map((lt) => (
              <td key={`av-${lt.leave_type_id}`} className="px-2 py-2 text-center text-amber-800 bg-amber-50 border-b border-amber-100 border-x border-amber-100">
                {fmt(ld(lt.leave_type_id).availed)}
              </td>
            ))}
            {MONTH_LABELS.map((_, mi) =>
              leaveTypes.map((lt) => (
                <td key={`m${mi}-${lt.leave_type_id}`} className="px-2 py-2 text-center text-purple-800 bg-purple-50 border-b border-purple-100 border-x border-purple-100">
                  {fmt(ld(lt.leave_type_id).monthly?.[mi])}
                </td>
              ))
            )}
            {leaveTypes.map((lt) => (
              <td key={`cl-${lt.leave_type_id}`} className="px-2 py-2 text-center font-medium text-rose-800 bg-rose-50 border-b border-rose-100 border-x border-rose-100">
                {fmt(ld(lt.leave_type_id).closing_balance)}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
});

export default SummaryTableBody;
