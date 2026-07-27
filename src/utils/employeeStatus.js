import { cssClass, joinClasses } from "./classStyles";







export function getEmployeeStatus(employee) {
  if (!employee) return { label: "Unknown", bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };


  if (employee.serving_notice) {
    return { label: "Notice Period", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  }

  const raw = (employee.employee_status || "Active").trim();

  switch (raw) {
    case "Active":
      return { label: "Active", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    case "Notice Period":
      return { label: "Notice Period", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
    case "Resigned":
      return { label: "Resigned", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    case "Inactive":
      return { label: "Inactive", bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
    default:
      return { label: raw, bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
  }
}





export function EmployeeStatusBadge({ employee, style = {} }) {
  const { label, bg, color, border } = getEmployeeStatus(employee);
  return (
    <span className={cssClass({
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, padding: "3px 10px",
      borderRadius: 999, background: bg, color, border: `1px solid ${border}`,
      whiteSpace: "nowrap", ...style
    })}>
      {label === "Active" &&
      <span className={cssClass({ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 })} />
      }
      {label}
    </span>);

}
