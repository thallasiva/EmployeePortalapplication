import React, { useState, useEffect, useCallback } from "react";
import { Inbox, CheckCircle2, AlertCircle, Clock, Search, Eye, RefreshCw, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { emailLogsApi } from "../../../../../api/settings.api";
import { Toast } from "../components/SharedUI";

const PER = 10;
const STATUS_OPTS = ["All Status","Sent","Failed","Pending","Queued"];
const MODULE_OPTS = ["All Modules","Leave","Attendance","Payroll","Recruitment","Onboarding","System","Performance"];

const StatusBadge = ({ s }) => {
  const cfg = {
    Sent:    { bg:"#dcfce7", text:"#16a34a", icon:<CheckCircle2 size={12} /> },
    Failed:  { bg:"#fee2e2", text:"#dc2626", icon:<AlertCircle size={12} /> },
    Pending: { bg:"#fef9c3", text:"#ca8a04", icon:<Clock size={12} /> },
    Queued:  { bg:"#e0f2fe", text:"#0284c7", icon:<Clock size={12} /> },
  }[s] || { bg:"#f1f5f9", text:"#64748b", icon:null };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.icon}{s}
    </span>
  );
};

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total:0, Sent:0, Failed:0, Pending:0, Queued:0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [module, setModule] = useState("All Modules");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        emailLogsApi.list({ search, status, module, page, limit: PER }),
        emailLogsApi.stats(),
      ]);
      setLogs(logsRes.rows || []);
      setTotal(logsRes.total || 0);
      setStats(statsRes || {});
    } catch { showToast("Failed to load logs", "error"); }
    finally { setLoading(false); }
  }, [search, status, module, page]);

  useEffect(() => { load(); }, [load]);

  /* reset page on filter change */
  useEffect(() => { setPage(1); }, [search, status, module]);

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      await emailLogsApi.retry(id);
      showToast("Email queued for retry");
      load();
    } catch { showToast("Retry failed", "error"); }
    finally { setRetrying(null); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER));

  const STAT_CARDS = [
    { label:"Total Emails",   value:stats.total,   icon:<Inbox size={18} />,       color:"#f18200", bg:"#fff8f0" },
    { label:"Sent",           value:stats.Sent,    icon:<CheckCircle2 size={18} />, color:"#16a34a", bg:"#dcfce7" },
    { label:"Failed",         value:stats.Failed,  icon:<AlertCircle size={18} />,  color:"#dc2626", bg:"#fee2e2" },
    { label:"Pending/Queue",  value:(stats.Pending||0)+(stats.Queued||0), icon:<Clock size={18} />, color:"#ca8a04", bg:"#fef9c3" },
  ];

  return (
    <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Detail Modal */}
      {viewRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <span className="text-[15px] font-bold text-[#1e293b]">Email Log Details</span>
              <button onClick={() => setViewRow(null)} className="text-[#94a3b8] hover:text-[#64748b]">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {[["Recipient",viewRow.recipient],["Subject",viewRow.subject],["Module",viewRow.module],
                ["Status",viewRow.status],["Sent At",viewRow.sent_at],["Retry Count",viewRow.retry_count],
                ["Error",viewRow.error_message||"—"]].map(([l,v]) => (
                <div key={l} className="flex items-start gap-3">
                  <span className="text-[12px] text-[#94a3b8] w-28 shrink-0 pt-0.5">{l}</span>
                  <span className="text-[13px] font-semibold text-[#1e293b] break-all">{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setViewRow(null)}
                className="w-full h-[38px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-[#f1f5f9] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
              {icon}
            </div>
            <div>
              <div className="text-[20px] font-bold text-[#1e293b]">{value ?? 0}</div>
              <div className="text-[11px] text-[#94a3b8]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#f1f5f9] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipient, subject…"
              className="w-full pl-8 pr-3 h-[36px] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
            {STATUS_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={module} onChange={e => setModule(e.target.value)}
            className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
            {MODULE_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
          <button onClick={load} className="h-[36px] px-4 bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-lg text-[13px] font-medium flex items-center gap-2">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#f1f5f9] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-[#f18200]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-[#94a3b8] text-[13px]">No email logs found</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-[#f8fafc] border-b border-[#f1f5f9]">
              <tr>
                {["Recipient","Subject","Module","Status","Sent At","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {logs.map(row => (
                <tr key={row.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3 font-medium text-[#1e293b]">{row.recipient}</td>
                  <td className="px-4 py-3 text-[#475569] max-w-[200px] truncate">{row.subject}</td>
                  <td className="px-4 py-3 text-[#64748b]">{row.module}</td>
                  <td className="px-4 py-3"><StatusBadge s={row.status} /></td>
                  <td className="px-4 py-3 text-[#94a3b8]">{row.sent_at ? new Date(row.sent_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewRow(row)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]"><Eye size={14} /></button>
                      {row.status === "Failed" && (
                        <button onClick={() => handleRetry(row.id)} disabled={retrying === row.id}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold flex items-center gap-1">
                          {retrying === row.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9]">
            <span className="text-[12px] text-[#94a3b8]">
              Showing {Math.min((page-1)*PER+1, total)}–{Math.min(page*PER, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-7 h-7 rounded text-[12px] font-medium ${n===page ? "bg-[#f18200] text-white" : "hover:bg-[#f1f5f9] text-[#64748b]"}`}>{n}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
