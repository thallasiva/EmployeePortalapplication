import React, { useState, useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { POSITION_TYPES, BUSINESS_UNITS, ASSIGNMENT_STATUSES, JOB_STATUSES } from "./mockData";
import { createJob, assignRecruiters, listRecruiters, getErrorMessage } from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK = {
  title: "", client: "", companyDept: "", jobIdManual: "",
  billRate: "", billCurrency: "INR", billPeriod: "Per Hour",
  payRate: "",  payCurrency: "INR",  payPeriod: "Per Hour",
  positionType: "Contract", vacancies: "", jobStatus: "",
  businessUnit: "", assignmentStatus: "Open",
  city: "", country: "", experienceLevel: "", skillSet: "",
  opportunityPhone: "", description: "",
  assignedRecruiters: [],
};

const EXPERIENCE_LEVELS = ["0-1 yr", "1-3 yrs", "3-5 yrs", "5-8 yrs", "8-12 yrs", "12+ yrs"];
const CURRENCIES  = ["INR", "$", "GBP", "EUR"];
const RATE_PERIODS = ["Per Hour", "Per Month", "Per Year"];

const iStyle = {
  width: "100%", padding: "8px 10px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
  background: "#fff", color: "#111827", fontFamily: "inherit",
};

function FRow({ label, required, optional, children, span }) {
  return (
    <div style={{ marginBottom: 16, gridColumn: span ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
        {label}
        {required && <span style={{ color: "#ef4444" }}>*</span>}
        {optional && <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>(optional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * RateInput — currency selector on LEFT, amount in the MIDDLE, period on RIGHT.
 * Amount is left-aligned inside its input box.
 */
function RateInput({ nameVal, nameCur, namePeriod, val, cur, period, onChange }) {
  return (
    <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: 6, overflow: "hidden" }}>
      {/* Currency — left */}
      <select name={nameCur} value={cur} onChange={onChange}
        style={{ padding: "0 8px", border: "none", borderRight: "1px solid #d1d5db", background: "#f9fafb", fontSize: 13, cursor: "pointer", outline: "none", fontFamily: "inherit", flexShrink: 0 }}>
        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
      </select>
      {/* Amount — left-aligned text */}
      <input name={nameVal} type="number" value={val} onChange={onChange} placeholder="0"
        style={{ flex: 1, padding: "8px 10px", border: "none", outline: "none", fontSize: 13, minWidth: 0, fontFamily: "inherit", textAlign: "left" }} />
      {/* Period — right */}
      <select name={namePeriod} value={period} onChange={onChange}
        style={{ padding: "0 8px", border: "none", borderLeft: "1px solid #d1d5db", background: "#f9fafb", fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "inherit", flexShrink: 0 }}>
        {RATE_PERIODS.map(p => <option key={p}>{p}</option>)}
      </select>
    </div>
  );
}

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [recruiters, setRecruiters] = useState([]);

  useEffect(() => {
    listRecruiters()
      .then(rows => setRecruiters(rows ?? []))
      .catch(() => {});
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleRecruiter(id) {
    setForm(f => ({
      ...f,
      assignedRecruiters: f.assignedRecruiters.includes(id)
        ? f.assignedRecruiters.filter(r => r !== id)
        : [...f.assignedRecruiters, id],
    }));
  }

  const isValid = !!(
    form.title && form.client && form.positionType && form.jobIdManual
    && form.billRate && form.payRate && form.jobStatus && form.businessUnit
    && form.vacancies && form.country && form.skillSet && form.description
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const job = await createJob({
        title:            form.title,
        client:           form.client,
        companyDept:      form.companyDept || null,
        jobIdManual:      form.jobIdManual,
        billRate:         Number(form.billRate),
        billCurrency:     form.billCurrency,
        billPeriod:       form.billPeriod,
        payRate:          Number(form.payRate),
        payCurrency:      form.payCurrency,
        payPeriod:        form.payPeriod,
        positionType:     form.positionType,
        vacancies:        Number(form.vacancies),
        city:             form.city || null,
        country:          form.country,
        experienceLevel:  form.experienceLevel,
        jobStatus:        form.jobStatus,
        businessUnit:     form.businessUnit,
        assignmentStatus: form.assignmentStatus,
        opportunityPhone: form.opportunityPhone || null,
        skillSet:         form.skillSet,
        description:      form.description,
      });
      // Assign recruiters if any selected
      if (form.assignedRecruiters.length && job?.job_req_id) {
        try { await assignRecruiters(job.job_req_id, form.assignedRecruiters); } catch {}
      }
      successToast("Job request created successfully");
      navigate(-1);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to create job request"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: "#f18200", color: "#fff", padding: "15px 32px", textAlign: "center", fontSize: 19, fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
        Create Job Request
      </div>

      <div style={{ padding: "14px 32px 0" }}>
        <button onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#f18200", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={14} /> Back to Job Requests
        </button>
      </div>

      <div style={{ padding: "16px 32px 40px" }}>
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: 20, padding: "10px 14px", background: "#fff7ed", borderRadius: 8, borderLeft: "3px solid #f18200", fontSize: 13, color: "#92400e" }}>
            Fields marked <strong>*</strong> are mandatory.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>

              {/* Row 1: Job Title + Client */}
              <FRow label="Job Title" required>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Java Developer" style={iStyle} />
              </FRow>
              <FRow label="Client" required>
                <input name="client" value={form.client} onChange={handleChange} placeholder="Client name" style={iStyle} />
              </FRow>

              {/* Row 2: Job ID (mandatory) + Company/Dept (optional) */}
              <FRow label="Job ID#" required>
                <input name="jobIdManual" value={form.jobIdManual} onChange={handleChange} placeholder="e.g. JOB-2026-001" style={iStyle} />
              </FRow>
              <FRow label="Company / Department" optional>
                <input name="companyDept" value={form.companyDept} onChange={handleChange} placeholder="e.g. IT / Development" style={iStyle} />
              </FRow>

              {/* Row 3: Bill Rate + Pay Rate (each has currency + amount + period) */}
              <FRow label="Bill Rate" required>
                <RateInput
                  nameVal="billRate"    nameCur="billCurrency"    namePeriod="billPeriod"
                  val={form.billRate}   cur={form.billCurrency}   period={form.billPeriod}
                  onChange={handleChange}
                />
              </FRow>
              <FRow label="Pay Rate" required>
                <RateInput
                  nameVal="payRate"     nameCur="payCurrency"     namePeriod="payPeriod"
                  val={form.payRate}    cur={form.payCurrency}    period={form.payPeriod}
                  onChange={handleChange}
                />
              </FRow>

              {/* Row 4 */}
              <FRow label="Position Type" required>
                <select name="positionType" value={form.positionType} onChange={handleChange} style={iStyle}>
                  {POSITION_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </FRow>
              <FRow label="No of Vacancies" required>
                <input name="vacancies" type="number" min="1" value={form.vacancies} onChange={handleChange} placeholder="e.g. 2" style={iStyle} />
              </FRow>

              {/* Row 5 */}
              <FRow label="City" optional>
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" style={iStyle} />
              </FRow>
              <FRow label="Country" required>
                <input name="country" value={form.country} onChange={handleChange} placeholder="e.g. India, USA" style={iStyle} />
              </FRow>

              {/* Row 6 */}
              <FRow label="Experience Level" required>
                <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} style={iStyle}>
                  <option value="">Select level</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </FRow>
              <FRow label="Job Status" required>
                <select name="jobStatus" value={form.jobStatus} onChange={handleChange} style={iStyle}>
                  <option value="">Select status</option>
                  {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FRow>

              {/* Row 7 */}
              <FRow label="Business Unit" required>
                <select name="businessUnit" value={form.businessUnit} onChange={handleChange} style={iStyle}>
                  <option value="">Select unit</option>
                  {BUSINESS_UNITS.map(b => <option key={b}>{b}</option>)}
                </select>
              </FRow>
              <FRow label="Recruiter Assignment Status" required>
                <select name="assignmentStatus" value={form.assignmentStatus} onChange={handleChange} style={iStyle}>
                  {ASSIGNMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FRow>

              {/* Row 8: Phone */}
              <FRow label="Job Opportunity Referred by Phone" optional>
                <input name="opportunityPhone" value={form.opportunityPhone} onChange={handleChange} placeholder="Phone number" style={iStyle} />
              </FRow>
              <div /> {/* spacer */}

              {/* Skillset — full width, textarea for multiple lines */}
              <FRow label="Skill Set" required span>
                <textarea
                  name="skillSet"
                  value={form.skillSet}
                  onChange={handleChange}
                  placeholder="e.g. Java, Spring Boot, MySQL, React
Add each skill on a new line or comma-separated"
                  rows={3}
                  style={{ ...iStyle, resize: "vertical", lineHeight: 1.5 }}
                />
              </FRow>

              {/* Job Description — full width */}
              <FRow label="Job Description" required span>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Detailed job description, requirements, responsibilities…"
                  rows={5} style={{ ...iStyle, resize: "vertical", lineHeight: 1.5 }} />
              </FRow>
            </div>

            {/* ── Assign Recruiters Section ── */}
            {recruiters.length > 0 && (
              <div style={{ marginTop: 8, marginBottom: 20, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={14} color="#f18200" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Assign Recruiters</span>
                  {form.assignedRecruiters.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#fff7ed", color: "#f18200", border: "1px solid #fed7aa", padding: "1px 8px", borderRadius: 20 }}>
                      {form.assignedRecruiters.length} selected
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 2, padding: 12 }}>
                  {recruiters.map(r => {
                    const checked = form.assignedRecruiters.includes(r.employee_id);
                    return (
                      <label key={r.employee_id}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", background: checked ? "#fff7ed" : "transparent", border: checked ? "1px solid #fed7aa" : "1px solid transparent", transition: "all 0.12s" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRecruiter(r.employee_id)}
                          style={{ accentColor: "#f18200", width: 14, height: 14, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: "#111827" }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{r.email}</div>
                        </div>
                        {checked && <span style={{ marginLeft: "auto", fontSize: 10, color: "#f18200" }}>✔</span>}
                      </label>
                    );
                  })}
                </div>
                {form.assignedRecruiters.length > 0 && (
                  <div style={{ padding: "8px 16px", background: "#fff7ed", borderTop: "1px solid #fed7aa", fontSize: 12, color: "#92400e" }}>
                    <strong>Assigned:</strong>{" "}
                    {form.assignedRecruiters
                      .map(id => recruiters.find(r => r.employee_id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
              <button type="button" onClick={() => setForm(BLANK)}
                style={{ padding: "9px 32px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Reset
              </button>
              <button type="submit" disabled={!isValid || submitting}
                style={{ padding: "9px 32px", borderRadius: 6, border: "none", background: (isValid && !submitting) ? "#f18200" : "#d1d5db", color: "#fff", fontSize: 14, fontWeight: 600, cursor: (isValid && !submitting) ? "pointer" : "not-allowed" }}>
                {submitting ? "Submitting…" : "Submit Job Requirement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
