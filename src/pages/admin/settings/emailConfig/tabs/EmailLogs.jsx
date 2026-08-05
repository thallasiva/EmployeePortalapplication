import React, { useState } from "react";
import { Search, Download, Eye, RefreshCw, X, Calendar, ChevronDown, Mail, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react";
import { Badge, Dot, Btn, Toast, Pagination, ConfirmDialog } from "../components/SharedUI";
import { SEED_LOGS, CAT_COLOR } from "../constants";

const PER = 8;
const STATUSES = ["All Status","Sent","Failed","Pending","Queued"];
const MODULES_F = ["All Modules","General","Recruitment","Leave","Attendance","Payroll","Expenses","Security","Notifications"];

const STATUS_COLOR = { Sent:"green", Failed:"red", Pending:"amber", Queued:"blue" };
const STATUS_ICON  = {
  Sent:    <CheckCircle2 size={11} className="text-emerald-500"/>,
  Failed:  <AlertCircle  size={11} className="text-red-500"/>,
  Pending: <Clock        size={11} className="text-amber-500"/>,
  Queued:  <Clock        size={11} className="text-blue-500"/>,
};

/* ── Detail modal ── */
function LogDetailModal({ log, onClose, onRetry }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[480px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#1e293b]">Email Log Details</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            ["Date & Time", log.dt],
            ["Recipient",   log.to],
            ["Subject",     log.subject],
            ["Module",      log.module],
            ["Status",      log.status],
            ["Retry Count", String(log.retry)],
            ...(log.error ? [["Error", log.error]] : []),
          ].map(([label, val]) => (
            <div key={label} className="flex items-start gap-4">
              <span className="text-[12px] text-[#94a3b8] w-28 shrink-0 pt-0.5">{label}</span>
              <span className={`text-[13px] font-semibold ${label==="Error"?"text-red-600":"text-[#1e293b]"}`}>{val}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          {log.status==="Failed" && (
            <Btn variant="primary" size="sm" icon={<RefreshCw size={12}/>} onClick={()=>onRetry(log.id)}>
              Retry Now
            </Btn>
          )}
          <Btn variant="outline" size="sm" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

export default function EmailLogs() {
  const [logs, setLogs]       = useState(SEED_LOGS);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("All Status");
  const [module, setModule]   = useState("All Modules");
  const [page, setPage]       = useState(1);
  const [viewLog, setViewLog] = useState(null);
  const [toast, setToast]     = useState(null);

  const filtered = logs.filter(l=>
    (status==="All Status"||l.status===status)&&
    (module==="All Modules"||l.module===module)&&
    (l.to.toLowerCase().includes(search.toLowerCase())||
     l.subject.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1,Math.ceil(filtered.length/PER));
  const paged = filtered.slice((page-1)*PER,page*PER);

  const handleRetry = (id) => {
    setLogs(p=>p.map(l=>l.id===id?{...l,status:"Sent",error:"",retry:l.retry+1}:l));
    setViewLog(null);
    setToast({message:"Email queued for retry.",type:"success"});
  };

  const handleExport = (fmt) => {
    setToast({message:`Exported ${filtered.length} logs as ${fmt}`,type:"info"});
  };

  // Summary counts
  const counts = { sent:logs.filter(l=>l.status==="Sent").length, failed:logs.filter(l=>l.status==="Failed").length, pending:logs.filter(l=>l.status==="Pending"||l.status==="Queued").length };

  return (
    <>
      {viewLog && <LogDetailModal log={viewLog} onClose={()=>setViewLog(null)} onRetry={handleRetry}/>}
      <Toast message={toast?.message} type={toast?.type} onClose={()=>setToast(null)}/>

      {/* Summary stat row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label:"Total Emails",  value:logs.length,    color:"#f18200", bg:"#fff8f0" },
          { label:"Sent",          value:counts.sent,    color:"#10b981", bg:"#ecfdf5" },
          { label:"Failed",        value:counts.failed,  color:"#ef4444", bg:"#fef2f2" },
          { label:"Pending/Queue", value:counts.pending, color:"#f59e0b", bg:"#fffbeb" },
        ].map(c=>(
          <div key={c.label} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:c.bg}}>
              <Mail size={18} style={{color:c.color}}/>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{c.label}</p>
              <p className="text-[20px] font-bold" style={{color:c.color}}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-[#e8eef5] flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"/>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Search recipient or subject…"
                className="h-[36px] pl-9 pr-4 border border-[#e2e8f0] rounded-lg text-[13px] outline-none focus:border-[#f18200] w-52 bg-white"/>
            </div>
            {[{val:status,set:setStatus,opts:STATUSES},{val:module,set:setModule,opts:MODULES_F}].map((f,i)=>(
              <div key={i} className="relative">
                <select value={f.val} onChange={e=>{f.set(e.target.value);setPage(1);}}
                  className="h-[36px] pl-3 pr-8 border border-[#e2e8f0] rounded-lg text-[13px] outline-none focus:border-[#f18200] appearance-none bg-white text-[#374151]">
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"/>
              </div>
            ))}
            <div className="flex items-center gap-2 h-[36px] px-3 border border-[#e2e8f0] rounded-lg bg-white cursor-pointer hover:bg-[#f8fafc]">
              <Calendar size={13} color="#94a3b8"/>
              <span className="text-[12px] text-[#64748b]">01 Aug – 05 Aug 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["CSV","Excel","PDF"].map(fmt=>(
              <Btn key={fmt} variant="outline" size="sm" icon={<Download size={12}/>} onClick={()=>handleExport(fmt)}>
                {fmt}
              </Btn>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="grid grid-cols-12 px-5 py-3 bg-[#f8fafc] border-b border-[#e8eef5] text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
          <span className="col-span-2">Date &amp; Time</span>
          <span className="col-span-2">Recipient</span>
          <span className="col-span-3">Subject</span>
          <span className="col-span-2">Module</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1 text-center">Retries</span>
          <span className="col-span-1 text-right">Action</span>
        </div>

        {paged.length===0 ? (
          <div className="p-16 text-center">
            <Mail size={40} className="text-[#e2e8f0] mx-auto mb-3"/>
            <p className="text-[#94a3b8] text-[14px]">No logs match your filters.</p>
          </div>
        ) : paged.map(l=>(
          <div key={l.id} className="grid grid-cols-12 px-5 py-3.5 border-b border-[#f8fafc] items-center hover:bg-[#fafbff] transition-colors">
            <div className="col-span-2 text-[11px] text-[#64748b]">{l.dt}</div>
            <div className="col-span-2 text-[12px] font-medium text-[#1e293b] truncate pr-2">{l.to}</div>
            <div className="col-span-3 text-[12px] text-[#64748b] truncate pr-2">{l.subject}</div>
            <div className="col-span-2">
              <Badge color={CAT_COLOR[l.module]||"gray"}>{l.module}</Badge>
            </div>
            <div className="col-span-1 flex justify-center">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                l.status==="Sent"?"bg-emerald-50 text-emerald-700 border-emerald-200":
                l.status==="Failed"?"bg-red-50 text-red-600 border-red-200":
                l.status==="Pending"?"bg-amber-50 text-amber-700 border-amber-200":
                "bg-blue-50 text-blue-700 border-blue-200"}`}>
                {STATUS_ICON[l.status]}{l.status}
              </span>
            </div>
            <div className="col-span-1 text-center text-[12px] text-[#64748b]">{l.retry}</div>
            <div className="col-span-1 flex items-center justify-end gap-1">
              <button title="View Details" onClick={()=>setViewLog(l)}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#f18200] transition-colors">
                <Eye size={12}/>
              </button>
              {l.status==="Failed" && (
                <button title="Retry" onClick={()=>handleRetry(l.id)}
                  className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500 transition-colors">
                  <RefreshCw size={12}/>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-[#f8fafc]">
          <p className="text-[12px] text-[#94a3b8]">
            Showing {Math.min((page-1)*PER+1,filtered.length)}–{Math.min(page*PER,filtered.length)} of {filtered.length} logs
          </p>
          <Pagination page={page} totalPages={totalPages} onPage={setPage}/>
        </div>
      </div>
    </>
  );
}
