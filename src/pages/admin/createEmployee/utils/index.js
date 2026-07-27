export function validateStep(step, values) {
  const errors = {};
  if (step === 0) {
    if (!values.first_name.trim()) errors.first_name = "First name is required";
    if (!values.last_name.trim()) errors.last_name = "Last name is required";
    if (!values.email.trim()) errors.email = "Email is required";
    if (!values.mobile.trim()) errors.mobile = "Phone is required";
    if (!values.employee_id.trim()) errors.employee_id = "Employee ID is required";
  }
  if (step === 1) {
    if (!values.department_id) errors.department_id = "Department is required";
    if (!values.emp_job_title.trim()) errors.emp_job_title = "Role is required";
    if (!values.emp_joining_date) errors.emp_joining_date = "Start date is required";
  }
  if (step === 2) {
    if (!values.ctc) errors.ctc = "Annual salary is required";
  }
  return errors;
}

export function formatSalary(val) {
  return Number(val).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
