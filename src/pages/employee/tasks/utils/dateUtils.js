import { DAYS } from "../constants/taskConstants";

export function getWeekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + 1 + offsetWeeks * 7);
  const dates = DAYS.map((_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
  return {
    weekStart: mon.toISOString().slice(0, 10),
    weekEnd: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6)
      .toISOString()
      .slice(0, 10),
    dates,
  };
}

export function fmt(date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function toDateStr(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

export function calcTimeDiff(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return parseFloat((diff / 60).toFixed(2));
}

export function calcDateDiff(start, end) {
  if (!start || !end) return null;
  const s = new Date(start),
    e = new Date(end);
  if (isNaN(s) || isNaN(e)) return null;
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : null;
}

export function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return isNaN(d)
    ? str
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDuration(hours) {
  if (hours == null || hours === "" || isNaN(Number(hours))) return "—";
  const totalMins = Math.round(Number(hours) * 60);
  if (totalMins === 0) return "—";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return m === 0 ? `${hh}hr` : `${hh}h:${mm}min`;
}
