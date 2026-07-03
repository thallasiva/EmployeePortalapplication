import React, { useEffect, useState } from "react";
import { Briefcase, CalendarCheck, FileCheck, Users, Loader2 } from "lucide-react";
import Card from "./Card";
import Stat from "./Stat";
import DataTable from "./DataTable";
import { statGridClass } from "./data";
import { useNavigate } from "react-router-dom";
import { getDashboard, getErrorMessage } from "../../../api/recruitment.api";
import { errorToast } from "../../../utils/ToastControllers";

function ManagerDashboard() {
  const router = useNavigate();
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
      <div className="flex justify-end mb-4">
        <button onClick={() => router("/recruiter/recruitment/create-new")}
          className="px-4 py-2 bg-orange-500 text-white rounded">
          New Recruitment
        </button>
      </div>
      <div className={statGridClass}>
        <Stat icon={Briefcase}    label="Total Requirements" value={s.total_jobs         ?? "—"} note="All jobs" />
        <Stat icon={Briefcase}    label="Open Requirements"  value={s.open_jobs          ?? "—"} note="Actively hiring" tone="green" />
        <Stat icon={Users}        label="Total Candidates"   value={s.total_candidates   ?? "—"} note="Active profiles" tone="indigo" />
        <Stat icon={CalendarCheck} label="In Interview"      value={s.in_interview       ?? "—"} note="Scheduled" tone="purple" />
        <Stat icon={FileCheck}    label="Shortlisted"        value={s.shortlisted        ?? "—"} note="Pending offer" tone="orange" />
        <Stat icon={Users}        label="Active Onboarding"  value={s.active_onboarding  ?? "—"} note="In progress" tone="brand" />
      </div>
      {data?.candidatePipeline?.length > 0 && (
        <Card title="Candidate Pipeline" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "8px 0" }}>
            {data.candidatePipeline.map(r => (
              <div key={r.status} style={{ padding: "8px 16px", borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb", minWidth: 120, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f18200" }}>{r.count}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.status}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

export default ManagerDashboard;
