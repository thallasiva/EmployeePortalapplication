import React, { useMemo } from "react";
import { UserCheck, UserX, Clock4, CalendarOff, Timer, Briefcase } from "lucide-react";

const CARDS = [
  { key: "present",  label: "Present",    icon: UserCheck,   iconColor: "text-green-600",  iconBg: "bg-green-100",  valColor: "text-green-700"  },
  { key: "absent",   label: "Absent",     icon: UserX,       iconColor: "text-red-500",    iconBg: "bg-red-100",    valColor: "text-red-600"    },
  { key: "late",     label: "Late Days",  icon: Clock4,      iconColor: "text-amber-600",  iconBg: "bg-amber-100",  valColor: "text-amber-700"  },
  { key: "leave",    label: "On Leave",   icon: CalendarOff, iconColor: "text-purple-600", iconBg: "bg-purple-100", valColor: "text-purple-700" },
  { key: "avgWork",  label: "Avg Hours",  icon: Timer,       iconColor: "text-[#f18200]",  iconBg: "bg-orange-100", valColor: "text-[#f18200]"  },
  { key: "workdays", label: "Work Days",  icon: Briefcase,   iconColor: "text-slate-600",  iconBg: "bg-slate-200",  valColor: "text-slate-800"  },
];

export default function StatStrip({ loading, dayMap, summary }) {
  const stats = useMemo(() => {
    let present = 0, absent = 0, late = 0, leave = 0, workdays = 0;
    if (dayMap) {
      dayMap.forEach((rec) => {
        if (rec.isHoliday || rec.isWeekend || rec.pending) return;
        workdays++;
        const code = rec.status?.code;
        if (code === "P" || code === "P:A") present++;
        if (code === "A") absent++;
        if (code === "L") leave++;
        const rawIn = rec.processed?.firstIn;
        if (rawIn && rawIn !== "—") {
          const [h, m] = rawIn.split(":").map(Number);
          if (h > 9 || (h === 9 && m > 30)) late++;
        }
      });
    }
    return { present, absent, late, leave, workdays, avgWork: summary?.avgWork || "—" };
  }, [dayMap, summary]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map(({ key, label, icon: Icon, iconColor, iconBg, valColor }) => (
        <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={18} className={iconColor} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
            <p className={`text-2xl font-black ${valColor} leading-tight tabular-nums mt-0.5`}>
              {loading ? "—" : String(stats[key] ?? "—")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
