import React from "react";
import { AlertCircle } from "lucide-react";
import { Field, Input, Select, TwoColGrid } from "../../shared";
import { GENDERS } from "../../mockData";
import ScorePanel from "./ScorePanel";

const CandidateFormStep = React.memo(function CandidateFormStep({
  form, jobs, recruiters, isRecruiter,
  parsed, parseErr, matchScore, autoFilled, missing,
  onFormChange
}) {
  function AutoHint({ field }) {
    if (!autoFilled.includes(field)) return null;
    return <div className="text-[10px] text-[#f18200] mt-0.5 font-semibold">✓ extracted from resume</div>;
  }

  function afWrap(field, children) {
    return autoFilled.includes(field)
      ? <div className="rounded-lg outline outline-2 outline-[#f18200] outline-offset-1">{children}</div>
      : <>{children}</>;
  }

  return (
    <div>
      {parseErr &&
        <div className="mb-3.5 px-3.5 py-2.5 bg-red-50 rounded-lg border-l-[3px] border-l-red-500 text-sm text-red-800 flex gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div><strong>Parse error:</strong> {parseErr} — please fill in the fields manually.</div>
        </div>
      }

      {!parseErr && parsed ? (
        <div className="mb-3.5 px-3.5 py-2.5 bg-green-50 rounded-lg border-l-[3px] border-l-green-600 text-sm text-green-800">
          Resume parsed ({parsed.parsedBy === "openai" ? "AI-powered" : "keyword match"}) — fields highlighted in orange were auto-extracted. Review and fill any missing fields.
        </div>
      ) : !parseErr ? (
        <div className="mb-3.5 px-3.5 py-2.5 bg-amber-50 rounded-lg border-l-[3px] border-l-[#f18200] text-sm text-amber-800">
          Fields marked <strong>*</strong> are mandatory.
        </div>
      ) : null}

      {missing.length > 0 &&
        <div className="mb-3.5 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2 items-start">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div><strong>Missing required fields:</strong> {missing.join(", ")}</div>
        </div>
      }

      {matchScore &&
        <div className="mb-4"><ScorePanel score={matchScore} /></div>
      }

      <Field label="Job / Position" required>
        <Select name="jobReqId" value={form.jobReqId} onChange={onFormChange}
          options={jobs.map((j) => ({ value: String(j.job_req_id), label: j.job_req_code + " — " + j.title + " (" + j.client + ")" }))}
          placeholder="Select job requirement" />
      </Field>

      {!isRecruiter &&
        <Field label="Assign Recruiter">
          <Select name="recruiterId" value={form.recruiterId} onChange={onFormChange}
            options={recruiters.map((r) => ({ value: String(r.employee_id), label: r.name }))}
            placeholder="Select recruiter" />
        </Field>
      }

      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5 mt-1">Personal Details</div>
      <TwoColGrid>
        <Field label="Full Name" required>
          {afWrap("name", <Input name="name" value={form.name} onChange={onFormChange} placeholder="Candidate full name" />)}
          <AutoHint field="name" />
        </Field>
        <Field label="Email" required>
          {afWrap("email", <Input name="email" type="email" value={form.email} onChange={onFormChange} placeholder="email@example.com" />)}
          <AutoHint field="email" />
        </Field>
        <Field label="Mobile">
          {afWrap("mobile", <Input name="mobile" value={form.mobile} onChange={onFormChange} placeholder="10-digit mobile" />)}
          <AutoHint field="mobile" />
        </Field>
        <Field label="Gender">
          <Select name="gender" value={form.gender} onChange={onFormChange} options={GENDERS} placeholder="Select gender" />
        </Field>
      </TwoColGrid>

      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Experience & CTC</div>
      <TwoColGrid>
        <Field label="Total Experience (Yrs)" required>
          {afWrap("totalExperience", <Input name="totalExperience" type="number" value={form.totalExperience} onChange={onFormChange} placeholder="e.g. 5" />)}
          <AutoHint field="totalExperience" />
        </Field>
        <Field label="Relevant Experience (Yrs)" required>
          {afWrap("relevantExperience", <Input name="relevantExperience" type="number" value={form.relevantExperience} onChange={onFormChange} placeholder="e.g. 4" />)}
          <AutoHint field="relevantExperience" />
        </Field>
        <Field label="Current CTC (Rs)" required>
          <Input name="currentCtc" type="number" value={form.currentCtc} onChange={onFormChange} placeholder="Annual CTC in rupees" />
        </Field>
        <Field label="Expected CTC (Rs)" required>
          <Input name="expectedCtc" type="number" value={form.expectedCtc} onChange={onFormChange} placeholder="Annual CTC in rupees" />
        </Field>
      </TwoColGrid>

      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Notice Period</div>
      <TwoColGrid>
        <Field label="Serving Notice Period?">
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input type="checkbox" name="noticePeriodServing" checked={!!form.noticePeriodServing} onChange={onFormChange} className="w-4 h-4 accent-[#f18200]" />
            <span className="text-sm text-gray-700">Yes, currently serving</span>
          </label>
        </Field>
        {form.noticePeriodServing &&
          <Field label="Last Working Day">
            <Input name="lastWorkingDay" type="date" value={form.lastWorkingDay} onChange={onFormChange} />
          </Field>
        }
      </TwoColGrid>

      <Field label="Skill Set (comma-separated)" required>
        {afWrap("skillSet", <Input name="skillSet" value={form.skillSet} onChange={onFormChange} placeholder="e.g. Java, Spring Boot, MySQL" />)}
        <AutoHint field="skillSet" />
      </Field>
      <Field label="Source">
        <Select name="source" value={form.source} onChange={onFormChange}
          options={["Naukri.com", "LinkedIn", "Referral", "Indeed", "Monster", "Direct", "Other"]}
          placeholder="Select source" />
      </Field>

      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Address</div>
      <TwoColGrid>
        <Field label="PIN Code"><Input name="pinCode" value={form.pinCode} onChange={onFormChange} placeholder="6-digit PIN" /></Field>
        <Field label="City"><Input name="city" value={form.city} onChange={onFormChange} placeholder="City" /></Field>
        <Field label="State"><Input name="state" value={form.state} onChange={onFormChange} placeholder="State" /></Field>
        <Field label="District"><Input name="district" value={form.district} onChange={onFormChange} placeholder="District" /></Field>
      </TwoColGrid>
    </div>
  );
});

export default CandidateFormStep;
