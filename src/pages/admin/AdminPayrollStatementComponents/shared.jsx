const ORANGE = "#e87500";
const TABS = [{
  key: "quick",
  label: "Quick Salary Statement"
}, {
  key: "statement",
  label: "Payroll Statement"
}, {
  key: "ctc",
  label: "CTC Payslip"
}, {
  key: "diff",
  label: "Payroll Differences"
}];
const fmtINR = v => "₹ " + Number(v || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 0
});
export { ORANGE, TABS, fmtINR };
