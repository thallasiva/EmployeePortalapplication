import React, { useEffect, useState } from "react";
import { Briefcase, CalendarCheck, FileCheck, Users, Loader2 } from "lucide-react";
import Card from "./Card";
import Stat from "./Stat";
import DataTable from "./DataTable";
import { statGridClass } from "./data";
import { useNavigate } from "react-router-dom";
import { getDashboard, getErrorMessage } from "../../../api/recruitment.api";
import { apiErrorToast, errorToast } from "../../../utils/ToastControllers";

function ManagerDashboard() {
  const router = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(err => apiErrorToast(err, "Failed to load dashboard"))
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
        <Card title="Candidate Pipeline">
          <div className="flex flex-wrap gap-3 py-2 px-0">
            {data.candidatePipeline.map(r => (
              <div key={r.status} className="py-2 px-4 rounded-lg bg-gray-50 border border-gray-200 min-w-[120px] text-center">
                <div className="text-[22px] font-bold text-[#f18200]">{r.count}</div>
                <div className="text-[12px] text-gray-500 mt-0.5">{r.status}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data?.shortlistedCandidates?.length > 0 && (
        <Card title="Shortlisted Candidates">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Code</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Candidate</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Shortlisted By (Recruiter)</th>
                  <th className="text-left py-2 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.shortlistedCandidates.map(r => (
                  <tr key={r.candidate_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500 font-mono text-[12px]">{r.candidate_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{r.candidate_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#f18200] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                        <span className="w-4 h-4 rounded-full bg-[#f18200] text-white text-[9px] flex items-center justify-center font-bold">
                          {r.hr_name?.charAt(0) ?? "H"}
                        </span>
                        {r.hr_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 text-[12px]">
                      {r.shortlisted_at ? new Date(r.shortlisted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

export default ManagerDashboard;
