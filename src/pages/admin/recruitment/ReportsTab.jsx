import { useEffect, useState } from "react";
import {
  Briefcase, CalendarCheck, CheckCircle, Clock,
  FileCheck, RefreshCw, TrendingUp, Users } from
"lucide-react";
import ReportDonutPanel from "../../../component/reports/ReportDonutPanel";
import Card from "./Card";
import Stat from "./Stat";
import { getDashboard, getPipelineReport, listRecruiters } from "../../../api/recruitment.api";


const STATUS_COLORS = {
  "new": "#2563eb",
  "applied": "#2563eb",
  "screening": "#f59e0b",
  "schedule interview": "#f59e0b",
  "shortlisted": "#8b5cf6",
  "offer released": "#22c55e",
  "offer released and accepted": "#22c55e",
  "accepted": "#22c55e",
  "onboarded": "#0ea5e9",
  "joined": "#0ea5e9",
  "rejected": "#ef4444",
  "not selected": "#ef4444",
  "work in progress": "#64748b",
  "in progress": "#64748b"
};
const FALLBACK_COLORS = ["#2563eb", "#f59e0b", "#8b5cf6", "#22c55e", "#0ea5e9", "#ef4444", "#64748b", "#f97316"];

function statusColor(status, idx) {
  return STATUS_COLORS[(status || "").toLowerCase()] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}


const SRC_COLORS = ["#3b82f6", "#a855f7", "#14b8a6", "#f59e0b", "#ef4444", "#22c55e", "#64748b", "#f97316"];


function fmt(n) {return n == null ? "—" : Number(n).toLocaleString();}
function fmtDays(n) {return n == null ? "—" : `${Math.round(n)} days`;}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-12 text-gray-400 gap-2 text-sm">
      <RefreshCw size={16} className="animate-spin" /> Loading…
    </div>);

}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>);

}


function ReportsTab() {
  const [dash, setDash] = useState(null);
  const [report, setReport] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repLoading, setRepLoading] = useState(false);


  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [recruiterId, setRecruiterId] = useState("");


  useEffect(() => {
    setLoading(true);
    Promise.all([
    getDashboard(),
    getPipelineReport({ fromDate, toDate }),
    listRecruiters()]
    ).
    then(([d, r, rec]) => {
      setDash(d);
      setReport(r);
      setRecruiters(rec || []);
    }).
    catch(console.error).
    finally(() => setLoading(false));
  }, []);


  const applyFilter = () => {
    setRepLoading(true);
    getPipelineReport({ fromDate, toDate, recruiterId: recruiterId || undefined }).
    then(setReport).
    catch(console.error).
    finally(() => setRepLoading(false));
  };


  const pipelineSegments = (dash?.candidatePipeline || []).map((r, i) => ({
    name: r.status,
    value: Number(r.count),
    color: statusColor(r.status, i)
  }));

  const funnelSegments = (report?.funnel || []).map((r, i) => ({
    name: r.status,
    value: Number(r.count),
    color: statusColor(r.status, i)
  }));

  const offerSegments = (() => {
    const pending = Number(dash?.stats?.offers_pending || 0);
    const accepted = Number(dash?.stats?.offers_accepted || 0);
    return [
    { name: "Pending", value: pending, color: "#f97316" },
    { name: "Accepted", value: accepted, color: "#22c55e" }].
    filter((s) => s.value > 0);
  })();

  const stats = dash?.stats || {};
  const tth = report?.timeToHire || {};

  return (
    <div className="space-y-5">

      {}
      <Card title="Recruitment Overview">
        {loading ? <LoadingRow /> :
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 p-4">
            <Stat icon={Briefcase} label="Open Requirements" value={fmt(stats.open_jobs)} note="Active job reqs" tone="brand" />
            <Stat icon={Users} label="Total Candidates" value={fmt(stats.total_candidates)} note="All time profiles" tone="indigo" />
            <Stat icon={CalendarCheck} label="In Interview" value={fmt(stats.in_interview)} note="Scheduled interviews" tone="purple" />
            <Stat icon={FileCheck} label="Offers Released" value={fmt(stats.offers_pending)} note="Awaiting response" tone="green" />
          </div>
        }
      </Card>

      {}
      {!loading &&
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={CheckCircle} label="Offers Accepted" value={fmt(stats.offers_accepted)} note="Last 30 days" tone="green" />
          <Stat icon={Users} label="Shortlisted" value={fmt(stats.shortlisted)} note="Ready for offer" tone="purple" />
          <Stat icon={TrendingUp} label="Active Onboarding" value={fmt(stats.active_onboarding)} note="In progress" tone="indigo" />
          <Stat icon={Clock} label="Avg. Time to Hire" value={fmtDays(tth.avg_days_to_hire)} note={tth.min_days != null ? `Min ${Math.round(tth.min_days)}d / Max ${Math.round(tth.max_days)}d` : "No accepted offers yet"} tone="brand" />
        </div>
      }

      {}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        {recruiters.length > 0 &&
        <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Recruiter</label>
            <select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500">
              <option value="">All Recruiters</option>
              {recruiters.map((r) =>
            <option key={r.employee_id} value={r.employee_id}>
                  {r.first_name} {r.last_name}
                </option>
            )}
            </select>
          </div>
        }
        <button onClick={applyFilter} disabled={repLoading}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {repLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Apply
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {}
        <SectionCard title="Candidate Pipeline" subtitle="All-time distribution by status">
          {loading ? <LoadingRow /> : pipelineSegments.length === 0 ?
          <p className="py-8 text-center text-sm text-gray-400">No candidates yet</p> :

          <ReportDonutPanel
            title="" showSelect={false}
            segments={pipelineSegments}
            centerLabel="Total"
            centerValue={pipelineSegments.reduce((s, x) => s + x.value, 0).toString()} />

          }
        </SectionCard>

        {}
        <SectionCard title="Pipeline Funnel (Selected Period)" subtitle={`${fromDate} → ${toDate}`}>
          {repLoading ? <LoadingRow /> : funnelSegments.length === 0 ?
          <p className="py-8 text-center text-sm text-gray-400">No data for selected range</p> :

          <ReportDonutPanel
            title="" showSelect={false}
            segments={funnelSegments}
            centerLabel="Total"
            centerValue={funnelSegments.reduce((s, x) => s + x.value, 0).toString()} />

          }
        </SectionCard>

        {}
        <SectionCard title="Offer Status" subtitle="Released vs accepted">
          {loading ? <LoadingRow /> : offerSegments.length === 0 ?
          <p className="py-8 text-center text-sm text-gray-400">No offers yet</p> :

          <ReportDonutPanel
            title="" showSelect={false}
            segments={offerSegments}
            centerLabel="Offers"
            centerValue={offerSegments.reduce((s, x) => s + x.value, 0).toString()} />

          }
        </SectionCard>

        {}
        <SectionCard title="Candidate Source Breakdown" subtitle={`${fromDate} → ${toDate}`}>
          {repLoading ? <LoadingRow /> : !report?.sourceBreakdown?.length ?
          <p className="py-8 text-center text-sm text-gray-400">No source data for selected range</p> :

          <div className="space-y-2.5">
              {report.sourceBreakdown.map((s, i) => {
              const pct = report.sourceBreakdown.reduce((t, x) => t + Number(x.count), 0);
              const bar = pct ? Math.round(Number(s.count) / pct * 100) : 0;
              return (
                <div key={s.source || i}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-gray-700">{s.source || "Unknown"}</span>
                      <span className="text-gray-500">{s.count} candidates · {s.converted} onboarded</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${bar}%`, background: SRC_COLORS[i % SRC_COLORS.length] }} />
                    </div>
                  </div>);

            })}
            </div>
          }
        </SectionCard>

      </div>

      {}
      <SectionCard title="Recruiter Performance" subtitle="Last 30 days">
        {loading ? <LoadingRow /> : !dash?.recruiterPerf?.length ?
        <p className="py-8 text-center text-sm text-gray-400">No recruiters found</p> :

        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pb-3 pr-4">Recruiter</th>
                  <th className="pb-3 pr-4 text-right">Candidates Added</th>
                  <th className="pb-3 pr-4 text-right">Interviews Scheduled</th>
                  <th className="pb-3 text-right">Offers Created</th>
                </tr>
              </thead>
              <tbody>
                {dash.recruiterPerf.map((r, i) =>
              <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-800">{r.recruiter}</td>
                    <td className="py-3 pr-4 text-right text-gray-700">{r.candidates_added}</td>
                    <td className="py-3 pr-4 text-right text-gray-700">{r.interviews_scheduled}</td>
                    <td className="py-3 text-right text-gray-700">{r.offers_created}</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </SectionCard>

    </div>);

}

export default ReportsTab;
