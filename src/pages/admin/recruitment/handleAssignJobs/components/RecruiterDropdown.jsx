import React from "react";
import Btn from "../../Btn";
import { RECRUITERS } from "../constants";

const RecruiterDropdown = React.memo(function RecruiterDropdown({ jobId, assignments, onToggle, onDone }) {
  return (
    <div className="absolute left-0 top-11 z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-xl">
      <div className="max-h-60 overflow-y-auto p-2">
        {RECRUITERS.map((recruiter) => (
          <label
            key={recruiter.key}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-blue-50"
          >
            <input
              type="checkbox"
              checked={(assignments[jobId] || []).includes(recruiter.key)}
              onChange={() => onToggle(jobId, recruiter.key)}
            />
            <span className="text-xs font-medium text-gray-700">{recruiter.name}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end border-t bg-gray-50 p-2">
        <Btn small primary onClick={onDone}>Done</Btn>
      </div>
    </div>
  );
});

export default RecruiterDropdown;
