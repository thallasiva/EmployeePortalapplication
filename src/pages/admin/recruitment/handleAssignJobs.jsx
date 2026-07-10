import { Search } from "lucide-react";
import Btn from "./Btn";
import { badgeColor, footerActionsClass, gridClass, inputClass, JOB_REQUESTS, labelTextClass, RECRUITERS } from "./data";
import Card from "./Card";
import DataTable from "./DataTable";
import { useState } from "react";
import Badge from "./Badge";

function RequirementsTab({ role, recruiterKey })
{
    const [selectedJobs, setSelectedJobs] = useState([]);
    const [selectedRecruiters, setSelectedRecruiters] = useState(["Mike W."]);
    const [assignMessage, setAssignMessage] = useState("");
    const [topJobs, setTopJobs] = useState(["JOB-001"]);
    const [jobAssignments, setJobAssignments] = useState({});
    const [openRecruiterDropdown, setOpenRecruiterDropdown] = useState(null);



    if (role.id === 5)
    {
        const myJobs = JOB_REQUESTS.filter((job) => job["Select Recruiter"] === recruiterKey);
        return (
            <Card title="My Tasks">
                <DataTable columns={["Job ID", "Job Title", "Client", "My Tasks", "Status"]} rows={myJobs} />
            </Card>
        );
    }

    const toggleJobSelection = (jobId) =>
    {
        setSelectedJobs((prev) =>
            prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
        );
    };

    const toggleRecruiter = (jobId, recruiterKey) =>
    {
        setJobAssignments((prev) =>
        {
            const selected = prev[jobId] || [];

            const updated = selected.includes(recruiterKey)
                ? selected.filter((r) => r !== recruiterKey)
                : [...selected, recruiterKey];

            return {
                ...prev,
                [jobId]: updated,
            };
        });
    };

    const handleAssignJobs = () =>
    {
        if (selectedJobs.length === 0 || selectedRecruiters.length === 0)
        {
            setAssignMessage("Please select at least one job and one recruiter.");
            setTimeout(() => setAssignMessage(""), 3000);
            return;
        }
        setAssignMessage(
            `Successfully assigned ${selectedJobs.length} job(s) to ${selectedRecruiters.length} recruiter(s).`
        );
        setSelectedJobs([]);
        setSelectedRecruiters(["Mike W."]);
        setTimeout(() => setAssignMessage(""), 3000);
    };

    const handleAssignRecruiter = (jobId, recruiterKey) =>
    {
        setJobAssignments((prev) => ({
            ...prev,
            [jobId]: recruiterKey,
        }));

        const recruiter = RECRUITERS.find(
            (r) => r.key === recruiterKey
        );

        if (recruiter)
        {
            setAssignMessage(
                `Job ${jobId} assigned successfully to ${recruiter.name}.`
            );
        }
    };


    return (
        <>
            <div className="mb-3.5 grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_180px]">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input readOnly placeholder="Search Job Title / Job ID / Client" className={`${inputClass} pl-8`} />
                </div>
                <select disabled className={inputClass}><option>Job Status</option><option>Active</option><option>In Active</option></select>
                <select disabled className={inputClass}><option>Recruiter Assignment Status</option><option>Open</option><option>Closed</option><option>Completed</option><option>Hold</option></select>
            </div>
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

                    {/* Dropdown */}
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

                    {/* Dropdown */}
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

                    {/* Dropdown */}
                    <div>
                        <label className={labelTextClass}>Recruiter Assignment Status</label>
                        <select className={inputClass}>
                            <option>Open</option>
                            <option>Assigned</option>
                            <option>Completed</option>
                            <option>Hold</option>
                        </select>
                    </div>

                    {/* Textarea */}
                    <div className="col-span-full">
                        <label className={labelTextClass}>Job Description</label>
                        <textarea rows={5} className={inputClass} />
                    </div>

                </div>
                {/* <FieldGrid fields={["Job Title", "Job ID", "Client", "Company/Department", "Bill Rate", "Pay Rate", "Position Type", "Job Status", "Business Unit", "Recruiter Assignment Status", "Job Description"]} /> */}
                <div className={footerActionsClass}>
                    <Btn>Cancel</Btn>
                    <Btn primary>Submit Job Requirement</Btn>
                </div>
            </Card>
            <Card title="Assign Job/List Jobs">
                <div className="space-y-3.5 p-3.5">


                    <div className="overflow-x-auto rounded border-[0.5px] border-gray-200">
                        <table className="w-full border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="whitespace-nowrap border-b-[0.5px] border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-500 w-10">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedJobs.length === JOB_REQUESTS.length &&
                                                JOB_REQUESTS.length > 0
                                            }
                                            onChange={(e) =>
                                                setSelectedJobs(
                                                    e.target.checked
                                                        ? JOB_REQUESTS.map((job) => job["Job ID"])
                                                        : []
                                                )
                                            }
                                        />
                                    </th>
                                    {[
                                        "Job ID",
                                        "Job Title",
                                        "Client",
                                        "Company/Department",
                                        "Position Type",
                                        "Job Status",
                                        "Recruiter Assignment Status",
                                        "Assign Recruiter",
                                    ].map((column) => (
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
                                                onChange={() => toggleJobSelection(job["Job ID"])}
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
                                            <Badge color={badgeColor(job["Recruiter Assignment Status"])}>{job["Recruiter Assignment Status"]}</Badge>
                                        </td>
                                        {/* <td className="whitespace-nowrap px-3 py-2">
                                            <select
                                                className="w-52 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                value={jobAssignments[job["Job ID"]] || ""}
                                                onChange={(e) =>
                                                    handleAssignRecruiter(job["Job ID"], e.target.value)
                                                }
                                            >
                                                <option value="">Assign Recruiter</option>

                                                {RECRUITERS.map((recruiter) => (
                                                    <option
                                                        key={recruiter.key}
                                                        value={recruiter.key}
                                                    >
                                                        {recruiter.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td> */}
                                        <td className="relative whitespace-nowrap px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenRecruiterDropdown(
                                                        openRecruiterDropdown === job["Job ID"]
                                                            ? null
                                                            : job["Job ID"]
                                                    )
                                                }
                                                className="flex w-64 items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-xs shadow-sm hover:border-blue-500"
                                            >
                                                <span className="truncate">
                                                    {(jobAssignments[job["Job ID"]] || []).length > 0
                                                        ? RECRUITERS.filter((recruiter) =>
                                                            (jobAssignments[job["Job ID"]] || []).includes(recruiter.key)
                                                        )
                                                            .map((recruiter) => recruiter.name)
                                                            .join(", ")
                                                        : "Assign Recruiter"}
                                                </span>

                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-gray-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </button>

                                            {openRecruiterDropdown === job["Job ID"] && (
                                                <div className="absolute left-0 top-11 z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-xl">

                                                    <div className="max-h-60 overflow-y-auto p-2">

                                                        {RECRUITERS.map((recruiter) => (
                                                            <label
                                                                key={recruiter.key}
                                                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-blue-50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        (jobAssignments[job["Job ID"]] || []).includes(
                                                                            recruiter.key
                                                                        )
                                                                    }
                                                                    onChange={() =>
                                                                        toggleRecruiter(
                                                                            job["Job ID"],
                                                                            recruiter.key
                                                                        )
                                                                    }
                                                                />

                                                                <span className="text-xs font-medium text-gray-700">
                                                                    {recruiter.name}
                                                                </span>
                                                            </label>
                                                        ))}

                                                    </div>

                                                    <div className="flex justify-end border-t bg-gray-50 p-2">
                                                        <Btn
                                                            small
                                                            primary
                                                            onClick={() =>
                                                                setOpenRecruiterDropdown(null)
                                                            }
                                                        >
                                                            Done
                                                        </Btn>
                                                    </div>

                                                </div>
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
                            <Btn primary onClick={handleAssignJobs}>
                                Assign Jobs
                            </Btn>
                        </div>
                    )}

                    {assignMessage && (
                        <div className={`rounded-md p-3 text-xs font-semibold ${assignMessage.includes("Successfully")
                            ? "bg-green-50 text-green-800"
                            : "bg-yellow-50 text-yellow-800"
                            }`}>
                            {assignMessage}
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
}

export default RequirementsTab;