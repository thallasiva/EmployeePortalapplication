import React from "react";
import { Search } from "lucide-react";
import { inputClass } from "../constants";

const JobSearchFilters = React.memo(function JobSearchFilters() {
  return (
    <div className="mb-3.5 grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_180px]">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        <input
          readOnly
          placeholder="Search Job Title / Job ID / Client"
          className={`${inputClass} pl-8`}
        />
      </div>
      <select disabled className={inputClass}>
        <option>Job Status</option>
        <option>Active</option>
        <option>In Active</option>
      </select>
      <select disabled className={inputClass}>
        <option>Recruiter Assignment Status</option>
        <option>Open</option>
        <option>Closed</option>
        <option>Completed</option>
        <option>Hold</option>
      </select>
    </div>
  );
});

export default JobSearchFilters;
