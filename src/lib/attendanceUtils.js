/** Full day = 9 hours (540 minutes) → status P */
export const REQUIRED_WORK_MINUTES = 9 * 60;

/** Example partial presence (4h 30m) → status P:A */
export const PARTIAL_EXAMPLE_MINUTES = 4 * 60 + 30;

/**
 * Attendance code from actual work minutes.
 * - ≥ 9 hrs  → P
 * - > 0 & < 9 hrs → P:A (e.g. 4:30 present)
 * - 0 on workday → A
 * - weekend → O
 * - holiday → H
 */
export function getAttendanceCode(workMinutes, { isWeekend = false, isHoliday = false } = {}) {
  if (isHoliday) {
    return { code: "H", label: "Holiday", workMinutes: 0 };
  }
  if (isWeekend) {
    return { code: "O", label: "Off", workMinutes: 0 };
  }
  if (workMinutes >= REQUIRED_WORK_MINUTES) {
    return { code: "P", label: "Present", workMinutes };
  }
  if (workMinutes > 0) {
    return { code: "P:A", label: "Present : Absent", workMinutes };
  }
  return { code: "A", label: "Absent", workMinutes: 0 };
}

export function formatMinutesAsHrs(minutes) {
  if (minutes == null || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function formatMinutesDisplay(minutes) {
  if (minutes == null || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const CELL_STYLES = {
  P: "bg-[#d8f3dc] text-[#1b4332]",
  "P:A": "bg-[#ffddd2] text-[#9c4221]",
  H: "bg-[#d7e3fc] text-[#1d3557]",
  O: "bg-white text-[#64748b]",
  A: "bg-[#fee2e2] text-[#991b1b]",
};
