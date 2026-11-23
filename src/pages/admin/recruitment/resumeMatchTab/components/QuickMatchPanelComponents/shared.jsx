/* ── Helpers ── */
const fmt = n => n ? `₹${Number(n).toLocaleString("en-IN")}` : null;
const fmtDays = d => d === 0 ? "Immediate" : d ? `${d} days` : null;
export { fmt, fmtDays };
