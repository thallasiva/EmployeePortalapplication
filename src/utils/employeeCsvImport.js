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

export function mapCsvRowToEmployee(row) {
  return {
    first_name: row.first_name || row.firstname || "",
    last_name: row.last_name || row.lastname || row.lasst_name || "",
    email: row.email || "",
    mobile: row.mobile || row.phone || "",
    employee_id: row.employee_id || row.emp_id || row.emp_code || "",
    emp_job_title: row.emp_job_title || row.job_title || row.role || "Employee",
    department_id: row.department_id || row.department || "1",
    reporting_to: row.reporting_to || row.manager || "Admin User",
    employee_status: row.employee_status || row.status || "Active",
    employee_type: row.employee_type || row.employment_type || "Full-Time",
    assigned_member: row.assigned_member || row.assigned_to || "",
    ctc: row.ctc || row.salary || row.annual_salary || "",
    benefits_plan: row.benefits_plan || row.benefits || "standard",
    emp_joining_date: row.emp_joining_date || row.start_date || "",
    role: row.role === "Admin" || row.role === "1" ? 1 : 2,
  };
}
