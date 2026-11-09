import React, { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { listPendingApprovals } from "../../api/workforce.api";
import { getErrorMessage } from "../../api/client";

const TYPE_STYLE = {
  Leave: "bg-sky-50 text-sky-700",
  Attendance: "bg-violet-50 text-violet-700",
  Resignation: "bg-rose-50 text-rose-700",
  Timesheet: "bg-amber-50 text-amber-700",
  Appraisal: "bg-emerald-50 text-emerald-700",
};
export default function ApprovalsInbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    listPendingApprovals()
      .then((rows) => setItems(rows || []))
      .catch((cause) => setError(getErrorMessage(cause, "Unable to load pending approvals.")))
      .finally(() => setLoading(false));
  }, []);
  const counts = items.reduce((all, item) => ({ ...all, [item.type]: (all[item.type] || 0) + 1 }), {});
  return (
    <main className="space-y-6 p-5 md:p-8">
      <header><p className="text-sm font-semibold text-amber-700">EMPLOYEE SERVICES</p><h1 className="mt-1 text-2xl font-bold  text-[#f18200]">Approvals</h1><p className="mt-1 text-sm text-slate-500">A single view of requests awaiting your review. Use each module to approve or reject with its existing workflow.</p></header>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {["Leave", "Attendance", "Resignation", "Timesheet", "Appraisal"].map((type) => <article key={type} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{type}</p><p className="mt-1 text-2xl font-bold  text-[#f18200]">{counts[type] || 0}</p></article>)}
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5"><ClipboardList size={19} className="text-amber-600" /><div><h2 className="font-semibold text-slate-800">Pending requests</h2><p className="mt-1 text-sm text-slate-500">{items.length} requests require attention</p></div></div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading approvals…</p> : !items.length ? <div className="p-10 text-center"><CheckCircle2 size={30} className="mx-auto text-emerald-500" /><p className="mt-3 font-medium text-slate-700">You’re all caught up</p><p className="mt-1 text-sm text-slate-500">No pending approvals are assigned to your view.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Request</th><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Details</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Review</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={`${item.module}-${item.request_id}`}>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLE[item.type] || "bg-slate-100 text-slate-700"}`}>{item.type}</span><div className="mt-1 text-xs text-slate-500">#{item.request_id}</div></td>
              <td className="px-5 py-4 font-medium text-slate-800">{item.employee_name}<div className="text-xs text-slate-500">{item.emp_code}</div></td>
              <td className="px-5 py-4 text-slate-600">{item.title || "Request"}</td>
              <td className="px-5 py-4 text-slate-500">{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "—"}</td>
              <td className="px-5 py-4"><Link to={item.review_path} className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800">Open module <ArrowUpRight size={14} /></Link></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
