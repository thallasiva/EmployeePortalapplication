const tbl = n => Number(n || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const INCOME_ROWS = [{
  key: "basic",
  label: "Basic"
}, {
  key: "hra",
  label: "HRA"
}, {
  key: "special",
  label: "Special Allowance"
}, {
  key: "lta",
  label: "Lta"
}, {
  key: "telephone",
  label: "Telephone And Internet Expenses"
}];
const DED_ROWS = [{
  key: "pf",
  label: "PF"
}, {
  key: "profTax",
  label: "Prof Tax"
}];
/** Section A — Income */
export { tbl, INCOME_ROWS, DED_ROWS };
