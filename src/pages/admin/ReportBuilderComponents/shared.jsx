const BRAND = "#e87500";
const MODULES = {
  Employees: ["Name", "Employee ID", "Department", "Designation", "Email", "Phone", "Join Date", "Status", "Gender", "Location"],
  Attendance: ["Employee", "Date", "Check In", "Check Out", "Hours Worked", "Status", "Late By", "OT Hours"],
  Leave: ["Employee", "Leave Type", "From", "To", "Days", "Status", "Applied On", "Approved By"],
  Payroll: ["Employee", "Month", "Gross", "Basic", "HRA", "Allowances", "Deductions", "Net Pay", "TDS", "PF"],
  Recruitment: ["Job Title", "Candidate", "Stage", "Applied On", "Source", "Interviewer", "Status", "Offer Date"],
  Performance: ["Employee", "Review Period", "Rating", "Goals Met", "KPIs", "Reviewer", "Status"],
  Helpdesk: ["Ticket ID", "Employee", "Subject", "Category", "Priority", "Status", "Created", "Resolved"]
};
const FILTERS_FOR = {
  Employees: ["Department", "Designation", "Status", "Gender", "Location", "Join Date Range"],
  Attendance: ["Date Range", "Status", "Department", "Employee"],
  Leave: ["Leave Type", "Status", "Date Range", "Department"],
  Payroll: ["Month", "Department", "Status"],
  Recruitment: ["Stage", "Status", "Source", "Date Range"],
  Performance: ["Review Period", "Rating", "Department"],
  Helpdesk: ["Priority", "Status", "Category", "Date Range"]
};
const COLUMN_ALIASES = {
  "Employee": ["employee_name", "name", "full_name"],
  "Name": ["employee_name", "name", "full_name"],
  "Employee ID": ["emp_code", "employee_id", "employee_number"],
  "Department": ["department_name", "department", "dept_name"],
  "Designation": ["designation", "emp_job_title", "job_title"],
  "Join Date": ["emp_joining_date", "joining_date"],
  "Date": ["date", "attendance_date", "created_at"],
  "Check In": ["check_in", "check_in_time", "first_in"],
  "Check Out": ["check_out", "check_out_time", "last_out"],
  "Hours Worked": ["work_hours", "hours_worked", "total_hours"],
  "Late By": ["late_by_minutes", "late_by"],
  "From": ["from_date", "start_date"],
  "To": ["to_date", "end_date"],
  "Days": ["days", "leave_days"],
  "Month": ["month", "pay_month"],
  "Gross": ["gross_earnings", "gross_salary", "gross"],
  "Net Pay": ["net_pay", "net_salary"],
  "Job Title": ["job_title", "title"],
  "Candidate": ["candidate_name", "candidate"],
  "Applied On": ["applied_at", "created_at"]
};
function columnValue(row, label) {
  const keys = [...(COLUMN_ALIASES[label] || []), label.toLowerCase().replace(/[^a-z0-9]/g, "_")];
  const key = keys.find(candidate => row[candidate] !== undefined);
  return key ? row[key] ?? "—" : "—";
}
export { BRAND, MODULES, FILTERS_FOR, COLUMN_ALIASES, columnValue };
