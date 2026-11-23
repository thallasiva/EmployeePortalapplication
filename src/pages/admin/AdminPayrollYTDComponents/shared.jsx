const ORANGE = "#e87500";
const TABS = [{
  key: "ytd",
  label: "YTD Summary"
}, {
  key: "pf-ytd",
  label: "PF YTD Statement"
}, {
  key: "reimb",
  label: "Reimbursement Statement"
}];
const fmtINR = v => "₹ " + Number(v || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 0
});
export { ORANGE, TABS, fmtINR };
