import React, { useEffect, useState } from "react";
import { Briefcase, CalendarCheck, FileCheck, Users, Loader2 } from "lucide-react";
import Card from "./Card";
import DataTable from "./DataTable";
import Stat from "./Stat";
import { statGridClass } from "./data";
import { getDashboard, getErrorMessage } from "../../../api/recruitment.api";
import { errorToast } from "../../../utils/ToastControllers";

function RecruiterDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(err => errorToast(getErrorMessage(err, "Failed to load dashboard")))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats || {};

  if (loading) return (
    <div className="flex items-center justify-center gap-2.5 p-[60px] text-gray-500">
      <Loader2 size={20} /> Loading dashboard…
    </div>
  );

  return (
    <>
      <div className={statGridClass}>
        <Stat icon={Briefcase}    label="My Open Jobs"       value={s.my_open_jobs    ?? "—"} note="Assigned to me" />
        <Stat icon={Users}        label="My Candidates"      value={s.my_candidates   ?? "—"} note="Profiles added" tone="indigo" />
        <Stat icon={CalendarCheck} label="In Interview"      value={s.my_in_interview ?? "—"} note="Scheduled" tone="green" />
        <Stat icon={FileCheck}    label="Shortlisted"        value={s.my_shortlisted  ?? "—"} note="Pending offer" tone="red" />
      </div>

      {data?.assignedJobs?.length > 0 && (
        <Card title="My Assigned Jobs">
          <DataTable
            columns={["Job ID", "Title", "Client", "Status", "My Candidates"]}
            rows={data.assignedJobs.map(j => ({
              "Job ID":       j.job_req_code,
              Title:          j.title,
              Client:         j.client,
              Status:         j.assignment_status,
              "My Candidates": j.my_candidates,
            }))}
          />
        </Card>
      )}

      {data?.upcomingInterviews?.length > 0 && (
        <Card title="Upcoming Interviews (Next 7 Days)">
          <DataTable
            columns={["ID", "Candidate", "Level", "Date", "Time"]}
            rows={data.upcomingInterviews.map(iv => ({
              ID:        iv.interview_code,
              Candidate: iv.candidate_name,
              Level:     iv.level,
              Date:      iv.interview_date,
              Time:      iv.interview_time,
            }))}
          />
        </Card>
      )}
    </>
  );
}

export default RecruiterDashboard;
