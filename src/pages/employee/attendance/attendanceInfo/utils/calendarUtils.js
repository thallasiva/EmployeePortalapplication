import { toISODateString } from "../../../../../lib/dateUtils";
import { getAttendanceCode, formatMinutesAsHrs } from "../../../../../lib/attendanceUtils";
import { SHIFT_CODE, HOLIDAYS } from "../constants";

export function getMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}

export function buildDayRecord(date, record) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const key = `${m}-${d}`;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const iso = toISODateString(date);
  const todayIso = toISODateString(new Date());
  const isHoliday = record?.status === "holiday" || Boolean(HOLIDAYS[key]);
  const isLeave = record?.status === "leave";
  const pending = !record && !isWeekend && !isHoliday && iso >= todayIso;

  const workMinutes = record?.work_hours ? Math.round(Number(record.work_hours) * 60) : 0;

  let status;
  if (isHoliday) {
    status = { code: "H", label: "Holiday", workMinutes: 0 };
  } else if (isLeave) {
    status = { code: "L", label: "On Leave", workMinutes: 0 };
  } else if (isWeekend && !record) {
    status = { code: "O", label: "Off", workMinutes: 0 };
  } else if (pending) {
    status = { code: "—", label: "In progress", workMinutes: 0 };
  } else {
    status = getAttendanceCode(workMinutes, { isWeekend: false, isHoliday: false });
  }

  const hasData = Boolean(record) && !isHoliday && !isLeave;
  const firstIn = record?.check_in ? record.check_in.slice(0, 5) : "—";
  const lastOut = record?.check_out ? record.check_out.slice(0, 5) : "—";
  const totalWork = hasData ? formatMinutesAsHrs(workMinutes) : "—";
  const lateBy = record?.late_by_minutes || 0;

  return {
    iso,
    day: date.getDate(),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    status,
    shiftCode: SHIFT_CODE,
    isHoliday,
    isWeekend: isWeekend && !record,
    hasWarning: lateBy > 0,
    pending: Boolean(pending),
    hasRemote: false,
    processed: {
      firstIn,
      lastOut,
      lateIn: lateBy > 0 ? `00:${String(lateBy).padStart(2, "0")}` : "—",
      earlyOut: "—",
      totalWorkHrs: totalWork,
      breakHrs: hasData ? "—" : "—",
      actualWorkHrs: totalWork
    },
    statusRemarks:
      status.code === "P:A"
        ? `Partial presence — ${totalWork} worked (required 9h)`
        : status.code === "P"
        ? "Full day present"
        : status.code === "H"
        ? HOLIDAYS[key] || "Holiday"
        : status.code === "L"
        ? "On approved leave"
        : status.code === "O"
        ? "Weekly off"
        : status.code === "A"
        ? "Absent"
        : "—",
    sessions:
      hasData && (record?.check_in || record?.check_out)
        ? [
            {
              session: "Session 1",
              timing: `${firstIn} - ${lastOut}`,
              firstIn,
              lastOut
            }
          ]
        : []
  };
}
