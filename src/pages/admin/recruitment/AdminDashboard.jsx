import React, { useEffect, useState } from "react";
import { BarChart3, Briefcase, CalendarCheck, FileCheck, Users, Loader2 } from "lucide-react";
import Card from "./Card";
import DataTable from "./DataTable";
import Stat from "./Stat";
import { statGridClass } from "./data";
import { getDashboard, getErrorMessage } from "../../../api/recruitment.api";
import { errorToast } from "../../../utils/ToastControllers";

function AdminDashboard() {
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 60, color: "#6b7280" }}>
      <Loader2 size={20} /> Loading dashboard…
    </div>
  );

  return (
    <>
      <div className={statGridClass}>
        <Stat icon={Briefcase}    label="Open Requirements"  value={s.open_jobs        ?? "—"} note="Actively hiring" />
        <Stat icon={CalendarCheck} label="Interviews Active"  value={s.in_interview     ?? "—"} note="In pipeline" tone="indigo" />
        <Stat icon={FileCheck}    label="Pending Offers"     value={s.offers_pending   ?? "—"} note="Awaiting response" tone="green" />
        <Stat icon={Users}        label="Onboarding"         value={s.active_onboarding?? "—"} note="In progress" tone="purple" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card title="Candidate Pipeline">
          <DataTable
            columns={["Status", "Count"]}
            rows={(data?.candidatePipeline || []).map(r => ({ Status: r.status, Count: r.count }))}
          />
        </Card>
        <Card title="Recent Job Requests">
          <DataTable
            columns={["Code", "Title", "Status"]}
            rows={(data?.recentJobs || []).map(r => ({ Code: r.job_req_code, Title: r.title, Status: r.assignment_status }))}
          />
        </Card>
      </div>

      {data?.recruiterPerf?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Card title="Recruiter Performance (Last 30 Days)">
            <DataTable
              columns={["Recruiter", "Candidates Added", "Interviews", "Offers"]}
              rows={data.recruiterPerf.map(r => ({
                Recruiter: r.recruiter,
                "Candidates Added": r.candidates_added,
                Interviews: r.interviews_scheduled,
                Offers: r.offers_created,
              }))}
            />
          </Card>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
