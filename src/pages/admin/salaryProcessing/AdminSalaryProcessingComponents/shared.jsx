const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const inr = n => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const num = n => Number(n || 0).toLocaleString("en-IN", {
  maximumFractionDigits: 1
});
// Day-type colours for the attendance strip and legend.
// Day-type colours for the attendance strip and legend.
const DAY_STYLE = {
  present: {
    bg: "#16a34a",
    label: "Present"
  },
  late: {
    bg: "#65a30d",
    label: "Late"
  },
  half_day: {
    bg: "#eab308",
    label: "Half day"
  },
  paid_leave: {
    bg: "#e87500",
    label: "Paid leave"
  },
  unpaid_leave: {
    bg: "#dc2626",
    label: "Unpaid leave (LOP)"
  },
  absent: {
    bg: "#b91c1c",
    label: "Absent (LOP)"
  },
  pending_leave: {
    bg: "#f97316",
    label: "Leave pending"
  },
  pending_regularization: {
    bg: "#fb923c",
    label: "Regularization pending"
  },
  holiday: {
    bg: "#a855f7",
    label: "Holiday"
  },
  weekly_off: {
    bg: "#e2e8f0",
    label: "Weekly off"
  },
  upcoming: {
    bg: "#f1f5f9",
    label: "Upcoming"
  },
  not_employed: {
    bg: "#ffffff",
    label: "Not employed"
  }
};
const FLAG_TONE = {
  NO_SALARY: "bg-rose-50 text-rose-700 border-rose-200",
  NO_BANK: "bg-amber-50 text-amber-800 border-amber-200",
  PENDING_LEAVE: "bg-orange-50 text-orange-700 border-orange-200",
  PENDING_REGULARIZATION: "bg-orange-50 text-orange-700 border-orange-200",
  HIGH_ABSENCE: "bg-rose-50 text-rose-700 border-rose-200",
  ON_HOLD: "bg-slate-100 text-slate-700 border-slate-300",
  MONTH_NOT_OVER: "bg-sky-50 text-sky-700 border-sky-200",
  NEW_JOINER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EXITING: "bg-violet-50 text-violet-700 border-violet-200"
};
const INFO_FLAGS = ["MONTH_NOT_OVER", "NEW_JOINER", "EXITING"];
function previousMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return {
    month: d.getMonth() + 1,
    year: d.getFullYear()
  };
}
function downloadCsv(filename, rows) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map(r => r.map(esc).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
/* ---------- small pieces ---------- */
export { MONTHS, inr, num, DAY_STYLE, FLAG_TONE, INFO_FLAGS, previousMonth, downloadCsv };
