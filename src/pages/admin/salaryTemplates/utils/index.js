export const pct = (v) => `${Number(v).toFixed(2)}%`;
export const money = (v) => v > 0 ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
export const yn = (v) => v ? "Yes" : "No";
