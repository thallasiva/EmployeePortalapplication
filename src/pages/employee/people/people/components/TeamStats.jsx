import React from "react";
import { Building2, UserCheck, Users } from "lucide-react";
import { BRAND } from "../constants";

const TeamStats = React.memo(function TeamStats({ self, directReports, peers }) {
  const stats = [
    { label: "Department", value: self?.departmentName || "—", icon: Building2, color: "#6366f1", bg: "#eef2ff" },
    { label: "Direct Reports", value: directReports.length, icon: UserCheck, color: "#10b981", bg: "#ecfdf5" },
    { label: "Team Size", value: peers.length + directReports.length + 1, icon: Users, color: BRAND, bg: "#fff8f0" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-slate-200 px-3 py-3.5 flex flex-col gap-2"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: bg }}
          >
            <Icon size={15} color={color} />
          </div>
          <div>
            <div className="text-lg font-extrabold" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default TeamStats;
