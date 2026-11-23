import React from "react";
import { Building2, Briefcase, BarChart2, Calendar, Users, Clock, MapPin, DollarSign } from "lucide-react";
import { NAVY } from "./shared";
// ─── Employee profile sidebar ─────────────────────────────────────────────────
function EmployeeProfile({
  structure,
  strCode
}) {
  const fields = [{
    icon: Building2,
    label: "Department",
    value: "All Departments"
  }, {
    icon: Briefcase,
    label: "Designation",
    value: "All Roles"
  }, {
    icon: BarChart2,
    label: "Grade",
    value: "—"
  }, {
    icon: Calendar,
    label: "Date of Join",
    value: "01 Jan 2024"
  }, {
    icon: Users,
    label: "Payroll Group",
    value: "Monthly"
  }, {
    icon: Clock,
    label: "Probation",
    value: "6 months"
  }, {
    icon: Calendar,
    label: "Effective From",
    value: "01 Jan 2025"
  }, {
    icon: MapPin,
    label: "Location",
    value: "All Locations"
  }, {
    icon: DollarSign,
    label: "Currency",
    value: "INR"
  }];
  return <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Avatar header */}
      <div className="px-4 pt-5 pb-4 flex flex-col items-center gap-2 border-b border-gray-100" style={{
      background: `linear-gradient(135deg, ${NAVY}22 0%, #f9fafb 100%)`
    }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{
        backgroundColor: NAVY
      }}>SS</div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">{structure?.structure_name ?? "Salary Structure"}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{strCode}</p>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border" style={{
        backgroundColor: "#dcfce7",
        color: "#166534",
        borderColor: "#bbf7d0"
      }}>
          Active
        </span>
      </div>
      {/* Fields */}
      <div className="p-3 space-y-2">
        {fields.map(({
        icon: Icon,
        label,
        value
      }) => <div key={label} className="flex items-center gap-2.5 text-xs">
            <Icon size={12} className="text-gray-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">{label}</span>
              <span className="text-gray-700 font-medium truncate">{value}</span>
            </div>
          </div>)}
      </div>
    </div>;
}
// ─── Live salary summary ──────────────────────────────────────────────────────
export { EmployeeProfile };
