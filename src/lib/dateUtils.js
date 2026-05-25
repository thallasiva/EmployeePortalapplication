/** Fiscal year starts in April (common for IN payroll). */
export const FISCAL_YEAR_START_MONTH = 3; // April (0-indexed)

export function getCurrentFiscalYearStart() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= FISCAL_YEAR_START_MONTH ? year : year - 1;
}

export function getYearOptions(rangeBefore = 8, rangeAfter = 3) {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - rangeBefore; y <= current + rangeAfter; y += 1) {
    years.push(y);
  }
  return years;
}

export function getFiscalYearLabel(startYear) {
  const start = Number(startYear);
  return `${start} - ${start + 1}`;
}

export function getFiscalYearRangeLabel(startYear) {
  const start = Number(startYear);
  return `01 Apr, ${start} - 31 Mar, ${start + 1}`;
}

export function getFiscalMonthColumns(fiscalYearStart) {
  const start = Number(fiscalYearStart);
  const monthNames = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];
  const keys = [
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
    "jan",
    "feb",
    "mar",
  ];

  return monthNames.map((name, index) => {
    const year = index < 9 ? start : start + 1;
    return { key: keys[index], label: `${name} ${year}` };
  });
}

export function formatMonthYear(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function getCurrentPayslipMonthLabel() {
  return formatMonthYear(new Date());
}

export function toISODateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export function getUserGreetingName() {
  const user = getLoggedInUser();
  if (user?.name) {
    return user.name.split(" ")[0];
  }
  if (user?.email) {
    return user.email.split("@")[0];
  }
  return "there";
}

export function getUserInitials(name) {
  if (!name) return "TM";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Build ISO holiday dates for a calendar year from month-day pairs. */
export function holidaysForYear(year, monthDayList) {
  return monthDayList.map(({ month, day }) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  });
}
