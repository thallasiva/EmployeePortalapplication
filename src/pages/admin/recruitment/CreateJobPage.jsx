import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { POSITION_TYPES, BUSINESS_UNITS, ASSIGNMENT_STATUSES, JOB_STATUSES } from "./mockData";
import { createJob, getErrorMessage } from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK = {
  title: "", client: "", companyDept: "", jobIdManual: "",
  billRate: "", billCurrency: "$", payRate: "", payCurrency: "$",
  positionType: "Contract", vacancies: "", jobStatus: "",
  businessUnit: "", assignmentStatus: "Open",
  city: "", country: "", experienceLevel: "", skillSet: "",
  opportunityPhone: "", description: "",
};

const EXPERIENCE_LEVELS = ["0-1 yr", "1-3 yrs", "3-5 yrs", "5-8 yrs", "8-12 yrs", "12+ yrs"];
const CURRENCIES = ["$", "INR", "GBP", "EUR"];

const iStyle = {
  width: "100%", padding: "8px 10px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
  background: "#fff", color: "#111827", fontFamily: "inherit",
};

function FRow({ label, required, children, span }) {
  return (
    <div style={{ marginBottom: 16, gridColumn: span ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5, display: "block" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function RateInput({ nameVal, nameCur, val, cur, onChange }) {
  return (
    <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: 6, overflow: "hidden" }}>
      <input name={nameVal} type="number" value={val} onChange={onChange} placeholder="0"
        style={{ flex: 1, padding: "8px 10px", border: "none", outline: "none", fontSize: 13, minWidth: 0, fontFamily: "inherit" }} />
      <select name={nameCur} value={cur} onChange={onChange}
        style={{ padding: "0 10px", border: "none", borderLeft: "1px solid #d1d5db", background: "#f9fafb", fontSize: 13, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
      </select>
    </div>
  );
}

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  const isValid = !!(
    form.title && form.client && form.companyDept && form.positionType
    && form.billRate && form.payRate && form.jobStatus && form.businessUnit
    && form.vacancies && form.country && form.skillSet && form.description
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await createJob({
        title:            form.title,
        client:           form.client,
        companyDept:      form.companyDept,
        billRate:         Number(form.billRate),
        billCurrency:     form.billCurrency,
        payRate:          Number(form.payRate),
        payCurrency:      form.payCurrency,
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

              <FRow label="Job Title" required>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Java Developer" style={iStyle} />
              </FRow>
              <FRow label="Client" required>
                <input name="client" value={form.client} onChange={handleChange} placeholder="Client name" style={iStyle} />
              </FRow>

              <FRow label="Job ID# (optional)">
                <input name="jobIdManual" value={form.jobIdManual} onChange={handleChange} placeholder="Auto-assigned if blank" style={iStyle} />
              </FRow>
              <FRow label="Company / Dept" required>
                <input name="companyDept" value={form.companyDept} onChange={handleChange} placeholder="e.g. IT / Development" style={iStyle} />
              </FRow>

              <FRow label="Bill Rate" required>
                <RateInput nameVal="billRate" nameCur="billCurrency" val={form.billRate} cur={form.billCurrency} onChange={handleChange} />
              </FRow>
              <FRow label="Pay Rate" required>
                <RateInput nameVal="payRate" nameCur="payCurrency" val={form.payRate} cur={form.payCurrency} onChange={handleChange} />
              </FRow>

              <FRow label="Position Type" required>
                <select name="positionType" value={form.positionType} onChange={handleChange} style={iStyle}>
                  {POSITION_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </FRow>
              <FRow label="No of Vacancies" required>
                <input name="vacancies" type="number" min="1" value={form.vacancies} onChange={handleChange} placeholder="e.g. 2" style={iStyle} />
              </FRow>

              <FRow label="City">
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" style={iStyle} />
              </FRow>
              <FRow label="Country" required>
                <input name="country" value={form.country} onChange={handleChange} placeholder="e.g. India, USA" style={iStyle} />
              </FRow>

              <FRow label="Experience Level" required>
                <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} style={iStyle}>
                  <option value="">Select level</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </FRow>
              <FRow label="Job Status" required>
                <select name="jobStatus" value={form.jobStatus} onChange={handleChange} style={iStyle}>
                  <option value="">Find items…</option>
                  {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FRow>

              <FRow label="Skill Set" required>
                <input name="skillSet" value={form.skillSet} onChange={handleChange} placeholder="e.g. Java, Spring Boot, MySQL" style={iStyle} />
              </FRow>
              <FRow label="Business Unit" required>
                <select name="businessUnit" value={form.businessUnit} onChange={handleChange} style={iStyle}>
                  <option value="">Find items…</option>
                  {BUSINESS_UNITS.map(b => <option key={b}>{b}</option>)}
                </select>
              </FRow>

              <FRow label="Job Opportunity Referred by Phone">
                <input name="opportunityPhone" value={form.opportunityPhone} onChange={handleChange} placeholder="Phone number" style={iStyle} />
              </FRow>
              <FRow label="Recruiter Assignment Status" required>
                <select name="assignmentStatus" value={form.assignmentStatus} onChange={handleChange} style={iStyle}>
                  {ASSIGNMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FRow>

              <FRow label="Job Description" required span>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Detailed job description, requirements, responsibilities…"
                  rows={5} style={{ ...iStyle, resize: "vertical", lineHeight: 1.5 }} />
              </FRow>
            </div>

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
