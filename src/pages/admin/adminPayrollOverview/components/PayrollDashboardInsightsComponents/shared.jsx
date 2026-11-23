const formatMoney = (value, currency = "INR", compact = false) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency,
  notation: compact ? "compact" : "standard",
  maximumFractionDigits: compact ? 1 : 2
}).format(Number(value || 0));
const csvValue = value => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};
const EMPTY_ROWS = [];
function downloadReport(data, label) {
  const lines = [["Section", "Name", "Employees", "Gross", "Deductions", "Net", "Employer Cost"], ...data.departments.map(row => ["Department", row.department, row.employees, row.gross, "", row.net, row.employerContributions]), ...data.components.map(row => [row.category, row.label, "", row.category === "Earning" ? row.amount : "", row.category === "Deduction" ? row.amount : "", "", row.category === "Employer Contribution" ? row.amount : ""])];
  const csv = lines.map(row => row.map(csvValue).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], {
    type: "text/csv;charset=utf-8"
  }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `payroll-dashboard-${label.replace(/\s+/g, "-").toLowerCase()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
export { formatMoney, csvValue, EMPTY_ROWS, downloadReport };
