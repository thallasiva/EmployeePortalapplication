import React, { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { notificationsApi } from "../../api/settings.api";
import { getStoredUser } from "../../data/auth";

const TYPE_CFG = {
  info:    { icon: <Info size={15} />,          color: "#3b82f6", bg: "#eff6ff" },
  success: { icon: <CheckCircle2 size={15} />,  color: "#16a34a", bg: "#dcfce7" },
  warning: { icon: <AlertTriangle size={15} />, color: "#d97706", bg: "#fef3c7" },
  error:   { icon: <XCircle size={15} />,       color: "#dc2626", bg: "#fee2e2" },
};

const MODULE_TAGS = {
  Leave:"#10b981",Attendance:"#f59e0b",Payroll:"#3b82f6",Recruitment:"#8b5cf6",
  Performance:"#ec4899",Helpdesk:"#14b8a6",System:"#64748b",Onboarding:"#f18200",
};

const FILTER_OPTS = ["All","Unread","Leave","Attendance","Payroll","Recruitment","System"];
const PER = 15;

function timeAgo(dt) {
  if (!dt) return "";
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function NotificationCenter() {
  const user = getStoredUser();
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [unread, setUnread]     = useState(0);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState("All");
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        employee_id: user?.id || undefined,
        page,
        limit: PER,
        unread_only: filter === "Unread" ? true : undefined,
        module: !["All","Unread"].includes(filter) ? filter : undefined,
      };
      const res = await notificationsApi.list(params);
      setRows(res.rows || []);
      setTotal(res.total || 0);
      setUnread(res.unread || 0);
    } catch { }
    finally { setLoading(false); }
  }, [page, filter, user?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleMarkRead = async (id) => {
    await notificationsApi.markRead(id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, is_read: 1 } : r));
    setUnread(u => Math.max(0, u - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead(user?.id);
    setRows(prev => prev.map(r => ({ ...r, is_read: 1 })));
    setUnread(0);
    showToast("All marked as read");
  };

  const handleDelete = async (id) => {
    await notificationsApi.delete(id);
    setRows(prev => prev.filter(r => r.id !== id));
    setTotal(t => t - 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PER));

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-[13px] font-semibold text-white ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fff8f0] flex items-center justify-center">
              <Bell size={18} color="#f18200" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-[#1e293b]">Notification Center</h1>
              <p className="text-[12px] text-[#94a3b8]">
                {unread > 0 ? <span className="text-[#f18200] font-semibold">{unread} unread</span> : "All caught up"} · {total} total
              </p>
            </div>
          </div>
          {unread > 0 && (
            <button onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 h-[36px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-semibold">
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 h-[32px] rounded-full text-[12px] font-semibold transition-colors ${
                filter===f ? "bg-[#f18200] text-white shadow-sm" : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}>
              {f}
              {f === "Unread" && unread > 0 && (
                <span className="ml-1.5 bg-white text-[#f18200] rounded-full px-1.5 py-px text-[10px] font-bold">{unread}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-[#f1f5f9] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-[#f18200]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-full bg-[#fff8f0] flex items-center justify-center">
                <Bell size={24} color="#f18200" />
              </div>
              <p className="text-[14px] font-semibold text-[#1e293b]">No notifications</p>
              <p className="text-[12px] text-[#94a3b8]">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f8fafc]">
              {rows.map(n => {
                const cfg = TYPE_CFG[n.type] || TYPE_CFG.info;
                const unreadDot = !n.is_read;
                return (
                  <div key={n.id}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors ${unreadDot ? "bg-[#fffdf9]" : ""}`}>
                    {/* Type icon */}
                    <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[13px] font-${unreadDot?"bold":"semibold"} text-[#1e293b] truncate`}>{n.title}</span>
                            {unreadDot && <span className="w-2 h-2 rounded-full bg-[#f18200] shrink-0" />}
                            {n.module && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${MODULE_TAGS[n.module]||"#64748b"}18`, color: MODULE_TAGS[n.module]||"#64748b" }}>
                                {n.module}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#64748b] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        <span className="text-[11px] text-[#94a3b8] shrink-0 pt-0.5">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {unreadDot && (
                        <button onClick={() => handleMarkRead(n.id)}
                          className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#f18200]" title="Mark read">
                          <CheckCheck size={13} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#94a3b8] hover:text-red-500" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#f1f5f9]">
              <span className="text-[12px] text-[#94a3b8]">{total} notifications</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronLeft size={14} /></button>
                {Array.from({length:Math.min(5,totalPages)},(_,i)=>i+1).map(n=>(
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
