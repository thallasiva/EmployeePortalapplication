import React, { useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Edit2, Save, X as Cancel,
  User, Briefcase, DollarSign, Building2, CreditCard, MapPin } from
"lucide-react";
import {
  getEmployee, updateEmployee, updateBankDetails, updateContactInfo } from
"../../api/employee.api";
import { getManagers } from "../../api/orgHierarchy.api";
import { listDepartments } from "../../api/department.api";
import { calculatePayslip } from "./PayRollForm";
import { getErrorMessage } from "../../api/client";
import { errorToast, successToast } from "../../utils/ToastControllers";
import { avatarDataUri } from "../../lib/placeholders";
import { EmployeeStatusBadge } from "../../utils/employeeStatus";
import "../../component/employee/employee.css";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";

function fmt(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toDateInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/* ── View-mode field row ── */
function Row({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || value === 0 ? value : "—"}</dd>
    </div>);

}

/* ── Yup schema ── */
const employeeSchema = Yup.object({
  first_name: Yup.string().trim().required("First name is required"),
  last_name: Yup.string().nullable(),
  email: Yup.string().trim().email("Enter a valid email").required("Email is required"),
  mobile: Yup.string().trim().matches(/^[0-9+\s\-()]{7,15}$/, "Enter a valid mobile number").required("Mobile is required"),
  gender: Yup.string().nullable(),
  dob: Yup.string().nullable(),
  marital_status: Yup.string().nullable(),
  blood_group: Yup.string().nullable(),
  department_id: Yup.string().required("Department is required"),
  emp_job_title: Yup.string().trim().required("Job title is required"),
  emp_joining_date: Yup.string().required("Date of joining is required"),
  employee_type: Yup.string().required("Employee type is required"),
  employee_status: Yup.string().required("Employee status is required"),
  emp_exit_date: Yup.string().nullable().
  test("exit-after-join", "Leaving date must be after joining date", function (val) {
    const { emp_joining_date } = this.parent;
    if (!val || !emp_joining_date) return true;
    return val > emp_joining_date;
  }),
  ctc: Yup.number().typeError("CTC must be a number").nullable().
  min(0, "CTC cannot be negative"),
  base_salary: Yup.number().typeError("Base salary must be a number").nullable().
  min(0, "Base salary cannot be negative"),
  aadhaar_number: Yup.string().nullable().
  matches(/^[0-9]{12}$|^$/, "Aadhaar must be 12 digits"),
  pf_number: Yup.string().nullable(),
  esi_number: Yup.string().nullable()
});

/* ── Edit-mode field wrapper (shows error + required star) ── */
function Field({ label, required, error, touched, children }) {
  const showErr = touched && error;
  return (
    <div className={cssClass({ marginBottom: 14 })}>
      <label className={cssClass({
        display: "block", fontSize: 11, fontWeight: 600,
        color: showErr ? "#dc2626" : "#6b7280",
        textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.04em"
      })}>
        {label}{required && <span className={cssClass({ color: "#dc2626", marginLeft: 2 })}>*</span>}
      </label>
      {children}
      {showErr &&
      <div className={cssClass({ fontSize: 11, color: "#dc2626", marginTop: 3,
        display: "flex", alignItems: "center", gap: 3 })}>
          <span>⚠</span> {error}
        </div>
      }
    </div>);

}

const baseInp = (hasErr) => ({
  border: `1px solid ${hasErr ? "#dc2626" : "#d1d5db"}`,
  borderRadius: 7, padding: "7px 10px",
  fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none",
  background: hasErr ? "#fff5f5" : "#fff",
  transition: "border-color .15s"
});

/* plain style constant for non-validated fields */
const inp = baseInp(false);

function Input({ label, value, onChange, onBlur, type = "text", required, error, touched, ...rest }) {
  const hasErr = touched && error;
  return (
    <Field label={label} required={required} error={error} touched={touched}>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}

        {...rest} className={cssClass(baseInp(hasErr))} />
      
    </Field>);

}

function Select({ label, value, onChange, onBlur, options = [], placeholder, required, error, touched }) {
  const hasErr = touched && error;
  return (
    <Field label={label} required={required} error={error} touched={touched}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur} className={cssClass(
          { ...baseInp(hasErr), background: hasErr ? "#fff5f5" : "#fff" })}>
        
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) =>
        <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </Field>);

}

/* ── Section header ── */
function SectionHead({ icon: Icon, title }) {
  return (
    <div className={cssClass({
      display: "flex", alignItems: "center", gap: 8,
      marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #f3f4f6"
    })}>
      <div className={cssClass({
        width: 32, height: 32, borderRadius: 8, background: BRAND + "18",
        display: "flex", alignItems: "center", justifyContent: "center"
      })}>
        <Icon size={16} color={BRAND} />
      </div>
      <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#111827" })}>{title}</span>
    </div>);

}

/* ═══════════════════════════════════════════════════════ */
export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  /* form state */
  const [form, setForm] = useState({});
  const [bankForm, setBankForm] = useState({});
  const [contForm, setContForm] = useState({});

  /* Yup validation */
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  /* dropdown options */
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  /* live salary breakdown from compensation section */
  const compBreakdown = useMemo(
    () => calculatePayslip(Number(form.base_salary) || 0),
    [form.base_salary]
  );

  /* ── Setters with per-field live Yup validation ── */
  const set = (key) => (val) => {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (touched[key]) {
        employeeSchema.validateAt(key, next).
        then(() => setFormErrors((e) => {const n = { ...e };delete n[key];return n;})).
        catch((err) => setFormErrors((e) => ({ ...e, [key]: err.message })));
      }
      return next;
    });
  };

  const setB = (key) => (val) => setBankForm((f) => ({ ...f, [key]: val }));
  const setC = (key) => (val) => setContForm((f) => ({ ...f, [key]: val }));

  /* Mark a field touched on blur and validate it */
  const touch = (key) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    employeeSchema.validateAt(key, form).
    then(() => setFormErrors((e) => {const n = { ...e };delete n[key];return n;})).
    catch((err) => setFormErrors((e) => ({ ...e, [key]: err.message })));
  };

  /* Annual CTC → auto-calculate monthly base salary */
  const handleCtcChange = (annualCtc) => {
    set("ctc")(annualCtc);
    if (!annualCtc || Number(annualCtc) <= 0) {set("base_salary")("");return;}
    const approxBasic = Math.round(Number(annualCtc) / 12 / 2.1);
    set("base_salary")(String(approxBasic));
  };

  /* ── Load employee ── */
  useEffect(() => {
    setLoading(true);
    getEmployee(id).
    then((data) => setEmployee(data)).
    catch((err) => errorToast(getErrorMessage(err, "Failed to load employee"))).
    finally(() => setLoading(false));
  }, [id]);

  const loadDropdowns = async () => {
    try {
      const [depts, mgrs] = await Promise.all([listDepartments(), getManagers()]);
      setDepartments((Array.isArray(depts) ? depts : []).map((d) => ({ value: String(d.department_id), label: d.department_name })));
      setManagers((Array.isArray(mgrs) ? mgrs : []).filter((m) => String(m.employee_id) !== String(id)).map((m) => ({ value: String(m.employee_id), label: m.full_name + (m.designation_name ? ` — ${m.designation_name}` : "") })));
    } catch {/* ignore */}
  };

  const enterEdit = () => {
    if (!employee) return;
    const e = employee;const b = e.bankDetails || {};const c = e.contactInfo || {};
    setForm({
      first_name: e.first_name || "", last_name: e.last_name || "", email: e.email || "", mobile: e.mobile || "",
      gender: e.gender || "", dob: toDateInput(e.dob), marital_status: e.marital_status || "",
      father_name: e.father_name || "", spouse_name: e.spouse_name || "", blood_group: e.blood_group || "",
      department_id: String(e.department_id || ""), emp_job_title: e.emp_job_title || "",
      reporting_to: String(e.reporting_to || ""), emp_joining_date: toDateInput(e.emp_joining_date),
      employee_type: e.employee_type || "Full-Time", employee_status: e.employee_status || "Active",
      emp_exit_date: toDateInput(e.emp_exit_date), location: e.location || "",
      ctc: e.ctc || "", base_salary: e.base_salary || "", benefits_plan: e.benefits_plan || "",
      aadhaar_number: e.aadhaar_number || "", aadhaar_name: e.aadhaar_name || "",
      aadhaar_enrolment_number: e.aadhaar_enrolment_number || "",
      pf_number: e.pf_number || "", pf_join_date: toDateInput(e.pf_join_date), esi_number: e.esi_number || "",
      access_card_number: e.access_card_number || "",
      access_card_from_date: toDateInput(e.access_card_from_date), access_card_to_date: toDateInput(e.access_card_to_date)
    });
    setBankForm({ bank_name: b.bank_name || "", account_number: b.account_number || "", account_type: b.account_type || "", bank_branch: b.bank_branch || "", ifsc_code: b.ifsc_code || "", dd_payable_at: b.dd_payable_at || "", account_holder_name: b.account_holder_name || "", payment_type: b.payment_type || "", pan_number: b.pan_number || "", uan_number: b.uan_number || "" });
    setContForm({ contact_name: c.contact_name || "", personal_email: c.personal_email || "", alternate_mobile: c.alternate_mobile || "", contact_city: c.contact_city || "", contact_country: c.contact_country || "", emergency_contact_name: c.emergency_contact_name || "", emergency_contact_phone: c.emergency_contact_phone || "", permanent_address_line1: c.permanent_address_line1 || "", permanent_address_line2: c.permanent_address_line2 || "", permanent_address_line3: c.permanent_address_line3 || "" });
    setFormErrors({});setTouched({});loadDropdowns();setEditMode(true);
  };

  const cancelEdit = () => {setFormErrors({});setTouched({});setEditMode(false);};

  const cleanForm = (obj, dateKeys = []) => {const out = { ...obj };dateKeys.forEach((k) => {if (out[k] === "" || out[k] === undefined) out[k] = null;});return out;};

  const handleSave = async () => {
    try {
      await employeeSchema.validate(form, { abortEarly: false });setFormErrors({});
    } catch (yupErr) {
      const errors = {},allTouched = {};
      yupErr.inner.forEach((e) => {errors[e.path] = e.message;allTouched[e.path] = true;});
      setFormErrors(errors);setTouched((t) => ({ ...t, ...allTouched }));
      errorToast(`Please fix ${yupErr.inner.length} validation error${yupErr.inner.length > 1 ? "s" : ""} before saving`);
      return;
    }
    setSaving(true);
    try {
      const dateFields = ["dob", "emp_joining_date", "emp_exit_date", "pf_join_date", "access_card_from_date", "access_card_to_date"];
      await updateEmployee(id, cleanForm(form, dateFields));
      await updateBankDetails(id, bankForm);
      await updateContactInfo(id, contForm);
      const fresh = await getEmployee(id);
      setEmployee(fresh);setEditMode(false);setFormErrors({});setTouched({});
      successToast("Employee updated successfully");
    } catch (err) {errorToast(getErrorMessage(err, "Failed to update employee"));} finally
    {setSaving(false);}
  };

  if (loading) return <div className={cssClass({ display: "flex", justifyContent: "center", padding: 60 })}><div className={cssClass({ width: 40, height: 40, border: `3px solid ${BRAND}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" })} /></div>;
  if (!employee) return <div className={cssClass({ textAlign: "center", padding: 60, color: "#6b7280" })}>Employee not found.</div>;

  const bd = employee.bankDetails || {};const ci = employee.contactInfo || {};

  return (
    <div className={joinClasses("emp-wizard", cssClass({ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }))}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 })}>
        <button onClick={() => navigate(-1)} className={cssClass({ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#374151", fontSize: 14, fontWeight: 600 })}><ArrowLeft size={16} /> Back</button>
        <div className={cssClass({ display: "flex", gap: 8 })}>
          {!editMode ?
          <button onClick={enterEdit} className={cssClass({ display: "flex", alignItems: "center", gap: 6, background: BRAND, border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff" })}><Edit2 size={14} /> Edit Employee</button> :
          <>
            <button onClick={cancelEdit} className={cssClass({ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" })}><Cancel size={14} /> Cancel</button>
            <button onClick={handleSave} disabled={saving} className={cssClass({ display: "flex", alignItems: "center", gap: 6, background: BRAND, border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", color: "#fff", opacity: saving ? 0.7 : 1 })}><Save size={14} /> {saving ? "Saving…" : "Save Changes"}</button>
          </>}
        </div>
      </div>

      <div className={joinClasses("emp-wizard__card", cssClass({ marginBottom: 20 }))}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" })}>
          <img className="emp-card__avatar" src={avatarDataUri(employee.employee_id, 72)} alt={`${employee.first_name} ${employee.last_name || ""}`} />
          <div className={cssClass({ flex: 1 })}>
            {editMode ?
            <div className={cssClass({ display: "flex", gap: 12, flexWrap: "wrap" })}>
                <div className={cssClass({ flex: 1, minWidth: 140 })}>
                  <Field label="First Name" required error={formErrors.first_name} touched={touched.first_name}>
                    <input value={form.first_name ?? ""} onChange={(e) => set("first_name")(e.target.value)} onBlur={touch("first_name")} placeholder="First name" className={cssClass(baseInp(touched.first_name && formErrors.first_name))} />
                  </Field>
                </div>
                <div className={cssClass({ flex: 1, minWidth: 140 })}>
                  <Field label="Last Name"><input value={form.last_name ?? ""} onChange={(e) => set("last_name")(e.target.value)} placeholder="Last name" className={cssClass(inp)} /></Field>
                </div>
              </div> :
            <><h2 className={cssClass({ margin: 0 })}>{employee.first_name} {employee.last_name}</h2><p className={cssClass({ margin: "4px 0 0", color: "#64748b" })}>{employee.emp_job_title || "—"} · {employee.department_name || "General"}</p></>}
            <div className={cssClass({ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" })}>
              <EmployeeStatusBadge employee={employee} />
              <span className="emp-table__id">{employee.emp_code || `EMP${String(employee.employee_id).padStart(3, "0")}`}</span>
            </div>
          </div>
        </div>
        {!editMode && <div className={joinClasses("emp-card__contact", cssClass({ marginTop: 14, flexDirection: "row", gap: "1.5rem" }))}><span><Mail size={14} /> {employee.email}</span><span><Phone size={14} /> {employee.mobile || "—"}</span></div>}
        {editMode &&
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 })}>
            <Input label="Email" value={form.email} onChange={set("email")} type="email" required onBlur={touch("email")} error={formErrors.email} touched={touched.email} />
            <Input label="Mobile" value={form.mobile} onChange={set("mobile")} required onBlur={touch("mobile")} error={formErrors.mobile} touched={touched.mobile} />
          </div>
        }
      </div>

      <div className="emp-wizard__card">
        <div className="emp-review-section">
          <SectionHead icon={User} title="Personal Information" />
          {editMode ?
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
              <Select label="Gender" value={form.gender} onChange={set("gender")} placeholder="Select gender" options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
              <Input label="Date of Birth" value={form.dob} onChange={set("dob")} type="date" />
              <Select label="Marital Status" value={form.marital_status} onChange={set("marital_status")} placeholder="Select" options={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }, { value: "Divorced", label: "Divorced" }, { value: "Widowed", label: "Widowed" }]} />
              <Input label="Father's Name" value={form.father_name} onChange={set("father_name")} />
              <Input label="Spouse Name" value={form.spouse_name} onChange={set("spouse_name")} />
              <Select label="Blood Group" value={form.blood_group} onChange={set("blood_group")} placeholder="Select" options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => ({ value: v, label: v }))} />
            </div> :
          <dl className="emp-review-grid"><Row label="Gender" value={employee.gender} /><Row label="Date of Birth" value={fmt(employee.dob)} /><Row label="Marital Status" value={employee.marital_status} /><Row label="Father's Name" value={employee.father_name} /><Row label="Spouse Name" value={employee.spouse_name} /><Row label="Blood Group" value={employee.blood_group} /></dl>}
        </div>

        <div className="emp-review-section">
          <SectionHead icon={Briefcase} title="Employment Details" />
          {editMode ?
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
              <Select label="Department" value={form.department_id} onChange={set("department_id")} placeholder="Select department" options={departments} required onBlur={touch("department_id")} error={formErrors.department_id} touched={touched.department_id} />
              <Input label="Job Title / Role" value={form.emp_job_title} onChange={set("emp_job_title")} required onBlur={touch("emp_job_title")} error={formErrors.emp_job_title} touched={touched.emp_job_title} />
              <Select label="Reporting Manager" value={form.reporting_to} onChange={set("reporting_to")} placeholder="No manager" options={managers} />
              <Input label="Date of Joining" value={form.emp_joining_date} onChange={set("emp_joining_date")} type="date" required onBlur={touch("emp_joining_date")} error={formErrors.emp_joining_date} touched={touched.emp_joining_date} />
              <Select label="Employee Type" value={form.employee_type} onChange={set("employee_type")} options={["Full-Time", "Part-Time", "Contract", "Intern"].map((v) => ({ value: v, label: v }))} required onBlur={touch("employee_type")} error={formErrors.employee_type} touched={touched.employee_type} />
              <Select label="Employee Status" value={form.employee_status} onChange={set("employee_status")} options={["Active", "Inactive", "Resigned", "Terminated"].map((v) => ({ value: v, label: v }))} required onBlur={touch("employee_status")} error={formErrors.employee_status} touched={touched.employee_status} />
              <Input label="Leaving Date" value={form.emp_exit_date} onChange={set("emp_exit_date")} type="date" onBlur={touch("emp_exit_date")} error={formErrors.emp_exit_date} touched={touched.emp_exit_date} />
              <Input label="Location" value={form.location} onChange={set("location")} />
            </div> :
          <dl className="emp-review-grid"><Row label="Department" value={employee.department_name} /><Row label="Designation" value={employee.designation_name} /><Row label="Job Title" value={employee.emp_job_title} /><Row label="Reporting Manager" value={employee.reporting_to_name?.trim()} /><Row label="Date of Joining" value={fmt(employee.emp_joining_date)} /><Row label="Employee Type" value={employee.employee_type} /><Row label="Employee Status" value={employee.employee_status} /><Row label="Leaving Date" value={fmt(employee.emp_exit_date)} /><Row label="Location" value={employee.location} /></dl>}
        </div>

        <div className="emp-review-section">
          <SectionHead icon={DollarSign} title="Compensation" />
          {editMode ?
          <div>
              <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px", marginBottom: 16 })}>
                <div>
                  <Field label="CTC (Annual ₹)" error={formErrors.ctc} touched={touched.ctc}>
                    <input type="number" min={0} value={form.ctc ?? ""} onChange={(e) => handleCtcChange(e.target.value)} onBlur={touch("ctc")} placeholder="e.g. 600000" className={cssClass({ ...inp, borderColor: touched.ctc && formErrors.ctc ? "#dc2626" : BRAND, outline: `1px solid ${touched.ctc && formErrors.ctc ? "#dc2626" : BRAND}`, background: touched.ctc && formErrors.ctc ? "#fff5f5" : "#fff" })} />
                    <div className={cssClass({ fontSize: 11, color: "#6b7280", marginTop: 4 })}>Enter Annual CTC — Base Salary auto-calculates</div>
                  </Field>
                </div>
                <div>
                  <Field label="Base Salary (Monthly ₹)" error={formErrors.base_salary} touched={touched.base_salary}>
                    <input type="number" min={0} value={form.base_salary ?? ""} onChange={(e) => set("base_salary")(e.target.value)} onBlur={touch("base_salary")} placeholder="Auto-calculated" className={cssClass(baseInp(touched.base_salary && formErrors.base_salary))} />
                    <div className={cssClass({ fontSize: 11, color: "#6b7280", marginTop: 4 })}>Or enter directly to override</div>
                  </Field>
                </div>
                <Input label="Benefits Plan" value={form.benefits_plan} onChange={set("benefits_plan")} />
              </div>
              {Number(form.base_salary) > 0 && (() => {
              const bk = compBreakdown;const net = bk.netSalary ?? bk.totalEarnings - bk.totalDeductions;
              return (
                <div className={cssClass({ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 })}>
                    <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 12 })}>Calculated Salary Breakdown</div>
                    <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 })}>
                      {[{ label: "Monthly Basic", value: bk.basic, bg: "#f0f9ff", color: "#0369a1" }, { label: "Gross Earnings", value: bk.totalEarnings, bg: "#f0fdf4", color: "#16a34a" }, { label: "Total Deductions", value: bk.totalDeductions, bg: "#fef2f2", color: "#dc2626" }, { label: "Net Pay", value: net, bg: "#f0fdf4", color: "#16a34a" }, { label: "CTC Monthly", value: bk.ctc, bg: "#fff7ed", color: BRAND }, { label: "CTC Annual", value: bk.ctc * 12, bg: "#fff7ed", color: BRAND }].map(({ label, value, bg, color }) =>
                    <div key={label} className={cssClass({ background: bg, border: `1px solid ${color}22`, borderRadius: 8, padding: "8px 14px", minWidth: 130 })}>
                          <div className={cssClass({ fontSize: 10, color: "#6b7280", marginBottom: 2 })}>{label}</div>
                          <div className={cssClass({ fontSize: 14, fontWeight: 800, color })}>₹ {(value || 0).toLocaleString("en-IN")}</div>
                        </div>
                    )}
                    </div>
                    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
                      <div>
                        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", marginBottom: 6 })}>Earnings</div>
                        <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" })}>
                          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 11 })}><tbody>
                            {[["Basic", bk.basic], ["HRA (40%)", bk.hra], ["Special (25%)", bk.specialAllowance], ["LTA (4.5%)", bk.lta], ["Tel & Net (2%)", bk.telephoneAndInternet], ["Medical (5%)", bk.medicalAllowance], ["Conveyance (3%)", bk.conveyance], ["Bonus (5%)", bk.bonus], ["Incentives (5%)", bk.incentives], ["Arrears (7.5%)", bk.arrears], ["Other (1%)", bk.otherEarnings]].map(([l, v]) =>
                            <tr key={l} className={cssClass({ borderTop: "1px solid #f3f4f6" })}><td className={cssClass({ padding: "5px 10px", color: "#374151" })}>{l}</td><td className={cssClass({ padding: "5px 10px", textAlign: "right", fontWeight: 600 })}>{(v || 0).toLocaleString("en-IN")}</td></tr>
                            )}
                            <tr className={cssClass({ background: "#f0fdf4" })}><td className={cssClass({ padding: "6px 10px", fontWeight: 700, color: "#16a34a" })}>Total</td><td className={cssClass({ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a" })}>{(bk.totalEarnings || 0).toLocaleString("en-IN")}</td></tr>
                          </tbody></table>
                        </div>
                      </div>
                      <div>
                        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", marginBottom: 6 })}>Deductions</div>
                        <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" })}>
                          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 11 })}><tbody>
                            <tr className={cssClass({ background: "#fef2f2" })}><td colSpan={2} className={cssClass({ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#dc2626" })}>Employee</td></tr>
                            {[["PF (12%)", bk.pf], ["ESI (0.75%)", bk.esiEmployee || 0], ["Prof. Tax", bk.professionalTax], ["TDS / IT", bk.tds]].map(([l, v]) =>
                            <tr key={l} className={cssClass({ borderTop: "1px solid #f3f4f6" })}><td className={cssClass({ padding: "5px 10px", color: "#374151" })}>{l}</td><td className={cssClass({ padding: "5px 10px", textAlign: "right", fontWeight: 600 })}>{(v || 0).toLocaleString("en-IN")}</td></tr>
                            )}
                            <tr className={cssClass({ background: "#fff7ed" })}><td colSpan={2} className={cssClass({ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: BRAND })}>Employer (CTC)</td></tr>
                            {[["EPS (8.33%)", bk.eps], ["EPF (3.67%)", bk.epf], ["EDLI (0.5%)", bk.edli], ["ESI (3.25%)", bk.esiEmployer || 0]].map(([l, v]) =>
                            <tr key={l} className={cssClass({ borderTop: "1px solid #f3f4f6" })}><td className={cssClass({ padding: "5px 10px", color: "#374151" })}>{l}</td><td className={cssClass({ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: BRAND })}>{(v || 0).toLocaleString("en-IN")}</td></tr>
                            )}
                            <tr className={cssClass({ background: "#f0fdf4" })}><td className={cssClass({ padding: "6px 10px", fontWeight: 700, color: "#16a34a" })}>Net Pay</td><td className={cssClass({ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a" })}>{(net || 0).toLocaleString("en-IN")}</td></tr>
                          </tbody></table>
                        </div>
                      </div>
                    </div>
                  </div>);

            })()}
            </div> :
          <dl className="emp-review-grid"><Row label="CTC (Annual)" value={employee.ctc ? `₹ ${Number(employee.ctc).toLocaleString("en-IN")}` : null} /><Row label="Base Salary" value={employee.base_salary ? `₹ ${Number(employee.base_salary).toLocaleString("en-IN")}` : null} /><Row label="Benefits Plan" value={employee.benefits_plan} /></dl>}
        </div>

        <div className="emp-review-section">
          <SectionHead icon={Building2} title="Statutory & Identity" />
          {editMode ?
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
              <Input label="Aadhaar Number" value={form.aadhaar_number} onChange={set("aadhaar_number")} onBlur={touch("aadhaar_number")} error={formErrors.aadhaar_number} touched={touched.aadhaar_number} />
              <Input label="Name As Per Aadhaar" value={form.aadhaar_name} onChange={set("aadhaar_name")} />
              <Input label="Aadhaar Enrolment Number" value={form.aadhaar_enrolment_number} onChange={set("aadhaar_enrolment_number")} />
              <Input label="PF Number" value={form.pf_number} onChange={set("pf_number")} />
              <Input label="PF Join Date" value={form.pf_join_date} onChange={set("pf_join_date")} type="date" />
              <Input label="ESI Number" value={form.esi_number} onChange={set("esi_number")} />
              <Input label="Access Card Number" value={form.access_card_number} onChange={set("access_card_number")} />
              <Input label="Access Card From Date" value={form.access_card_from_date} onChange={set("access_card_from_date")} type="date" />
              <Input label="Access Card To Date" value={form.access_card_to_date} onChange={set("access_card_to_date")} type="date" />
            </div> :
          <dl className="emp-review-grid"><Row label="Aadhaar Number" value={employee.aadhaar_number} /><Row label="Name As Per Aadhaar" value={employee.aadhaar_name} /><Row label="Aadhaar Enrolment Number" value={employee.aadhaar_enrolment_number} /><Row label="PF Number" value={employee.pf_number} /><Row label="PF Join Date" value={fmt(employee.pf_join_date)} /><Row label="ESI Number" value={employee.esi_number} /><Row label="Access Card Number" value={employee.access_card_number} /><Row label="Access Card From Date" value={fmt(employee.access_card_from_date)} /><Row label="Access Card To Date" value={fmt(employee.access_card_to_date)} /></dl>}
        </div>

        <div className="emp-review-section">
          <SectionHead icon={CreditCard} title="Bank Details" />
          {editMode ?
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
              <Input label="Bank Name" value={bankForm.bank_name} onChange={setB("bank_name")} />
              <Input label="Account Number" value={bankForm.account_number} onChange={setB("account_number")} />
              <Select label="Account Type" value={bankForm.account_type} onChange={setB("account_type")} placeholder="Select" options={["Savings", "Current", "Salary"].map((v) => ({ value: v, label: v }))} />
              <Input label="Bank Branch" value={bankForm.bank_branch} onChange={setB("bank_branch")} />
              <Input label="IFSC Code" value={bankForm.ifsc_code} onChange={setB("ifsc_code")} />
              <Input label="DD Payable At" value={bankForm.dd_payable_at} onChange={setB("dd_payable_at")} />
              <Input label="Name As Per Bank" value={bankForm.account_holder_name} onChange={setB("account_holder_name")} />
              <Select label="Payment Type" value={bankForm.payment_type} onChange={setB("payment_type")} placeholder="Select" options={["NEFT", "RTGS", "IMPS", "Cheque", "Cash"].map((v) => ({ value: v, label: v }))} />
              <Input label="PAN Number" value={bankForm.pan_number} onChange={setB("pan_number")} />
              <Input label="UAN Number" value={bankForm.uan_number} onChange={setB("uan_number")} />
            </div> :
          <dl className="emp-review-grid"><Row label="Bank Name" value={bd?.bank_name} /><Row label="Account Number" value={bd?.account_number} /><Row label="Account Type" value={bd?.account_type} /><Row label="Bank Branch" value={bd?.bank_branch} /><Row label="IFSC Code" value={bd?.ifsc_code} /><Row label="DD Payable At" value={bd?.dd_payable_at} /><Row label="Name As Per Bank" value={bd?.account_holder_name} /><Row label="Payment Type" value={bd?.payment_type} /><Row label="PAN Number" value={bd?.pan_number} /><Row label="UAN Number" value={bd?.uan_number} /></dl>}
        </div>

        <div className="emp-review-section">
          <SectionHead icon={MapPin} title="Contact & Address" />
          {editMode ?
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
              <Input label="Contact Name" value={contForm.contact_name} onChange={setC("contact_name")} />
              <Input label="Personal Email" value={contForm.personal_email} onChange={setC("personal_email")} type="email" />
              <Input label="Alternate Mobile" value={contForm.alternate_mobile} onChange={setC("alternate_mobile")} />
              <Input label="Contact City" value={contForm.contact_city} onChange={setC("contact_city")} />
              <Input label="Contact Country" value={contForm.contact_country} onChange={setC("contact_country")} />
              <Input label="Emergency Contact Name" value={contForm.emergency_contact_name} onChange={setC("emergency_contact_name")} />
              <Input label="Emergency Contact Mobile" value={contForm.emergency_contact_phone} onChange={setC("emergency_contact_phone")} />
              <Input label="Permanent Address Line 1" value={contForm.permanent_address_line1} onChange={setC("permanent_address_line1")} />
              <Input label="Permanent Address Line 2" value={contForm.permanent_address_line2} onChange={setC("permanent_address_line2")} />
              <Input label="Permanent Address Line 3" value={contForm.permanent_address_line3} onChange={setC("permanent_address_line3")} />
            </div> :
          <dl className="emp-review-grid"><Row label="Contact Name" value={ci?.contact_name} /><Row label="Contact Email" value={ci?.personal_email} /><Row label="Contact Mobile" value={ci?.alternate_mobile} /><Row label="Contact City" value={ci?.contact_city} /><Row label="Contact Country" value={ci?.contact_country} /><Row label="Emergency Contact Name" value={ci?.emergency_contact_name} /><Row label="Emergency Contact Mobile" value={ci?.emergency_contact_phone} /><Row label="Permanent Address Line 1" value={ci?.permanent_address_line1} /><Row label="Permanent Address Line 2" value={ci?.permanent_address_line2} /><Row label="Permanent Address Line 3" value={ci?.permanent_address_line3} /></dl>}
        </div>
      </div>

      {editMode &&
      <div className={cssClass({ position: "sticky", bottom: 0, zIndex: 10, background: "#fff", borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, borderRadius: "0 0 12px 12px" })}>
          {Object.keys(formErrors).length > 0 && <div className={cssClass({ flex: 1, display: "flex", alignItems: "center", fontSize: 12, color: "#dc2626", gap: 6 })}>⚠ {Object.keys(formErrors).length} field{Object.keys(formErrors).length > 1 ? "s" : ""} need attention</div>}
          <button onClick={cancelEdit} className={cssClass({ background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" })}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={cssClass({ background: BRAND, border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", color: "#fff", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 })}><Save size={14} /> {saving ? "Saving…" : "Save Changes"}</button>
        </div>
      }
    </div>);

}
