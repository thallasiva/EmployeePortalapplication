export const fmtINR = (v) =>
  "₹ " + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });
