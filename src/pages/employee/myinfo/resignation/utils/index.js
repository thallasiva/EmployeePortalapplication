export const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

export const fmtDT = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
};

export function addDays(s, n) {
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export const todayStr = () => new Date().toISOString().split("T")[0];
