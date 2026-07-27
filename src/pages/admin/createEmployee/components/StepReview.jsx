import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { formatSalary, formatDate } from "../utils";

const StepReview = React.memo(function StepReview({ values, departments, members }) {
  const deptName =
    departments.find((d) => String(d.department_id) === String(values.department_id))
      ?.department_name || "—";

  const managerName =
    values.reporting_to === "none"
      ? "None"
      : (() => {
          const m = members.find((x) => String(x.employee_id) === String(values.reporting_to));
          return m ? m.full_name || `${m.first_name || ""} ${m.last_name || ""}`.trim() : "—";
        })();

  return (
    <>
      <h2>Review &amp; Confirm</h2>
      <div className="emp-review-section">
        <h3>Personal Information</h3>
        <dl className="emp-review-grid">
          <div><dt>Employee ID</dt><dd>{values.employee_id}</dd></div>
          <div><dt>Biometric ID</dt><dd>{values.biometric_id || "—"}</dd></div>
          <div><dt>Name</dt><dd>{values.first_name} {values.last_name}</dd></div>
          <div><dt>Email</dt><dd>{values.email}</dd></div>
          <div><dt>Phone</dt><dd>{values.mobile}</dd></div>
        </dl>
      </div>
      <div className="emp-review-section">
        <h3>Employment Details</h3>
        <dl className="emp-review-grid">
          <div><dt>Department</dt><dd>{deptName}</dd></div>
          <div><dt>Role</dt><dd>{values.emp_job_title}</dd></div>
          <div><dt>Previous Designation</dt><dd>{values.previous_designation || "—"}</dd></div>
          <div><dt>Manager</dt><dd>{managerName}</dd></div>
          <div><dt>Start Date</dt><dd>{formatDate(values.emp_joining_date)}</dd></div>
          <div><dt>Date of Confirmation</dt><dd>{formatDate(values.date_of_confirmation)}</dd></div>
          <div><dt>Contract End Date</dt><dd>{formatDate(values.contract_end_date)}</dd></div>
          <div><dt>Type</dt><dd><span className="emp-type-badge">{values.employee_type}</span></dd></div>
          <div><dt>Project / Cost Centre</dt><dd>{values.project_cost_centre || "—"}</dd></div>
          <div><dt>Previous Employer</dt><dd>{values.previous_employer || "—"}</dd></div>
          <div><dt>Exp Before Joining</dt><dd>{values.total_exp_before_joining ? `${values.total_exp_before_joining} yrs` : "—"}</dd></div>
          <div><dt>BGV Status</dt><dd>{values.bgv_status || "—"}</dd></div>
        </dl>
      </div>
      <div className="emp-review-section">
        <h3>Compensation</h3>
        <dl className="emp-review-grid">
          <div><dt>Salary</dt><dd>{values.ctc ? `${formatSalary(values.ctc)}/yr` : "—"}</dd></div>
          <div><dt>Benefits</dt><dd className={cssClass({ textTransform: "capitalize" })}>{values.benefits_plan}</dd></div>
        </dl>
      </div>
      <div className="emp-review-section">
        <h3>Statutory &amp; Bank</h3>
        <dl className="emp-review-grid">
          <div><dt>Aadhaar Number</dt><dd>{values.aadhaar_number || "—"}</dd></div>
          <div><dt>PAN Number</dt><dd>{values.pan_number || "—"}</dd></div>
          <div><dt>UAN Number</dt><dd>{values.uan_number || "—"}</dd></div>
          <div><dt>PF Number</dt><dd>{values.pf_number || "—"}</dd></div>
          <div><dt>Educational Qualification</dt><dd>{values.educational_qualification || "—"}</dd></div>
          <div><dt>Bank Name</dt><dd>{values.bank_name || "—"}</dd></div>
          <div><dt>Account Number</dt><dd>{values.account_number || "—"}</dd></div>
          <div><dt>IFSC Code</dt><dd>{values.ifsc_code || "—"}</dd></div>
        </dl>
      </div>
    </>
  );
});

export default StepReview;
