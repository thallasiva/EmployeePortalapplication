import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import SuccessModal from "../../component/SuccessModal";
import { addEmployee, getDepartments, getEmployeeList } from "../../data/employees";
import { getDepartmentName } from "../../utils/employeeDisplay";
import { successToast } from "../../utils/ToastControllers";
import "../../component/employee/employee.css";

const STEPS = [
  { id: 0, label: "Personal Info" },
  { id: 1, label: "Employment" },
  { id: 2, label: "Compensation" },
  { id: 3, label: "Review & Confirm" },
];

const INITIAL_VALUES = {
  employee_id: "",
  first_name: "",
  last_name: "",
  email: "",
  mobile: "",
  department_id: "",
  emp_job_title: "",
  reporting_to: "none",
  emp_joining_date: "",
  employee_type: "Full-Time",
  assigned_member: "",
  ctc: "",
  benefits_plan: "standard",
  role: "2",
};

function validateStep(step, values) {
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

function Field({ label, required, error, children }) {
  return (
    <div className="emp-field">
      <label>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {error && <p className="emp-field__error">{error}</p>}
    </div>
  );
}

export default function CreateEmployee() {
  const navigate = useNavigate();
  const departments = getDepartments();
  const members = useMemo(() => getEmployeeList(), []);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const allErrors = { ...validateStep(0, values), ...validateStep(1, values), ...validateStep(2, values) };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(0);
      return;
    }

    const response = addEmployee({
      ...values,
      emp_code: values.employee_id,
      reporting_to: values.reporting_to === "none" ? "No" : values.reporting_to,
    });
    successToast("Employee Created");
    setShowSuccessModal(true);
    return response;
  };

  const formatSalary = (val) =>
    Number(val).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const formatDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="emp-wizard__header">
        <h1>Add New Employee</h1>
        <p>Complete all steps to add a new employee to the organization.</p>
      </div>

      <div className="emp-stepper">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="emp-stepper__item">
              <span
                className={`emp-stepper__circle ${
                  step > s.id ? "is-done" : step === s.id ? "is-active" : ""
                }`}
              >
                {step > s.id ? <Check size={14} /> : s.id + 1}
              </span>
              <span className={`emp-stepper__label ${step === s.id ? "is-active" : ""}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`emp-stepper__line ${step > s.id ? "is-done" : ""}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="emp-wizard__card">
        {step === 0 && (
          <>
            <h2>Personal Information</h2>
            <div className="emp-wizard__grid">
              <Field label="Employee ID" required error={errors.employee_id}>
                <input
                  value={values.employee_id}
                  onChange={(e) => setField("employee_id", e.target.value)}
                  placeholder="e.g. EMP-007"
                />
              </Field>
              <Field label="First Name" required error={errors.first_name}>
                <input
                  value={values.first_name}
                  onChange={(e) => setField("first_name", e.target.value)}
                  placeholder="First name"
                />
              </Field>
              <Field label="Last Name" required error={errors.last_name}>
                <input
                  value={values.last_name}
                  onChange={(e) => setField("last_name", e.target.value)}
                  placeholder="Last name"
                />
              </Field>
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="email@company.com"
                />
              </Field>
              <Field label="Phone" required error={errors.mobile}>
                <input
                  value={values.mobile}
                  onChange={(e) => setField("mobile", e.target.value)}
                  placeholder="Phone number"
                />
              </Field>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Employment Details</h2>
            <div className="emp-wizard__grid">
              <Field label="Department" required error={errors.department_id}>
                <select
                  value={values.department_id}
                  onChange={(e) => setField("department_id", e.target.value)}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role" required error={errors.emp_job_title}>
                <input
                  value={values.emp_job_title}
                  onChange={(e) => setField("emp_job_title", e.target.value)}
                  placeholder="Job title / role"
                />
              </Field>
              <Field label="Manager">
                <select
                  value={values.reporting_to}
                  onChange={(e) => setField("reporting_to", e.target.value)}
                >
                  <option value="none">None</option>
                  {members.map((m) => (
                    <option key={m.employee_id} value={`${m.first_name} ${m.lasst_name}`}>
                      {m.first_name} {m.lasst_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assign to Specific Member">
                <select
                  value={values.assigned_member}
                  onChange={(e) => setField("assigned_member", e.target.value)}
                >
                  <option value="">None</option>
                  {members.map((m) => (
                    <option key={`assign-${m.employee_id}`} value={`${m.first_name} ${m.lasst_name}`}>
                      {m.first_name} {m.lasst_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start Date" required error={errors.emp_joining_date}>
                <input
                  type="date"
                  value={values.emp_joining_date}
                  onChange={(e) => setField("emp_joining_date", e.target.value)}
                />
              </Field>
              <Field label="Employment Type">
                <select
                  value={values.employee_type}
                  onChange={(e) => setField("employee_type", e.target.value)}
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Compensation</h2>
            <div className="emp-wizard__grid">
              <Field label="Annual Salary (USD)" required error={errors.ctc}>
                <input
                  type="number"
                  value={values.ctc}
                  onChange={(e) => setField("ctc", e.target.value)}
                  placeholder="e.g. 75000"
                />
              </Field>
              <Field label="Benefits Plan">
                <select
                  value={values.benefits_plan}
                  onChange={(e) => setField("benefits_plan", e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="basic">Basic</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Review & Confirm</h2>
            <div className="emp-review-section">
              <h3>Personal Information</h3>
              <dl className="emp-review-grid">
                <div><dt>Employee ID</dt><dd>{values.employee_id}</dd></div>
                <div><dt>Name</dt><dd>{values.first_name} {values.last_name}</dd></div>
                <div><dt>Email</dt><dd>{values.email}</dd></div>
                <div><dt>Phone</dt><dd>{values.mobile}</dd></div>
              </dl>
            </div>
            <div className="emp-review-section">
              <h3>Employment Details</h3>
              <dl className="emp-review-grid">
                <div><dt>Department</dt><dd>{getDepartmentName(values.department_id)}</dd></div>
                <div><dt>Role</dt><dd>{values.emp_job_title}</dd></div>
                <div><dt>Manager</dt><dd>{values.reporting_to === "none" ? "None" : values.reporting_to}</dd></div>
                <div><dt>Assigned Member</dt><dd>{values.assigned_member || "None"}</dd></div>
                <div><dt>Start Date</dt><dd>{formatDate(values.emp_joining_date)}</dd></div>
                <div><dt>Type</dt><dd><span className="emp-type-badge">{values.employee_type}</span></dd></div>
              </dl>
            </div>
            <div className="emp-review-section">
              <h3>Compensation</h3>
              <dl className="emp-review-grid">
                <div><dt>Salary</dt><dd>{values.ctc ? `${formatSalary(values.ctc)}/yr` : "—"}</dd></div>
                <div><dt>Benefits</dt><dd style={{ textTransform: "capitalize" }}>{values.benefits_plan}</dd></div>
              </dl>
            </div>
          </>
        )}
      </div>

      <div className="emp-wizard__footer">
        {step > 0 ? (
          <button type="button" className="emp-wizard__btn emp-wizard__btn--prev" onClick={goPrev}>
            <ChevronLeft size={16} />
            Previous
          </button>
        ) : (
          <span />
        )}
        <div className="emp-wizard__footer-right">
          <button type="button" className="emp-wizard__btn emp-wizard__btn--cancel" onClick={() => navigate("/dashboard/employee")}>
            Cancel
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="emp-wizard__btn emp-wizard__btn--next" onClick={goNext}>
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="emp-wizard__btn emp-wizard__btn--create" onClick={handleSubmit}>
              <Check size={16} />
              Create Employee
            </button>
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Success!"
        message="Employee created successfully."
        okLabel="Ok"
        onConfirm={() => navigate("/dashboard/employee")}
        onClose={() => navigate("/dashboard/employee")}
      />
    </div>
  );
}
