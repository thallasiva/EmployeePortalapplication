import React from "react";
import { POSITION_TYPES, BUSINESS_UNITS, ASSIGNMENT_STATUSES, JOB_STATUSES } from "../../mockData";
import { EXPERIENCE_LEVELS } from "../constants/formConstants";
import FRow from "./FRow";
import RateInput from "./RateInput";

const JobFormFields = React.memo(function JobFormFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-x-10">
      <FRow label="Job Title" required>
        <input name="title" value={form.title} onChange={onChange} placeholder="e.g. Java Developer"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>
      <FRow label="Client" required>
        <input name="client" value={form.client} onChange={onChange} placeholder="Client name"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>

      <FRow label="Job ID#" required>
        <input name="jobIdManual" value={form.jobIdManual} onChange={onChange} placeholder="e.g. JOB-2026-001"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>
      <FRow label="Company / Department" optional>
        <input name="companyDept" value={form.companyDept} onChange={onChange} placeholder="e.g. IT / Development"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>

      <FRow label="Bill Rate" required>
        <RateInput
          nameVal="billRate" nameCur="billCurrency" namePeriod="billPeriod"
          val={form.billRate} cur={form.billCurrency} period={form.billPeriod}
          onChange={onChange}
        />
      </FRow>
      <FRow label="Pay Rate" required>
        <RateInput
          nameVal="payRate" nameCur="payCurrency" namePeriod="payPeriod"
          val={form.payRate} cur={form.payCurrency} period={form.payPeriod}
          onChange={onChange}
        />
      </FRow>

      <FRow label="Position Type" required>
        <select name="positionType" value={form.positionType} onChange={onChange}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
          {POSITION_TYPES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </FRow>
      <FRow label="No of Vacancies" required>
        <input name="vacancies" type="number" min="1" value={form.vacancies} onChange={onChange} placeholder="e.g. 2"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>

      <FRow label="City" optional>
        <input name="city" value={form.city} onChange={onChange} placeholder="City"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>
      <FRow label="Country" required>
        <input name="country" value={form.country} onChange={onChange} placeholder="e.g. India, USA"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>

      <FRow label="Experience Level" required>
        <select name="experienceLevel" value={form.experienceLevel} onChange={onChange}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
          <option value="">Select level</option>
          {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </FRow>
      <FRow label="Job Status" required>
        <select name="jobStatus" value={form.jobStatus} onChange={onChange}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
          <option value="">Select status</option>
          {JOB_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </FRow>

      <FRow label="Business Unit" required>
        <select name="businessUnit" value={form.businessUnit} onChange={onChange}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
          <option value="">Select unit</option>
          {BUSINESS_UNITS.map((b) => <option key={b}>{b}</option>)}
        </select>
      </FRow>
      <FRow label="Recruiter Assignment Status" required>
        <select name="assignmentStatus" value={form.assignmentStatus} onChange={onChange}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit">
          {ASSIGNMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </FRow>

      <FRow label="Job Opportunity Referred by Phone" optional>
        <input name="opportunityPhone" value={form.opportunityPhone} onChange={onChange} placeholder="Phone number"
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit" />
      </FRow>
      <div />

      <FRow label="Skill Set" required span>
        <textarea
          name="skillSet"
          value={form.skillSet}
          onChange={onChange}
          placeholder={"e.g. Java, Spring Boot, MySQL, React\nAdd each skill on a new line or comma-separated"}
          rows={3}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit resize-y leading-[1.5]"
        />
      </FRow>

      <FRow label="Job Description" required span>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Detailed job description, requirements, responsibilities…"
          rows={5}
          className="box-border w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-[13px] text-gray-900 outline-none font-inherit resize-y leading-[1.5]"
        />
      </FRow>
    </div>
  );
});

export default JobFormFields;
