import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate } from "../utils";
import Field from "./Field";
import InfoCard from "./InfoCard";
import { Grid } from "./Grid";
import ResignationStatus from "./ResignationStatus";

const EmploymentSection = React.memo(function EmploymentSection({ e, resignation, resignBtn, onWithdraw, withdrawing }) {
  return (
    <div id="section-employment" className={cssClass({ marginTop: 8 })}>
      <InfoCard id="card-employment" title="Employment" action={resignBtn}>
        <Grid cols={3}>
          <Field label="Employee Type"   value={e.employee_type} />
          <Field label="Employee Status" value={e.employee_status} />
          <Field label="Joining Date"    value={fmtDate(e.emp_joining_date)} />
          <Field label="Department"      value={e.department_name} />
          <Field label="Designation"     value={e.designation_name || e.emp_job_title} />
          <Field label="Reporting To"    value={e.manager_name} />
          <Field label="Location"        value={e.location} />
          <Field label="Shift"           value={e.shift} />
          <Field label="Holiday Calendar" value={e.holiday_calendar} />
        </Grid>
        {resignation && (
          <ResignationStatus data={resignation} onWithdraw={onWithdraw} withdrawing={withdrawing} />
        )}
      </InfoCard>
    </div>
  );
});

export default EmploymentSection;
