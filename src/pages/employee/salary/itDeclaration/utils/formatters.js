export const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

export const fmtDec = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
