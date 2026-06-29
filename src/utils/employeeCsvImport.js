import { EMPLOYEE_FIELD_MAP, parseBooleanFlag } from "./employeeFieldMap";

/** Triggers a browser download of the employee CSV import template. */
export function downloadEmployeeCsvTemplate(filename = "employee_import_template.csv") {
  const a = document.createElement("a");
  a.href = "/templates/employee_import_template.csv";
  a.download = filename;
  a.click();
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(header) {
  return header.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "");
}

export function parseEmployeeCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (values.every((v) => !v)) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Maps a parsed CSV row (using the HR employee data template headers) into
 * the shape expected by the Employee API: a flat `employee` object plus
 * nested `contactInfo` / `bankDetails` objects. `managerEmployeeNumber`
 * carries the raw "Manager Employee Number" value so the caller can resolve
 * it to a `reporting_to` employee_id by looking up emp_code.
 */
export function mapCsvRowToEmployee(row) {
  const employee = {};
  const contactInfo = {};
  const bankDetails = {};
  let managerEmployeeNumber = "";

  for (const field of EMPLOYEE_FIELD_MAP) {
    const value = row[field.key];
    if (value === undefined || value === "") continue;

    switch (field.group) {
      case "employee":
        if (field.column === "dob") {
          if (!employee.dob) employee.dob = value;
        } else if (field.column === "has_left_organization") {
          employee.has_left_organization = parseBooleanFlag(value) ? 1 : 0;
        } else {
          employee[field.column] = value;
        }
        break;
      case "contact":
        contactInfo[field.column] = value;
        break;
      case "bank":
        bankDetails[field.column] = value;
        break;
      case "manager":
        managerEmployeeNumber = value;
        break;
      default:
        break;
    }
  }

  // "Employee Name" -> first_name / last_name
  const fullName = (row.employee_name || "").trim();
  if (fullName) {
    const parts = fullName.split(/\s+/);
    employee.first_name = parts[0];
    employee.last_name = parts.slice(1).join(" ");
  }

  // Fallbacks for legacy/loose CSV headers
  employee.first_name = employee.first_name || row.first_name || row.firstname || "";
  employee.last_name = employee.last_name || row.last_name || row.lastname || "";
  employee.email = employee.email || row.email || "";
  employee.mobile = row.mobile || row.phone || contactInfo.alternate_mobile || "";
  employee.emp_job_title = row.emp_job_title || row.job_title || "Employee";
  employee.department_id = row.department_id || row.department || "";
  employee.employee_type = row.employee_type || row.employment_type || "Full-Time";
  employee.employee_status = employee.has_left_organization
    ? "Inactive"
    : row.employee_status || row.status || "Active";
  employee.ctc = row.ctc || row.salary || row.annual_salary || "";
  employee.benefits_plan = row.benefits_plan || row.benefits || "standard";
  employee.assigned_member = row.assigned_member || row.assigned_to || "";
  employee.role = row.role === "Admin" || row.role === "1" ? 1 : 2;

  return { employee, contactInfo, bankDetails, managerEmployeeNumber };
}
