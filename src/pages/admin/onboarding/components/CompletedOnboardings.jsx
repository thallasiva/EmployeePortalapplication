import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, initials } from "../utils";

const BRAND = "#f18200";

function getJoinDate(emp) {
  return emp.date_of_joining || emp.joining_date || emp.doj || emp.created_at || null;
}

const CompletedOnboardings = React.memo(function CompletedOnboardings({
  loading,
  completedOnboardings,
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? completedOnboardings : completedOnboardings.slice(0, 5);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "#f0fdf4" }}>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">
              Completed Onboardings
              {!loading && (
                <span className="ml-2 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  {completedOnboardings.length}
                </span>
              )}
            </h2>
            <p className="text-[12px] text-slate-400">Employees past the 90-day onboarding window</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
        </div>
      ) : completedOnboardings.length === 0 ? (
        <p className="text-[13px] text-slate-400 text-center py-6">No completed onboardings yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="text-left px-4 py-2.5 font-semibold">Employee</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Designation</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Department</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Joined</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white"
                          style={{ backgroundColor: BRAND }}
                        >
                          {initials(emp.first_name, emp.last_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {emp.first_name} {emp.last_name || ""}
                          </p>
                          <p className="text-[11px] text-slate-400">{emp.emp_code || emp.employee_code || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{emp.designation_name || emp.designation || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.department_name || emp.department || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(getJoinDate(emp))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                        <CheckCircle2 size={11} /> 100%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {completedOnboardings.length > 5 && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-1.5 text-[12px] font-medium mx-auto"
              style={{ color: BRAND }}
            >
              {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {completedOnboardings.length}</>}
            </button>
          )}
        </>
      )}
    </section>
  );
});

export default CompletedOnboardings;
