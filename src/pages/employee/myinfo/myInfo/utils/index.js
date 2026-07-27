export const dash = (v) => v && String(v).trim() ? v : "—";

export const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

export const calcAge = (d) => {
  if (!d) return "";
  return `${Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000))}y`;
};

export const mask = (v, show) => {
  if (!v) return "—";
  if (show) return v;
  return "X".repeat(Math.max(String(v).length - 4, 4)) + String(v).slice(-4);
};

export const noticeDays = (lwd) => {
  if (!lwd) return 0;
  return Math.max(0, Math.round((new Date(lwd) - new Date()) / (1000 * 60 * 60 * 24)));
};

export const minDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
