import React from "react";
import Field from "./Field";

const StepEmployment = React.memo(function StepEmployment({
  values,
  errors,
  setField,
  departments,
  members,
}) {
  return (
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
        <Field label="Role / Job Title" required error={errors.emp_job_title}>
          <input
            value={values.emp_job_title}
            onChange={(e) => setField("emp_job_title", e.target.value)}
            placeholder="Job title / role"
          />
        </Field>
        <Field label="Previous Designation">
          <input
            value={values.previous_designation}
            onChange={(e) => setField("previous_designation", e.target.value)}
            placeholder="Designation at previous employer"
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
                {m.full_name || `${m.first_name || ""} ${m.last_name || ""}`.trim()}
                {m.designation_name ? ` — ${m.designation_name}` : ""}
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
              <option
                key={`assign-${m.employee_id}`}
                value={m.full_name || `${m.first_name || ""} ${m.last_name || ""}`.trim()}
              >
                {m.full_name || `${m.first_name || ""} ${m.last_name || ""}`.trim()}
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
        <Field label="Date of Confirmation">
          <input
            type="date"
            value={values.date_of_confirmation}
            onChange={(e) => setField("date_of_confirmation", e.target.value)}
          />
        </Field>
        <Field label="Contract End Date">
          <input
            type="date"
            value={values.contract_end_date}
            onChange={(e) => setField("contract_end_date", e.target.value)}
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
        <Field label="Project / Cost Centre">
          <input
            value={values.project_cost_centre}
            onChange={(e) => setField("project_cost_centre", e.target.value)}
            placeholder="e.g. CC-HR-001"
          />
        </Field>
        <Field label="Previous Employer">
          <input
            value={values.previous_employer}
            onChange={(e) => setField("previous_employer", e.target.value)}
            placeholder="Last company name"
          />
        </Field>
        <Field label="Total Exp Before Joining (yrs)">
          <input
            type="number"
            step="0.5"
            min="0"
            value={values.total_exp_before_joining}
            onChange={(e) => setField("total_exp_before_joining", e.target.value)}
            placeholder="e.g. 3.5"
          />
        </Field>
        <Field label="BGV Status">
          <select
            value={values.bgv_status}
            onChange={(e) => setField("bgv_status", e.target.value)}
          >
            <option value="">Select status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Waived">Waived</option>
          </select>
        </Field>
      </div>
    </>
  );
});

export default StepEmployment;
