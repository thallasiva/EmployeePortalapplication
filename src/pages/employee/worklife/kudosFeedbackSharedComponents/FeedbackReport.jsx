import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Award, Check, Download, MessageSquare, Send } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { listDepartments } from "../../../../api/department.api";
import { getKfReport } from "../../../../api/kudosFeedback.api";
import { FEEDBACK_TYPES, TYPE_STYLE, timeAgo, monthLabel, downloadCsv } from "./shared";
import { StatCard } from "./StatCard";
import { EmptyState } from "./EmptyState";
import { Loading } from "./Loading";
import { SecondaryButton } from "./SecondaryButton";
const FeedbackReport = ({
  onGiveKudos
}) => {
  const [months, setMonths] = useState(6);
  const [departmentId, setDepartmentId] = useState("");
  const [type, setType] = useState("");
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => {});
  }, []);
  useEffect(() => {
    setLoading(true);
    getKfReport({
      months,
      department_id: departmentId || undefined,
      type: type || undefined
    }).then(setReport).catch(err => toast.error(getErrorMessage(err, "Could not load report"))).finally(() => setLoading(false));
  }, [months, departmentId, type]);
  const totalByType = useMemo(() => (report?.by_type || []).reduce((s, r) => s + Number(r.total), 0), [report]);
  const maxTrend = useMemo(() => Math.max(1, ...(report?.trend || []).flatMap(t => [t.kudos, t.feedback])), [report]);
  const exportCsv = () => {
    if (!report) return;
    downloadCsv(`feedback-report-${months}m.csv`, [["Employee", "Code", "Department", "Positive", "Constructive", "Developmental", "Total", "Last feedback"], ...report.by_employee.map(r => [r.name, r.emp_code, r.department_name, r.positive, r.constructive, r.developmental, r.total, r.last_feedback_at])]);
  };
  const t = report?.totals || {};
  const participation = t.employees ? Math.round(Number(t.active_people) / Number(t.employees) * 100) : 0;
  const responseRate = Number(t.requests_total) ? Math.round(Number(t.requests_completed) / Number(t.requests_total) * 100) : null;
  // conic-gradient donut for the feedback mix
  let acc = 0;
  const donut = (report?.by_type || []).map(r => {
    const start = acc;
    acc += totalByType ? Number(r.total) / totalByType * 100 : 0;
    return `${TYPE_STYLE[r.feedback_type].bar} ${start}% ${acc}%`;
  }).join(", ");
  return <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">Period
          <select value={months} onChange={e => setMonths(Number(e.target.value))} className="h-10 min-w-[150px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">Department
          <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="h-10 min-w-[170px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white">
            <option value="">All departments</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">Feedback type
          <select value={type} onChange={e => setType(e.target.value)} className="h-10 min-w-[150px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white">
            <option value="">All types</option>
            {FEEDBACK_TYPES.map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
        <SecondaryButton onClick={exportCsv} disabled={!report?.by_employee?.length} className="ml-auto">
          <Download size={15} /> Export CSV
        </SecondaryButton>
      </div>
      {loading && !report ? <Loading /> : <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Award size={22} className="text-amber-500" />} label="Kudos" value={t.kudos} hint={`Last ${months} months`} accent="bg-amber-50" />
            <StatCard icon={<MessageSquare size={22} className="text-[#e87500]" />} label="Feedback" value={t.feedback} hint={`Last ${months} months`} />
            <StatCard icon={<Check size={22} className="text-emerald-600" />} label="Participation" value={`${participation}%`} hint={`${t.active_people || 0} of ${t.employees || 0} people`} accent="bg-emerald-50" />
            <StatCard icon={<Send size={22} className="text-blue-600" />} label="Request response" value={responseRate == null ? "–" : `${responseRate}%`} hint={`${t.pending_requests || 0} pending`} accent="bg-blue-50" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-bold  text-[#e87500]">Monthly trend</h2>
                <div className="flex gap-4 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#e87500]" />Kudos</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#cf6900]" />Feedback</span>
                </div>
              </div>
              <div className="h-48 flex items-end gap-3 border-b border-slate-100 px-1" role="img" aria-label="Kudos and feedback per month">
                {report.trend.map(m => <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-40">
                      <div title={`${m.kudos} kudos`} className="w-3 sm:w-4 rounded-t bg-[#e87500]" style={{
                  height: `${m.kudos / maxTrend * 100}%`,
                  minHeight: m.kudos ? 4 : 0
                }} />
                      <div title={`${m.feedback} feedback`} className="w-3 sm:w-4 rounded-t bg-[#cf6900]" style={{
                  height: `${m.feedback / maxTrend * 100}%`,
                  minHeight: m.feedback ? 4 : 0
                }} />
                    </div>
                  </div>)}
              </div>
              <div className="flex gap-3 px-1 mt-2">
                {report.trend.map(m => <span key={m.month} className="flex-1 text-center text-xs font-semibold text-slate-500">{monthLabel(m.month)}</span>)}
              </div>
            </section>
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-base font-bold  text-[#e87500] mb-4">Feedback by type</h2>
              <div className="flex items-center gap-5 flex-wrap">
                <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{
              background: totalByType ? `conic-gradient(${donut})` : "#eef0f5"
            }} role="img" aria-label={report.by_type.map(r => `${r.feedback_type} ${r.total}`).join(", ")}>
                  <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
                    <span className="text-xl font-black  text-[#e87500]">{totalByType}</span>
                    <span className="text-[11px] text-slate-500">total</span>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {report.by_type.map(r => <li key={r.feedback_type} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{
                  background: TYPE_STYLE[r.feedback_type].bar
                }} />
                      {r.feedback_type}
                      <strong>{totalByType ? Math.round(r.total / totalByType * 100) : 0}%</strong>
                    </li>)}
                </ul>
              </div>
            </section>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <h2 className="text-base font-bold  text-[#e87500] px-5 pt-5 pb-3">Feedback received per employee</h2>
              {report.by_employee.length === 0 ? <EmptyState icon={<MessageSquare className="text-[#e87500]" />} title="No feedback in this period" /> : <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 text-left">
                      <th scope="col" className="px-5 py-3 font-semibold">Employee</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Department</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Received</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Mix</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Last feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_employee.map(r => <tr key={r.employee_id} className="border-t border-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{r.name}</td>
                        <td className="px-3 py-3 text-slate-500">{r.department_name || "–"}</td>
                        <td className="px-3 py-3 font-bold">{r.total}</td>
                        <td className="px-3 py-3">
                          <div className="flex w-36 h-2.5 rounded-full overflow-hidden bg-slate-100" title={`${r.positive} positive, ${r.constructive} constructive, ${r.developmental} developmental`}>
                            <span style={{
                      width: `${r.positive / r.total * 100}%`,
                      background: TYPE_STYLE.Positive.bar
                    }} />
                            <span style={{
                      width: `${r.constructive / r.total * 100}%`,
                      background: TYPE_STYLE.Constructive.bar
                    }} />
                            <span style={{
                      width: `${r.developmental / r.total * 100}%`,
                      background: TYPE_STYLE.Developmental.bar
                    }} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{timeAgo(r.last_feedback_at)}</td>
                      </tr>)}
                  </tbody>
                </table>}
            </section>
            <div className="space-y-4">
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-base font-bold  text-[#e87500] mb-3">Kudos by department</h2>
                {report.by_department.filter(d => Number(d.kudos) > 0).length === 0 ? <p className="text-sm text-slate-500">No kudos in this period.</p> : <ul className="space-y-3">
                    {report.by_department.filter(d => Number(d.kudos) > 0).slice(0, 6).map(d => <li key={d.department_id}>
                        <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{d.department_name}</span><strong>{d.kudos}</strong></div>
                        <div className="h-2 rounded-full bg-slate-100 mt-1">
                          <div className="h-2 rounded-full bg-[#e87500]" style={{
                    width: `${d.kudos / Math.max(...report.by_department.map(x => Number(x.kudos)), 1) * 100}%`
                  }} />
                        </div>
                      </li>)}
                  </ul>}
              </section>
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-base font-bold  text-[#e87500]">Low recognition</h2>
                <p className="text-xs text-slate-500 mb-3">No kudos in the last 60 days</p>
                {report.low_recognition.length === 0 ? <p className="text-sm text-slate-500">Everyone has been recognised recently.</p> : <ul className="space-y-2">
                    {report.low_recognition.slice(0, 6).map(p => <li key={p.employee_id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-800 truncate">{p.name}</span>
                          <span className="block text-xs text-slate-500">{p.last_kudos_at ? `Last ${timeAgo(p.last_kudos_at)}` : "Never recognised"}</span>
                        </span>
                        {onGiveKudos && <button onClick={() => onGiveKudos({
                  employee_id: p.employee_id,
                  name: p.name
                })} className="text-xs font-bold text-[#b45309] hover:underline shrink-0">
                            Recognise
                          </button>}
                      </li>)}
                  </ul>}
              </section>
            </div>
          </div>
        </>}
    </div>;
};
export { FeedbackReport };
