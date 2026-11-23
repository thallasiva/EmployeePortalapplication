const SIX_HOURS_MINUTES = 360;
const STATUS_META = {
  P: {
    label: "Full Day Present",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  "P:A": {
    label: "Partial Attendance",
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  A: {
    label: "Absent",
    color: "bg-red-50 text-red-700 border-red-200"
  },
  H: {
    label: "Holiday",
    color: "bg-blue-50 text-[#e87500] border-blue-200"
  },
  L: {
    label: "On Leave",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  }
};
function fmtMins(mins) {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function parsePunches(raw) {
  if (!raw) return [];
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
}
export { SIX_HOURS_MINUTES, STATUS_META, fmtMins, parsePunches };
