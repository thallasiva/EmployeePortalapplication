export function toYMD(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function sameMonthDay(dateStr, day, month) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getDate() === day && d.getMonth() + 1 === month;
}

export function leaveCoversDay(from, to, year, month, day) {
  const target = new Date(year, month - 1, day);
  const f = new Date(from);
  const t = new Date(to);
  f.setHours(0, 0, 0, 0);
  t.setHours(23, 59, 59, 999);
  return target >= f && target <= t;
}

export function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const grid = [];
  let day = 1;
  let nextDay = 1;

  for (let week = 0; week < 6; week++) {
    const row = [];
    for (let dow = 0; dow < 7; dow++) {
      const cell = week * 7 + dow;
      if (cell < firstDay) {
        row.push({ day: prevMonthDays - firstDay + cell + 1, current: false, prev: true });
      } else if (day > daysInMonth) {
        row.push({ day: nextDay++, current: false, next: true });
      } else {
        row.push({ day: day++, current: true });
      }
    }
    grid.push(row);
    if (day > daysInMonth && week >= 3) break;
  }
  return grid;
}
