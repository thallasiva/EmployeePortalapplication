const tbl = n => Number(n || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
/** Section I — Standard Deduction */
export { tbl };
