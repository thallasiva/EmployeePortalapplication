import React, { useState } from "react";
import { Shield, Search, Download, Eye, ChevronLeft, ChevronRight, ChevronDown, Filter } from "lucide-react";

const AUDIT_DATA = [
  { id:1,  dt:"05 Aug 2026, 10:32 AM", user:"Super Admin",        email:"admin@natit.com",    action:"Updated SMTP Settings",              module:"Email Config",    ip:"192.168.1.10", result:"Success" },
  { id:2,  dt:"05 Aug 2026, 10:15 AM", user:"HR Manager",         email:"hr@natit.com",        action:"Created Email Template: Offer Letter",module:"Email Templates", ip:"192.168.1.22", result:"Success" },
  { id:3,  dt:"05 Aug 2026, 09:50 AM", user:"Super Admin",        email:"admin@natit.com",     action:"Modified Email Permissions",          module:"Email Permissions",ip:"192.168.1.10", result:"Success" },
  { id:4,  dt:"05 Aug 2026, 09:30 AM", user:"HR Manager",         email:"hr@natit.com",        action:"Retried Failed Email: Meera Shah",    module:"Email Logs",      ip:"192.168.1.22", result:"Success" },
  { id:5,  dt:"05 Aug 2026, 09:00 AM", user:"Super Admin",        email:"admin@natit.com",     action:"Deleted Template: Old Announcement",  module:"Email Templates", ip:"192.168.1.10", result:"Success" },
  { id:6,  dt:"04 Aug 2026, 06:20 PM", user:"Finance",            email:"finance@natit.com",   action:"Exported Email Logs (CSV)",           module:"Email Logs",      ip:"10.0.0.5",     result:"Success" },
  { id:7,  dt:"04 Aug 2026, 05:45 PM", user:"Super Admin",        email:"admin@natit.com",     action:"Disabled Schedule: Weekly Newsletter",module:"Scheduled Emails",ip:"192.168.1.10", result:"Success" },
  { id:8,  dt:"04 Aug 2026, 04:00 PM", user:"HR Manager",         email:"hr@natit.com",        action:"Cloned Template: Leave Approved",     module:"Email Templates", ip:"192.168.1.22", result:"Success" },
  { id:9,  dt:"04 Aug 2026, 03:30 PM", user:"Super Admin",        email:"admin@natit.com",     action:"Tested SMTP Connection",             module:"Email Config",    ip:"192.168.1.10", result:"Success" },
  { id:10, dt:"04 Aug 2026, 02:00 PM", user:"Recruiter",          email:"recruit@natit.com",   action:"Sent Test Email for Interview Invite",module:"Email Templates", ip:"10.0.0.8",     result:"Failed"  },
  { id:11, dt:"04 Aug 2026, 01:00 PM", user:"Super Admin",        email:"admin@natit.com",     action:"Created Schedule: Contract Expiry",   module:"Scheduled Emails",ip:"192.168.1.10", result:"Success" },
  { id:12, dt:"03 Aug 2026, 11:00 AM", user:"HR Manager",         email:"hr@natit.com",        action:"Reset Notification Settings",         module:"Notification Settings",ip:"192.168.1.22",result:"Success"},
];

const MODULES_F = ["All Modules","Email Config","Email Templates","Email Permissions","Email Logs","Scheduled Emails","Notification Settings"];
const RESULTS_F = ["All Results","Success","Failed"];
const PER_PAGE = 8;

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("All Modules");
  const [result, setResult] = useState("All Results");
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState(null);

  const filtered = AUDIT_DATA.filter(r =>
    (module === "All Modules" || r.module === module) &&
    (result === "All Results" || r.result === result) &&
    (r.user.toLowerCase().includes(search.toLowerCase()) ||
     r.action.toLowerCase().includes(search.toLowerCase()) ||
     r.module.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* View Details Modal */}
      {viewRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[480px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <span className="text-[16px] font-bold text-[#1e293b]">Audit Log Details</span>
              <button onClick={() => setViewRow(null)} className="text-[#94a3b8] hover:text-[#64748b] text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ["Date & Time", viewRow.dt],
                ["User", viewRow.user],
                ["Email", viewRow.email],
                ["Action", viewRow.action],
                ["Module", viewRow.module],
                ["IP Address", viewRow.ip],
                ["Result", viewRow.result],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-[12px] text-[#94a3b8] w-28 shrink-0 pt-0.5">{label}</span>
                  <span className="text-[13px] font-semibold text-[#1e293b]">{val}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setViewRow(null)}
                className="w-full h-[38px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fff8f0] flex items-center justify-center">
              <Shield size={18} color="#f18200" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[#1e293b]">Audit Logs</h1>
              <p className="text-[12px] text-[#94a3b8]">Track all admin actions and system changes</p>
            </div>
          </div>
          <button className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label:"Total Actions", value: AUDIT_DATA.length, color:"#f18200", bg:"#fff8f0" },
            { label:"Successful",    value: AUDIT_DATA.filter(r=>r.result==="Success").length, color:"#10b981", bg:"#ecfdf5" },
            { label:"Failed",        value: AUDIT_DATA.filter(r=>r.result==="Failed").length,  color:"#ef4444", bg:"#fef2f2" },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
                <Shield size={20} style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{card.label}</p>
                <p className="text-[22px] font-bold mt-0.5" style={{ color: card.color }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-[#e8eef5] flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Search by user or action…"
                className="w-full h-[36px] pl-9 pr-4 border border-[#e2e8f0] rounded-lg text-[13px] outline-none focus:border-[#f18200] bg-white" />
            </div>
            {[{ val:module, set:setModule, opts:MODULES_F },{ val:result, set:setResult, opts:RESULTS_F }].map((f,i) => (
              <div key={i} className="relative">
                <select value={f.val} onChange={e=>{f.set(e.target.value);setPage(1);}}
                  className="h-[36px] pl-3 pr-8 border border-[#e2e8f0] rounded-lg text-[13px] outline-none focus:border-[#f18200] appearance-none bg-white text-[#374151]">
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Table head */}
          <div className="grid grid-cols-12 px-5 py-3 bg-[#f8fafc] border-b border-[#e8eef5] text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
            <span className="col-span-2">Date &amp; Time</span>
            <span className="col-span-2">User</span>
            <span className="col-span-4">Action</span>
            <span className="col-span-2">Module</span>
            <span className="col-span-1 text-center">Result</span>
            <span className="col-span-1 text-right">Details</span>
          </div>

          {paged.length === 0 ? (
            <div className="p-16 text-center">
              <Shield size={40} className="text-[#e2e8f0] mx-auto mb-3" />
              <p className="text-[#94a3b8] text-[14px]">No audit logs match your filters.</p>
            </div>
          ) : paged.map(row => (
            <div key={row.id} className="grid grid-cols-12 px-5 py-3.5 border-b border-[#f8fafc] items-center hover:bg-[#fafbff] transition-colors">
              <div className="col-span-2 text-[11px] text-[#64748b]">{row.dt}</div>
              <div className="col-span-2">
                <p className="text-[12px] font-semibold text-[#1e293b]">{row.user}</p>
                <p className="text-[10px] text-[#94a3b8]">{row.email}</p>
              </div>
              <div className="col-span-4 text-[12px] text-[#64748b] pr-3">{row.action}</div>
              <div className="col-span-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fff8f0] text-[#f18200] font-semibold border border-[#fed7aa]">{row.module}</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${row.result==="Success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                  {row.result}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => setViewRow(row)}
                  className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#f18200] transition-colors">
                  <Eye size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="px-5 py-3 flex items-center justify-between border-t border-[#f8fafc]">
            <p className="text-[12px] text-[#94a3b8]">Showing {Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} logs</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1,page-1))} disabled={page===1}
                className="w-7 h-7 rounded flex items-center justify-center border border-[#e2e8f0] text-[#94a3b8] hover:bg-[#f8fafc] disabled:opacity-40">
                <ChevronLeft size={12} />
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)}
                  className={`w-7 h-7 rounded text-[12px] font-medium border transition-all ${p===page ? "bg-[#f18200] text-white border-[#f18200]" : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
                className="w-7 h-7 rounded flex items-center justify-center border border-[#e2e8f0] text-[#94a3b8] hover:bg-[#f8fafc] disabled:opacity-40">
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
