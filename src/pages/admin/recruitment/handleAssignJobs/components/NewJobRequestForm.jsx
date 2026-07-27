import React from "react";
import Card from "../../Card";
import Btn from "../../Btn";
import { gridClass, inputClass, labelTextClass, footerActionsClass } from "../constants";

const NewJobRequestForm = React.memo(function NewJobRequestForm() {
  return (
    <Card title="New Job Request">
      <div className={gridClass[4]}>
        <div>
          <label className={labelTextClass}>Job Title</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Job ID</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Client</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Company/Department</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Bill Rate</label>
          <input type="number" className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Pay Rate</label>
          <input type="number" className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Position Type</label>
          <select className={inputClass}>
            <option>Contract</option>
            <option>Permanent</option>
            <option>Contract to Hire</option>
            <option>Direct Hire</option>
          </select>
        </div>
        <div>
          <label className={labelTextClass}>No of Vacancies</label>
          <input type="number" className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>City</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Country</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Experience Level</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Job Status</label>
          <select className={inputClass}>
            <option>Active</option>
            <option>Inactive</option>
            <option>Hold</option>
            <option>Closed</option>
          </select>
        </div>
        <div>
          <label className={labelTextClass}>Business Unit</label>
          <input className={inputClass} />
        </div>
        <div>
          <label className={labelTextClass}>Recruiter Assignment Status</label>
          <select className={inputClass}>
            <option>Open</option>
            <option>Assigned</option>
            <option>Completed</option>
            <option>Hold</option>
          </select>
        </div>
        <div className="col-span-full">
          <label className={labelTextClass}>Job Description</label>
          <textarea rows={5} className={inputClass} />
        </div>
      </div>
      <div className={footerActionsClass}>
        <Btn>Cancel</Btn>
        <Btn primary>Submit Job Requirement</Btn>
      </div>
    </Card>
  );
});

export default NewJobRequestForm;
