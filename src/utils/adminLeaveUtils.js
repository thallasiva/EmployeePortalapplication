const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_LOOKUP = MONTH_NAMES.reduce((acc, name, index) => {
  acc[name.toLowerCase()] = index;
  acc[name.slice(0, 3).toLowerCase()] = index;
  return acc;
}, {});

/** Parse "28 May 2026" reliably across browsers */
export function parseLeaveDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const trimmed = String(dateStr).trim();
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const monthKey = match[2].toLowerCase();
    const year = Number(match[3]);
    const month = MONTH_LOOKUP[monthKey];
    if (month !== undefined && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }
  const parsed = new Date(trimmed);
  return parsed;
}

export function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isDateInLeaveRange(dayDate, fromStr, toStr) {
  const d = stripTime(dayDate);
  const from = stripTime(parseLeaveDate(fromStr));
  const to = stripTime(parseLeaveDate(toStr));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false;
  return d >= from && d <= to;
}

export function formatMonthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function availabilityFromCount(count, totalEmployees) {
  if (count === 0) return "available";
  const ratio = count / totalEmployees;
  if (count >= 5 || ratio >= 0.2) return "many";
  return "some";
}

export function getApprovedLeavesOnDate(requests, year, month, day) {
  const date = new Date(year, month, day);
  return requests.filter(
    (r) => r.status === "Approved" && isDateInLeaveRange(date, r.from, r.to)
  );
}

/** Build per-day team availability from approved leave requests */
export function buildLeaveCalendarDays(requests, year, month, totalEmployees = 24) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = {};

  for (let d = 1; d <= daysInMonth; d += 1) {
    const onLeave = getApprovedLeavesOnDate(requests, year, month, d);
    const count = onLeave.length;
    days[d] = {
      status: availabilityFromCount(count, totalEmployees),
      count,
      employees: onLeave.map((r) => ({ ...r, status: r.status ?? "Approved" })),
    };
  }
  return days;
}

export function buildMonthCalendarCells(year, month, calendarDays) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ type: "empty" });
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const info = calendarDays[d] ?? { status: "available", count: 0, employees: [] };
    cells.push({
      type: "day",
      day: d,
      status: info.status,
      count: info.count,
      employees: info.employees,
    });
  }

  return cells;
}

export function getApprovedLeavesToday(requests, today = new Date()) {
  return getApprovedLeavesOnDate(
    requests,
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

export function countApprovedThisMonth(requests, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();
  return requests.filter((r) => {
    if (r.status !== "Approved") return false;
    const from = parseLeaveDate(r.from);
    return from.getFullYear() === y && from.getMonth() === m;
  }).length;
}

export function isSameMonthDay(year, month, day, date) {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
}
