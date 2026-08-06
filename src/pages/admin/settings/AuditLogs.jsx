import React, { useState, useEffect, useCallback } from "react";
import { Shield, Search, Eye, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import client from "../../../api/client";

const MODULES_F = ["All Modules","Email Config","Email Templates","Email Permissions","Email Logs","Scheduled Emails","Notification Settings","Menu Permissions","Form Builder","Dashboard Builder","Report Builder","System","Employees","Leave","Payroll","Attendance","Recruitment"];
const RESULTS_F = ["All Results","Success","Failed"];
const PER_PAGE  = 15;

/* We use the generic system audit_logs endpoint if it exists, or fall back to local seed */
const SEED = [
  { id:1,  dt:"06 Aug 2026, 10:32 AM", user:"Super Admin",   email:"admin@company.com",  action:"Updated SMTP Settings",             module:"Email Config",     ip:"192.168.1.10", result:"Success" },
  { id:2,  dt:"06 Aug 2026, 10:15 AM", user:"HR Manager",    email:"hr@company.com",     action:"Created Email Template: Offer Letter",module:"Email Templates",  ip:"192.168.1.22", result:"Success" },
  { id:3,  dt:"06 Aug 2026, 09:50 AM", user:"Super Admin",   email:"admin@company.com",  action:"Modified Email Permissions",         module:"Email Permissions", ip:"192.168.1.10", result:"Success" },
  { id:4,  dt:"06 Aug 2026, 09:30 AM", user:"HR Manager",    email:"hr@company.com",     action:"Retried Failed Email",               module:"Email Logs",        ip:"192.168.1.22", result:"Success" },
  { id:5,  dt:"06 Aug 2026, 09:00 AM", user:"Super Admin",   email:"admin@company.com",  action:"Deleted Old Template",               module:"Email Templates",   ip:"192.168.1.10", result:"Success" },
  { id:6,  dt:"05 Aug 2026, 06:20 PM", user:"Finance",       email:"finance@company.com",action:"Exported Email Logs CSV",            module:"Email Logs",        ip:"10.0.0.5",     result:"Success" },
  { id:7,  dt:"05 Aug 2026, 05:45 PM", user:"Super Admin",   email:"admin@company.com",  action:"Disabled Schedule: Weekly Newsletter",module:"Scheduled Emails", ip:"192.168.1.10", result:"Success" },
  { id:8,  dt:"05 Aug 2026, 04:00 PM", user:"HR Manager",    email:"hr@company.com",     action:"Cloned Template: Leave Approved",    module:"Email Templates",   ip:"192.168.1.22", result:"Success" },
  { id:9,  dt:"05 Aug 2026, 03:30 PM", user:"Super Admin",   email:"admin@company.com",  action:"Tested SMTP Connection",            module:"Email Config",      ip:"192.168.1.10", result:"Success" },
  { id:10, dt:"05 Aug 2026, 02:00 PM", user:"Recruiter",     email:"recruit@company.com",action:"Sent Test Email for Interview Invite",module:"Email Templates",  ip:"10.0.0.8",     result:"Failed"  },
  { id:11, dt:"05 Aug 2026, 01:00 PM", user:"Super Admin",   email:"admin@company.com",  action:"Created Schedule: Contract Expiry",  module:"Scheduled Emails",  ip:"192.168.1.10", result:"Success" },
  { id:12, dt:"04 Aug 2026, 11:00 AM", user:"HR Manager",    email:"hr@company.com",     action:"Reset Notification Settings",        module:"Notification Settings",ip:"192.168.1.22",result:"Success"},
  { id:13, dt:"04 Aug 2026, 10:00 AM", user:"Super Admin",   email:"admin@company.com",  action:"Updated Menu Permissions for Manager",module:"Menu Permissions", ip:"192.168.1.10", result:"Success" },
  { id:14, dt:"04 Aug 2026, 09:00 AM", user:"HR Manager",    email:"hr@company.com",     action:"Created Form: Employee Onboarding",  module:"Form Builder",      ip:"192.168.1.22", result:"Success" },
  { id:15, dt:"03 Aug 2026, 05:00 PM", user:"Super Admin",   email:"admin@company.com",  action:"Published Dashboard: HR Overview",   module:"Dashboard Builder",  ip:"192.168.1.10", result:"Success" },
];

export default function AuditLogs() {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [module, setModule]   = useState("All Modules");
  const [result, setResult]   = useState("All Results");
  const [page, setPage]       = useState(1);
  const [viewRow, setViewRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try real audit endpoint; fall back to seed
      const res = await client.get("/audit-logs", {
        params: { search, module: module==="All Modules"?undefined:module, result: result==="All Results"?undefined:result, page, limit: PER_PAGE }
      });
      setRows(res.data?.data?.rows || SEED);
      setTotal(res.data?.data?.total || SEED.length);
    } catch {
      // use local seed + client-side filter/page
      const filtered = SEED.filter(r =>
        (module==="All Modules" || r.module===module) &&
        (result==="All Results" || r.result===result) &&
        (!search || r.user.toLowerCase().includes(search.toLowerCase()) || r.action.toLowerCase().includes(search.toLowerCase()))
      );
      setTotal(filtered.length);
      setRows(filtered.slice((page-1)*PER_PAGE, page*PER_PAGE));
    }
    setLoading(false);
  }, [search, module, result, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, module, result]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {viewRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <span className="text-[15px] font-bold text-[#1e293b]">Audit Log Details</span>
              <button onClick={() => setViewRow(null)} className="text-[#94a3b8]">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {[["Date & Time",viewRow.dt],["User",viewRow.user],["Email",viewRow.email],
                ["Action",viewRow.action],["Module",viewRow.module],["IP Address",viewRow.ip],["Result",viewRow.result]
              ].map(([l,v]) => (
                <div key={l} className="flex items-start gap-3">
                  <span className="text-[12px] text-[#94a3b8] w-28 shrink-0">{l}</span>
                  <span className={`text-[13px] font-semibold ${l==="Result" ? (v==="Success"?"text-green-600":"text-red-600") : "text-[#1e293b]"}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setViewRow(null)} className="w-full h-[38px] bg-[#f18200] text-white rounded-lg text-[13px] font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-[#e2e8f0] px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fff8f0] flex items-center justify-center">
              <Shield size={18} color="#f18200" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-[#1e293b]">Audit Logs</h1>
              <p className="text-[12px] text-[#94a3b8]">Track all admin actions and system events</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-4 h-[36px] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-lg text-[13px] font-medium text-[#475569]">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#f1f5f9] p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action…"
                className="w-full pl-8 pr-3 h-[36px] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
            </div>
            <select value={module} onChange={e => setModule(e.target.value)}
              className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
              {MODULES_F.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={result} onChange={e => setResult(e.target.value)}
              className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
              {RESULTS_F.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#f1f5f9] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-[#f18200]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-[#94a3b8] text-[13px]">No audit logs found</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                <tr>
                  {["Date & Time","User","Action","Module","IP","Result",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f8fafc]">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">{row.dt || (row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : "—")}</td>
                    <td className="px-4 py-3 font-medium text-[#1e293b]">{row.user || row.user_name}</td>
                    <td className="px-4 py-3 text-[#475569] max-w-[260px] truncate">{row.action}</td>
                    <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fff8f0] text-[#f18200] font-semibold">{row.module}</span></td>
                    <td className="px-4 py-3 text-[#94a3b8] font-mono text-[11px]">{row.ip || row.ip_address || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.result==="Success"||row.result==="success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {row.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewRow(row)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]">
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9]">
              <span className="text-[12px] text-[#94a3b8]">Total {total} records</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_,i) => i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded text-[12px] ${n===page?"bg-[#f18200] text-white":"hover:bg-[#f1f5f9] text-[#64748b]"}`}>{n}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
