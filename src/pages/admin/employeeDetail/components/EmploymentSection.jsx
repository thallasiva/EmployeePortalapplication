import React from "react";
import { Briefcase } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { fieldOptionsFor } from "../../../../utils/fieldOptions";
import { fmt } from "../utils";
import SectionHead from "./SectionHead";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import Row from "./Row";
const EmploymentSection = React.memo(function EmploymentSection({
  employee, editMode, form, formErrors, touched, set, touch, departments, managers, fieldOptions,
}) {
  return (
    <div className="emp-review-section">
      <SectionHead icon={Briefcase} title="Employment Details" />
      {editMode ? (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" })}>
          <FormSelect label="Department" value={form.department_id} onChange={set("department_id")} placeholder="Select department" options={departments} required onBlur={touch("department_id")} error={formErrors.department_id} touched={touched.department_id} />
          <FormInput label="Job Title / Role" value={form.emp_job_title} onChange={set("emp_job_title")} required onBlur={touch("emp_job_title")} error={formErrors.emp_job_title} touched={touched.emp_job_title} />
          <FormSelect label="Reporting Manager" value={form.reporting_to} onChange={set("reporting_to")} placeholder="No manager" options={managers} />
          <FormInput label="Date of Joining" value={form.emp_joining_date} onChange={set("emp_joining_date")} type="date" required onBlur={touch("emp_joining_date")} error={formErrors.emp_joining_date} touched={touched.emp_joining_date} />
          <FormSelect label="Employee Type" value={form.employee_type} onChange={set("employee_type")} options={fieldOptionsFor(fieldOptions, "employee_type", form.employee_type)} required onBlur={touch("employee_type")} error={formErrors.employee_type} touched={touched.employee_type} />
          <FormSelect label="Employee Status" value={form.employee_status} onChange={set("employee_status")} options={fieldOptionsFor(fieldOptions, "employee_status", form.employee_status)} required onBlur={touch("employee_status")} error={formErrors.employee_status} touched={touched.employee_status} />
          <FormSelect label="BGV Status" value={form.bgv_status} onChange={set("bgv_status")} placeholder="Select BGV status" options={fieldOptionsFor(fieldOptions, "bgv_status", form.bgv_status)} />
          <FormInput label="Leaving Date" value={form.emp_exit_date} onChange={set("emp_exit_date")} type="date" onBlur={touch("emp_exit_date")} error={formErrors.emp_exit_date} touched={touched.emp_exit_date} />
          <FormInput label="Location" value={form.location} onChange={set("location")} />
        </div>
      ) : (
        <dl className="emp-review-grid">
          <Row label="Department" value={employee.department_name} />
          <Row label="Designation" value={employee.designation_name} />
          <Row label="Job Title" value={employee.emp_job_title} />
          <Row label="Reporting Manager" value={employee.reporting_to_name?.trim()} />
          <Row label="Date of Joining" value={fmt(employee.emp_joining_date)} />
          <Row label="Employee Type" value={employee.employee_type} />
          <Row label="Employee Status" value={employee.employee_status} />
          <Row label="BGV Status" value={employee.bgv_status} />
          <Row label="Leaving Date" value={fmt(employee.emp_exit_date)} />
          <Row label="Location" value={employee.location} />
        </dl>
      )}
    </div>
  );
});
export default EmploymentSection;
