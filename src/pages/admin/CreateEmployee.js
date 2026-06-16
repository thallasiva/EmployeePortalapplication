import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import SuccessModal from "../../component/SuccessModal";
import { createEmployee, listEmployees } from "../../api/employee.api";
import { listDepartments } from "../../api/department.api";
import { getErrorMessage } from "../../api/client";
import { errorToast } from "../../utils/ToastControllers";
import "../../component/employee/employee.css";

const STEPS = [
  { id: 0, label: "Personal Info" },
  { id: 1, label: "Employment" },
  { id: 2, label: "Compensation" },
  { id: 3, label: "Statutory & Bank" },
  { id: 4, label: "Review & Confirm" },
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
  // Personal / statutory
  gender: "",
  dob: "",
  marital_status: "",
  father_name: "",
  spouse_name: "",
  aadhaar_number: "",
  aadhaar_name: "",
  aadhaar_enrolment_number: "",
  access_card_number: "",
  access_card_from_date: "",
  access_card_to_date: "",
  pf_number: "",
  pf_join_date: "",
  esi_number: "",
  // Bank details
  bank_name: "",
  account_number: "",
  account_type: "",
  bank_branch: "",
  dd_payable_at: "",
  ifsc_code: "",
  account_holder_name: "",
  payment_type: "",
  pan_number: "",
  uan_number: "",
  // Contact / address
  contact_name: "",
  contact_city: "",
  contact_country: "",
  personal_email: "",
  alternate_mobile: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  permanent_address_line1: "",
  permanent_address_line2: "",
  permanent_address_line3: "",
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
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments()
      .then(setDepartments)
      .catch((err) => errorToast(getErrorMessage(err, "Failed to load departments")));
    listEmployees({ limit: 200 })
      .then(({ data }) => setMembers(data))
      .catch((err) => errorToast(getErrorMessage(err, "Failed to load employees")));
  }, []);

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

  const handleSubmit = async () => {
    const allErrors = { ...validateStep(0, values), ...validateStep(1, values), ...validateStep(2, values) };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      await createEmployee({
        emp_code: values.employee_id,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        mobile: values.mobile,
        department_id: Number(values.department_id),
        emp_job_title: values.emp_job_title,
        reporting_to: values.reporting_to === "none" ? null : Number(values.reporting_to),
        emp_joining_date: values.emp_joining_date,
        employee_type: values.employee_type,
        assigned_member: values.assigned_member || undefined,
        ctc: values.ctc,
        benefits_plan: values.benefits_plan,
        role_id: Number(values.role) || 2,
        gender: values.gender || undefined,
        dob: values.dob || undefined,
        marital_status: values.marital_status || undefined,
        father_name: values.father_name || undefined,
        spouse_name: values.spouse_name || undefined,
        aadhaar_number: values.aadhaar_number || undefined,
        aadhaar_name: values.aadhaar_name || undefined,
        aadhaar_enrolment_number: values.aadhaar_enrolment_number || undefined,
        access_card_number: values.access_card_number || undefined,
        access_card_from_date: values.access_card_from_date || undefined,
        access_card_to_date: values.access_card_to_date || undefined,
        pf_number: values.pf_number || undefined,
        pf_join_date: values.pf_join_date || undefined,
        esi_number: values.esi_number || undefined,
        contactInfo: {
          contact_name: values.contact_name || undefined,
          contact_city: values.contact_city || undefined,
          contact_country: values.contact_country || undefined,
          personal_email: values.personal_email || undefined,
          alternate_mobile: values.alternate_mobile || undefined,
          emergency_contact_name: values.emergency_contact_name || undefined,
          emergency_contact_phone: values.emergency_contact_phone || undefined,
          permanent_address_line1: values.permanent_address_line1 || undefined,
          permanent_address_line2: values.permanent_address_line2 || undefined,
          permanent_address_line3: values.permanent_address_line3 || undefined,
        },
        bankDetails: {
          bank_name: values.bank_name || undefined,
          account_number: values.account_number || undefined,
          account_type: values.account_type || undefined,
          bank_branch: values.bank_branch || undefined,
          dd_payable_at: values.dd_payable_at || undefined,
          ifsc_code: values.ifsc_code || undefined,
          account_holder_name: values.account_holder_name || undefined,
          payment_type: values.payment_type || undefined,
          pan_number: values.pan_number || undefined,
          uan_number: values.uan_number || undefined,
        },
      });
      setShowSuccessModal(true);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to create employee"));
    } finally {
      setSubmitting(false);
    }
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
                    <option key={m.employee_id} value={m.employee_id}>
                      {m.first_name} {m.last_name}
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
                    <option key={`assign-${m.employee_id}`} value={`${m.first_name} ${m.last_name}`}>
                      {m.first_name} {m.last_name}
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
            <h2>Personal & Statutory Details</h2>
            <div className="emp-wizard__grid">
              <Field label="Gender">
                <select value={values.gender} onChange={(e) => setField("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input type="date" value={values.dob} onChange={(e) => setField("dob", e.target.value)} />
              </Field>
              <Field label="Marital Status">
                <select value={values.marital_status} onChange={(e) => setField("marital_status", e.target.value)}>
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Father's Name">
                <input value={values.father_name} onChange={(e) => setField("father_name", e.target.value)} />
              </Field>
              <Field label="Spouse Name">
                <input value={values.spouse_name} onChange={(e) => setField("spouse_name", e.target.value)} />
              </Field>
              <Field label="Aadhaar Number">
                <input value={values.aadhaar_number} onChange={(e) => setField("aadhaar_number", e.target.value)} />
              </Field>
              <Field label="Name As Per Aadhaar">
                <input value={values.aadhaar_name} onChange={(e) => setField("aadhaar_name", e.target.value)} />
              </Field>
              <Field label="Aadhaar Enrolment Number">
                <input value={values.aadhaar_enrolment_number} onChange={(e) => setField("aadhaar_enrolment_number", e.target.value)} />
              </Field>
              <Field label="PAN Number">
                <input value={values.pan_number} onChange={(e) => setField("pan_number", e.target.value)} />
              </Field>
              <Field label="UAN Number">
                <input value={values.uan_number} onChange={(e) => setField("uan_number", e.target.value)} />
              </Field>
              <Field label="PF Number">
                <input value={values.pf_number} onChange={(e) => setField("pf_number", e.target.value)} />
              </Field>
              <Field label="PF Join Date">
                <input type="date" value={values.pf_join_date} onChange={(e) => setField("pf_join_date", e.target.value)} />
              </Field>
              <Field label="ESI Number">
                <input value={values.esi_number} onChange={(e) => setField("esi_number", e.target.value)} />
              </Field>
              <Field label="Access Card Number">
                <input value={values.access_card_number} onChange={(e) => setField("access_card_number", e.target.value)} />
              </Field>
              <Field label="Access Card From Date">
                <input type="date" value={values.access_card_from_date} onChange={(e) => setField("access_card_from_date", e.target.value)} />
              </Field>
              <Field label="Access Card To Date">
                <input type="date" value={values.access_card_to_date} onChange={(e) => setField("access_card_to_date", e.target.value)} />
              </Field>
            </div>

            <h2>Bank Details</h2>
            <div className="emp-wizard__grid">
              <Field label="Bank Name">
                <input value={values.bank_name} onChange={(e) => setField("bank_name", e.target.value)} />
              </Field>
              <Field label="Bank Account Number">
                <input value={values.account_number} onChange={(e) => setField("account_number", e.target.value)} />
              </Field>
              <Field label="Bank Account Type">
                <select value={values.account_type} onChange={(e) => setField("account_type", e.target.value)}>
                  <option value="">Select type</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </Field>
              <Field label="Bank Branch">
                <input value={values.bank_branch} onChange={(e) => setField("bank_branch", e.target.value)} />
              </Field>
              <Field label="IFSC Code">
                <input value={values.ifsc_code} onChange={(e) => setField("ifsc_code", e.target.value)} />
              </Field>
              <Field label="DD Payable At">
                <input value={values.dd_payable_at} onChange={(e) => setField("dd_payable_at", e.target.value)} />
              </Field>
              <Field label="Name As Per Bank">
                <input value={values.account_holder_name} onChange={(e) => setField("account_holder_name", e.target.value)} />
              </Field>
              <Field label="Payment Type">
                <select value={values.payment_type} onChange={(e) => setField("payment_type", e.target.value)}>
                  <option value="">Select type</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </Field>
            </div>

            <h2>Contact & Address</h2>
            <div className="emp-wizard__grid">
              <Field label="Contact Name">
                <input value={values.contact_name} onChange={(e) => setField("contact_name", e.target.value)} />
              </Field>
              <Field label="Contact Email">
                <input type="email" value={values.personal_email} onChange={(e) => setField("personal_email", e.target.value)} />
              </Field>
              <Field label="Contact Mobile">
                <input value={values.alternate_mobile} onChange={(e) => setField("alternate_mobile", e.target.value)} />
              </Field>
              <Field label="Contact City">
                <input value={values.contact_city} onChange={(e) => setField("contact_city", e.target.value)} />
              </Field>
              <Field label="Contact Country">
                <input value={values.contact_country} onChange={(e) => setField("contact_country", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Name">
                <input value={values.emergency_contact_name} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Mobile">
                <input value={values.emergency_contact_phone} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
              </Field>
              <Field label="Permanent Address Line 1">
                <input value={values.permanent_address_line1} onChange={(e) => setField("permanent_address_line1", e.target.value)} />
              </Field>
              <Field label="Permanent Address Line 2">
                <input value={values.permanent_address_line2} onChange={(e) => setField("permanent_address_line2", e.target.value)} />
              </Field>
              <Field label="Permanent Address Line 3">
                <input value={values.permanent_address_line3} onChange={(e) => setField("permanent_address_line3", e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
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
                <div><dt>Department</dt><dd>{departments.find((d) => String(d.department_id) === String(values.department_id))?.department_name || "—"}</dd></div>
                <div><dt>Role</dt><dd>{values.emp_job_title}</dd></div>
                <div><dt>Manager</dt><dd>{
                  values.reporting_to === "none"
                    ? "None"
                    : (() => {
                        const m = members.find((x) => String(x.employee_id) === String(values.reporting_to));
                        return m ? `${m.first_name} ${m.last_name}` : "—";
                      })()
                }</dd></div>
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
            <div className="emp-review-section">
              <h3>Statutory & Bank</h3>
              <dl className="emp-review-grid">
                <div><dt>Aadhaar Number</dt><dd>{values.aadhaar_number || "—"}</dd></div>
                <div><dt>PAN Number</dt><dd>{values.pan_number || "—"}</dd></div>
                <div><dt>UAN Number</dt><dd>{values.uan_number || "—"}</dd></div>
                <div><dt>PF Number</dt><dd>{values.pf_number || "—"}</dd></div>
                <div><dt>Bank Name</dt><dd>{values.bank_name || "—"}</dd></div>
                <div><dt>Account Number</dt><dd>{values.account_number || "—"}</dd></div>
                <div><dt>IFSC Code</dt><dd>{values.ifsc_code || "—"}</dd></div>
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
            <button
              type="button"
              className="emp-wizard__btn emp-wizard__btn--create disabled:opacity-60"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Check size={16} />
              {submitting ? "Creating..." : "Create Employee"}
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
