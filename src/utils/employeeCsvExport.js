import { EMPLOYEE_FIELD_MAP, EXPORT_EXTRA_COLUMNS } from "./employeeFieldMap";

function csvEscape(value) {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getFieldValue(employee, field) {
  switch (field.group) {
    case "derived":
      return `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    case "manager":
      return employee.reporting_to_code || "";
    case "employee":
      if (field.column === "has_left_organization") {
        return employee.has_left_organization ? "Yes" : "No";
      }
      return employee[field.column] ?? "";
    case "contact":
    case "bank":
      return employee[field.column] ?? "";
    default:
      return "";
  }
}

/** Builds CSV text (with header row) for the full employee list/template. */
export function buildEmployeeCsv(employees) {
  const headers = [
    ...EMPLOYEE_FIELD_MAP.map((f) => f.header),
    ...EXPORT_EXTRA_COLUMNS.map((c) => c.header),
  ];
  const lines = [headers.map(csvEscape).join(",")];

  for (const emp of employees) {
    const row = [
      ...EMPLOYEE_FIELD_MAP.map((f) => csvEscape(getFieldValue(emp, f))),
      ...EXPORT_EXTRA_COLUMNS.map((c) => csvEscape(c.get(emp))),
    ];
    lines.push(row.join(","));
  }

  return lines.join("\r\n");
}

/** Triggers a browser download of the full employee list as a CSV file. */
export function downloadEmployeeCsv(employees, filename = "employees.csv") {
  const csv = buildEmployeeCsv(employees);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
