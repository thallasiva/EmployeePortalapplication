const BASE_EMPLOYEES = [
  { name: "Anthony Lewis", role: "Finance" },
  { name: "Brian Villalobos", role: "Developer" },
  { name: "Harvey Smith", role: "Developer" },
  { name: "Stephan Peralt", role: "Executive Officer" },
  { name: "Doglas Martini", role: "Manager" },
  { name: "Maria Garcia", role: "Sales" },
  { name: "David Park", role: "Engineering Lead" },
  { name: "Sarah Chen", role: "HR" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function hashSeed(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatReportDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatWeekRange(weekStart) {
  const end = addDays(weekStart, 6);
  return `${formatReportDate(weekStart)} - ${formatReportDate(end)}`;
}

export function shiftWeek(weekStart, direction) {
  return addDays(weekStart, direction * 7);
}

export function isSameWeek(a, b) {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}

function pickStatus(seed) {
  const mod = seed % 100;
  if (mod < 6) return "Absent";
  if (mod < 14) return "On Leave";
  if (mod < 24) return "Late";
  return "Present";
}

function buildTimes(seed, status) {
  if (status === "Absent" || status === "On Leave") {
    return {
      checkIn: "—",
      checkOut: "—",
      break: "—",
      late: "—",
      overtime: "—",
      production: "0 Hrs",
      productionGood: false,
    };
  }

  const lateMins = status === "Late" ? 10 + (seed % 35) : seed % 8;
  const checkInHour = status === "Late" ? 9 : 8;
  const checkInMin = status === "Late" ? lateMins : 50 + (seed % 10);
  const prodHours = status === "Late" ? 7.5 + (seed % 3) * 0.1 : 8.2 + (seed % 8) * 0.05;
  const productionGood = prodHours >= 8.5;

  const checkIn = `${String(checkInHour).padStart(2, "0")}:${String(checkInMin).padStart(2, "0")} AM`;
  const checkOutMin = 45 + (seed % 15);
  const checkOut = `06:${String(checkOutMin).padStart(2, "0")} PM`;

  return {
    checkIn,
    checkOut,
    break: `${25 + (seed % 20)} Min`,
    late: `${lateMins} Min`,
    overtime: `${seed % 25} Min`,
    production: `${prodHours.toFixed(2)} Hrs`,
    productionGood,
  };
}

export function generateWeekAttendance(weekStart) {
  const weekDates = getWeekDates(weekStart);
  const rows = [];

  weekDates.forEach((date) => {
    const dayIndex = date.getDay();
    const isWeekend = dayIndex === 0 || dayIndex === 6;

    BASE_EMPLOYEES.forEach((employee, empIndex) => {
      const dateKey = formatReportDate(date);
      const seed = hashSeed(`${employee.name}-${dateKey}`);

      if (isWeekend) {
        rows.push({
          id: `${employee.name}-${dateKey}`,
          name: employee.name,
          role: employee.role,
          date: dateKey,
          dateObj: date,
          weekday: WEEKDAY_LABELS[dayIndex === 0 ? 6 : dayIndex - 1],
          checkIn: "—",
          checkOut: "—",
          break: "—",
          late: "—",
          overtime: "—",
          production: "—",
          productionGood: false,
          status: "Weekend",
          regularized: false,
        });
        return;
      }

      const status = pickStatus(seed + empIndex);
      const times = buildTimes(seed, status);

      rows.push({
        id: `${employee.name}-${dateKey}`,
        name: employee.name,
        role: employee.role,
        date: dateKey,
        dateObj: date,
        weekday: WEEKDAY_LABELS[dayIndex - 1],
        status,
        regularized: false,
        ...times,
      });
    });
  });

  return rows.sort((a, b) => {
    const dateDiff = a.dateObj - b.dateObj;
    if (dateDiff !== 0) return dateDiff;
    return a.name.localeCompare(b.name);
  });
}

export function summarizeWeek(rows) {
  const workingRows = rows.filter((r) => r.status !== "Weekend");
  const present = workingRows.filter((r) => r.status === "Present").length;
  const absent = workingRows.filter((r) => r.status === "Absent").length;
  const leave = workingRows.filter((r) => r.status === "On Leave").length;
  const late = workingRows.filter((r) => r.status === "Late").length;
  const workingDays = new Set(
    workingRows.map((r) => r.date)
  ).size;

  return {
    workingDays,
    present,
    absent,
    leave,
    late,
    halfdays: Math.floor(late / 2),
  };
}

export function buildWeekChart(weekStart, rows) {
  const weekDates = getWeekDates(weekStart);
  const labels = [];
  const present = [];
  const absent = [];

  weekDates.forEach((date) => {
    const dateKey = formatReportDate(date);
    const dayIndex = date.getDay();
    const label =
      dayIndex === 0 || dayIndex === 6
        ? WEEKDAY_LABELS[dayIndex === 0 ? 6 : dayIndex - 1]
        : WEEKDAY_LABELS[dayIndex - 1];

    labels.push(`${label} ${date.getDate()}`);

    const dayRows = rows.filter((r) => r.date === dateKey && r.status !== "Weekend");
    present.push(dayRows.filter((r) => r.status === "Present" || r.status === "Late").length);
    absent.push(dayRows.filter((r) => r.status === "Absent" || r.status === "On Leave").length);
  });

  return { labels, present, absent };
}

export function buildWeekStats(summary) {
  return [
    {
      label: "Total Working Days",
      value: summary.workingDays,
      icon: "calendar",
      color: "#f97316",
      trend: "Current selected week",
    },
    {
      label: "Total Leave Taken",
      value: summary.leave,
      icon: "leave",
      color: "#3b82f6",
      trend: "Current selected week",
    },
    {
      label: "Total Absent",
      value: summary.absent,
      icon: "holiday",
      color: "#ec4899",
      trend: "Current selected week",
    },
    {
      label: "Total Late",
      value: summary.late,
      icon: "halfday",
      color: "#eab308",
      trend: "Current selected week",
    },
  ];
}
