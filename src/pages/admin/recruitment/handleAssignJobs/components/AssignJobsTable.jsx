import React from "react";
import Card from "../../Card";
import Badge from "../../Badge";
import Btn from "../../Btn";
import RecruiterDropdown from "./RecruiterDropdown";
import { JOB_REQUESTS, RECRUITERS, badgeColor } from "../constants";

const COLUMNS = [
  "Job ID", "Job Title", "Client", "Company/Department",
  "Position Type", "Job Status", "Recruiter Assignment Status", "Assign Recruiter",
];

const AssignJobsTable = React.memo(function AssignJobsTable({
  selectedJobs,
  selectedRecruiters,
  jobAssignments,
  openRecruiterDropdown,
  assignMessage,
  onSelectAll,
  onToggleJob,
  onToggleDropdown,
  onToggleRecruiter,
  onCloseDropdown,
  onAssignJobs,
}) {
  return (
    <Card title="Assign Job/List Jobs">
      <div className="space-y-3.5 p-3.5">
        <div className="overflow-x-auto rounded border-[0.5px] border-gray-200">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="whitespace-nowrap border-b-[0.5px] border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-500 w-10">
                  <input
                    type="checkbox"
                    checked={selectedJobs.length === JOB_REQUESTS.length && JOB_REQUESTS.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </th>
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOB_REQUESTS.map((job) => (
                <tr key={job["Job ID"]} className="border-b-[0.5px] border-gray-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job["Job ID"])}
                      onChange={() => onToggleJob(job["Job ID"])}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">{job["Job ID"]}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">{job["Job Title"]}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">{job.Client}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">{job["Company/Department"]}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">{job["Position Type"]}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                    <Badge color={badgeColor(job["Job Status"])}>{job["Job Status"]}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700">
                    <Badge color={badgeColor(job["Recruiter Assignment Status"])}>
                      {job["Recruiter Assignment Status"]}
                    </Badge>
                  </td>
                  <td className="relative whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onToggleDropdown(job["Job ID"])}
                      className="flex w-64 items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-xs shadow-sm hover:border-blue-500"
                    >
                      <span className="truncate">
                        {(jobAssignments[job["Job ID"]] || []).length > 0
                          ? RECRUITERS.filter((r) =>
                              (jobAssignments[job["Job ID"]] || []).includes(r.key)
                            ).map((r) => r.name).join(", ")
                          : "Assign Recruiter"}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openRecruiterDropdown === job["Job ID"] && (
                      <RecruiterDropdown
                        jobId={job["Job ID"]}
                        assignments={jobAssignments}
                        onToggle={onToggleRecruiter}
                        onDone={onCloseDropdown}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedJobs.length > 0 && (
          <div className="flex items-center justify-between rounded-md bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-900">
              {selectedJobs.length} job(s) selected · {selectedRecruiters.length} recruiter(s) selected
            </div>
            <Btn primary onClick={onAssignJobs}>Assign Jobs</Btn>
          </div>
        )}

        {assignMessage && (
          <div className={`rounded-md p-3 text-xs font-semibold ${
            assignMessage.includes("Successfully")
              ? "bg-green-50 text-green-800"
              : "bg-yellow-50 text-yellow-800"
          }`}>
            {assignMessage}
          </div>
        )}
      </div>
    </Card>
  );
});

export default AssignJobsTable;
