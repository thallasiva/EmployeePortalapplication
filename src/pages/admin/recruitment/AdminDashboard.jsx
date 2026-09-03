import React, { useEffect, useState } from "react";
import { BarChart3, Briefcase, CalendarCheck, FileCheck, Users, Loader2 } from "lucide-react";
import Card from "./Card";
import DataTable from "./DataTable";
import Stat from "./Stat";
import { statGridClass } from "./data";
import { getDashboard, getErrorMessage } from "../../../api/recruitment.api";
import { apiErrorToast, errorToast } from "../../../utils/ToastControllers";

function AdminDashboard() {
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
    <div className="flex items-center justify-center gap-2.5 py-[60px] text-gray-500">
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

      <div className="grid grid-cols-2 gap-4 mt-4">
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

      {data?.shortlistedCandidates?.length > 0 && (
        <div className="mt-4">
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
        </div>
      )}

      {data?.recruiterPerf?.length > 0 && (
       <div className="mt-4">
          <Card title="Recruiter Performance (Last 30 Days)">
            <DataTable
              columns={["Recruiter", "Candidates Added", "Interviews", "Offers"]}
              rows={data.recruiterPerf.map(r => ({
                Recruiter: r.recruiter,
                "Candidates Added": r.candidates_added ?? 0,
                Interviews: r.interviews_scheduled ?? 0,
                Offers: r.offers_created ?? 0,
              }))}
            />
          </Card>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
