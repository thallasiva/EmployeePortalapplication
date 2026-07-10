import React, { useState, useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { POSITION_TYPES, BUSINESS_UNITS, ASSIGNMENT_STATUSES, JOB_STATUSES } from "./mockData";
import { createJob, assignRecruiters, listRecruiters, getErrorMessage } from "../../../api/recruitment.api";
import { successToast, errorToast } from "../../../utils/ToastControllers";

const BLANK = {
  title: "", client: "", companyDept: "", jobIdManual: "",
  billRate: "", billCurrency: "INR", billPeriod: "Per Hour",
  payRate: "", payCurrency: "INR", payPeriod: "Per Hour",
  positionType: "Contract", vacancies: "", jobStatus: "",
  businessUnit: "", assignmentStatus: "Open",
  city: "", country: "", experienceLevel: "", skillSet: "",
  opportunityPhone: "", description: "",
  assignedRecruiters: [],
};

const EXPERIENCE_LEVELS = ["0-1 yr", "1-3 yrs", "3-5 yrs", "5-8 yrs", "8-12 yrs", "12+ yrs"];
const CURRENCIES = ["INR", "$", "GBP", "EUR"];
const RATE_PERIODS = ["Per Hour", "Per Month", "Per Year"];



function FRow({ label, required, optional, children, span })
{
  return (
    <div className={`mb-4 ${span ? "col-span-full" : ""}`}>
      <label className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="text-[11px] font-normal text-gray-400">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

/**
 * RateInput — currency selector on LEFT, amount in the MIDDLE, period on RIGHT.
 * Amount is left-aligned inside its input box.
 */
function RateInput({ nameVal, nameCur, namePeriod, val, cur, period, onChange })
{
  return (
    <div className="flex overflow-hidden rounded-md border border-gray-300">
      {/* Currency — left */}
      <select
        name={nameCur}
        value={cur}
        onChange={onChange}
        className="shrink-0 cursor-pointer border-0 border-r border-gray-300 bg-gray-50 px-2 text-[13px] outline-none font-inherit"
      >
        {CURRENCIES.map(c => (
          <option key={c}>{c}</option>
        ))}
      </select>

      {/* Amount — left-aligned text */}
      <input
        name={nameVal}
        type="number"
        value={val}
        onChange={onChange}
        placeholder="0"
        className="min-w-0 flex-1 border-0 px-2.5 py-2 text-left text-[13px] outline-none font-inherit"
      />

      {/* Period — right */}
      <select
        name={namePeriod}
        value={period}
        onChange={onChange}
        className="shrink-0 cursor-pointer border-0 border-l border-gray-300 bg-gray-50 px-2 text-xs outline-none font-inherit"
      >
        {RATE_PERIODS.map(p => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}

export default function CreateJobPage()
{
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [recruiters, setRecruiters] = useState([]);

  useEffect(() =>
  {
    listRecruiters()
      .then(rows => setRecruiters(rows ?? []))
      .catch(() => { });
  }, []);

  function handleChange(e)
  {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleRecruiter(id)
  {
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

  async function handleSubmit(e)
  {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try
    {
      const job = await createJob({
        title: form.title,
        client: form.client,
        companyDept: form.companyDept || null,
        jobIdManual: form.jobIdManual,
        billRate: Number(form.billRate),
        billCurrency: form.billCurrency,
        billPeriod: form.billPeriod,
        payRate: Number(form.payRate),
        payCurrency: form.payCurrency,
        payPeriod: form.payPeriod,
        positionType: form.positionType,
        vacancies: Number(form.vacancies),
        city: form.city || null,
        country: form.country,
        experienceLevel: form.experienceLevel,
        jobStatus: form.jobStatus,
        businessUnit: form.businessUnit,
        assignmentStatus: form.assignmentStatus,
        opportunityPhone: form.opportunityPhone || null,
        skillSet: form.skillSet,
        description: form.description,
      });
      // Assign recruiters if any selected
      if (form.assignedRecruiters.length && job?.job_req_id)
      {
        try { await assignRecruiters(job.job_req_id, form.assignedRecruiters); } catch { }
      }
      successToast("Job request created successfully");
      navigate(-1);
    } catch (err)
    {
      errorToast(getErrorMessage(err, "Failed to create job request"));
    } finally
    {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-[Inter,system-ui,sans-serif]">
      <div className="bg-[#f18200] px-8 py-[15px] text-center text-[19px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
        Create Job Request
      </div>

      <div className="px-8 pt-[14px]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-transparent p-0 text-[13px] font-semibold text-[#f18200] cursor-pointer border-0"
        >
          <ArrowLeft size={14} /> Back to Job Requests
        </button>
      </div>

      <div className="px-8 pb-10 pt-4">
        <div className="rounded-[10px] border border-gray-200 bg-white px-8 py-7 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">

          <div className="mb-5 rounded-lg border-l-[3px] border-[#f18200] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] text-[#92400e]">
            Fields marked <strong>*</strong> are mandatory.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-10">
              {/* Row 1: Job Title + Client */}
              <FRow label="Job Title" required>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Java Developer" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>
              <FRow label="Client" required>
                <input name="client" value={form.client} onChange={handleChange} placeholder="Client name" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>

              {/* Row 2: Job ID (mandatory) + Company/Dept (optional) */}
              <FRow label="Job ID#" required>
                <input name="jobIdManual" value={form.jobIdManual} onChange={handleChange} placeholder="e.g. JOB-2026-001" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>
              <FRow label="Company / Department" optional>
                <input name="companyDept" value={form.companyDept} onChange={handleChange} placeholder="e.g. IT / Development" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>

              {/* Row 3: Bill Rate + Pay Rate (each has currency + amount + period) */}
              <FRow label="Bill Rate" required>
                <RateInput
                  nameVal="billRate" nameCur="billCurrency" namePeriod="billPeriod"
                  val={form.billRate} cur={form.billCurrency} period={form.billPeriod}
                  onChange={handleChange}
                />
              </FRow>
              <FRow label="Pay Rate" required>
                <RateInput
                  nameVal="payRate" nameCur="payCurrency" namePeriod="payPeriod"
                  val={form.payRate} cur={form.payCurrency} period={form.payPeriod}
                  onChange={handleChange}
                />
              </FRow>

              {/* Row 4 */}
              <FRow label="Position Type" required>
                <select name="positionType" value={form.positionType} onChange={handleChange} className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
                  {POSITION_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </FRow>
              <FRow label="No of Vacancies" required>
                <input name="vacancies" type="number" min="1" value={form.vacancies} onChange={handleChange} placeholder="e.g. 2" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>

              {/* Row 5 */}
              <FRow label="City" optional>
                <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>
              <FRow label="Country" required>
                <input name="country" value={form.country} onChange={handleChange} placeholder="e.g. India, USA" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
              </FRow>

              {/* Row 6 */}
              <FRow label="Experience Level" required>
                <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
                  <option value="">Select level</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </FRow>
              <FRow label="Job Status" required>
                <select name="jobStatus" value={form.jobStatus} onChange={handleChange} className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
                  <option value="">Select status</option>
                  {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FRow>

              {/* Row 7 */}
              <FRow label="Business Unit" required>
                <select name="businessUnit" value={form.businessUnit} onChange={handleChange} className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
                  <option value="">Select unit</option>
                  {BUSINESS_UNITS.map(b => <option key={b}>{b}</option>)}
                </select>
              </FRow>
              <FRow label="Recruiter Assignment Status" required>
                <select name="assignmentStatus" value={form.assignmentStatus} onChange={handleChange} className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
                  {ASSIGNMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FRow>

              {/* Row 8: Phone */}
              <FRow label="Job Opportunity Referred by Phone" optional>
                <input name="opportunityPhone" value={form.opportunityPhone} onChange={handleChange} placeholder="Phone number" className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
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
                  className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit resize-y leading-[1.5]"
                />
              </FRow>

              {/* Job Description — full width */}
              <FRow label="Job Description" required span>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Detailed job description, requirements, responsibilities…"
                  rows={5} className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit resize-y leading-[1.5]" />
              </FRow>
            </div>

            {/* ── Assign Recruiters Section ── */}
            {recruiters.length > 0 && (
              <div className="mt-2 mb-5 overflow-hidden rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                  <User size={14} color="#f18200" />
                  <span className="text-[13px] font-bold text-gray-700">
                    Assign Recruiters
                  </span>

                  {form.assignedRecruiters.length > 0 && (
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-px text-[11px] font-semibold text-orange-600">
                      {form.assignedRecruiters.length} selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-0.5 p-3">
                  {recruiters.map((r) =>
                  {
                    const checked = form.assignedRecruiters.includes(r.employee_id);

                    return (
                      <label
                        key={r.employee_id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 transition-all duration-100 ${checked
                          ? "border border-orange-200 bg-orange-50"
                          : "border border-transparent"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRecruiter(r.employee_id)}
                          className="h-3.5 w-3.5 shrink-0 accent-orange-500"
                        />

                        <div>
                          <div
                            className={`text-[13px] ${checked
                              ? "font-bold text-gray-900"
                              : "font-medium text-gray-900"
                              }`}
                          >
                            {r.name}
                          </div>

                          <div className="text-[11px] text-gray-500">
                            {r.email}
                          </div>
                        </div>

                        {checked && (
                          <span className="ml-auto text-[10px] text-orange-500">
                            ✔
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {form.assignedRecruiters.length > 0 && (
                  <div className="border-t border-orange-200 bg-orange-50 px-4 py-2 text-[12px] text-orange-900">
                    <strong>Assigned:</strong>{" "}
                    {form.assignedRecruiters
                      .map((id) => recruiters.find((r) => r.employee_id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}

            <div className="mt-1 flex justify-end gap-3 border-t border-[#f0f0f0] pt-4">
              <button
                type="button"
                onClick={() => setForm(BLANK)}
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-8 py-[9px] text-sm font-semibold text-gray-700"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={!isValid || submitting}
                className={`rounded-md px-8 py-[9px] text-sm font-semibold text-white ${isValid && !submitting
                    ? "cursor-pointer bg-[#f18200]"
                    : "cursor-not-allowed bg-gray-300"
                  }`}
              >
                {submitting ? "Submitting…" : "Submit Job Requirement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
