import React, { useState } from "react";
import {
  Calendar, Clock, Home, Shield, FileText,
  CheckCircle2, XCircle, AlertCircle, Plus, ChevronRight, Filter
} from "lucide-react";

// ── Static sample data ────────────────────────────────────────────────────────
const REQUESTS = [
  { id: 1,  type: "leave",          icon: Calendar, label: "Leave Request",          title: "Casual Leave",                  date: "2026-07-28", status: "Approved",  detail: "1 day · Jul 28" },
  { id: 2,  type: "regularization", icon: Clock,    label: "Attendance Regularization", title: "Regularization – Jul 25",    date: "2026-07-25", status: "Pending",   detail: "Worked 4h 20m" },
  { id: 3,  type: "wfh",            icon: Home,     label: "Work From Home",          title: "WFH Request",                  date: "2026-07-22", status: "Approved",  detail: "Full day" },
  { id: 4,  type: "permission",     icon: Shield,   label: "Permission",              title: "Early exit – doctor visit",    date: "2026-07-18", status: "Rejected",  detail: "2h early exit" },
  { id: 5,  type: "leave",          icon: Calendar, label: "Leave Request",           title: "Sick Leave",                   date: "2026-07-10", status: "Approved",  detail: "1 day · Jul 10" },
  { id: 6,  type: "regularization", icon: Clock,    label: "Attendance Regularization", title: "Regularization – Jul 08",    date: "2026-07-08", status: "Approved",  detail: "Worked 5h 10m" },
  { id: 7,  type: "wfh",            icon: Home,     label: "Work From Home",          title: "WFH Request",                  date: "2026-07-05", status: "Pending",   detail: "Half day – PM" },
  { id: 8,  type: "other",          icon: FileText, label: "Other Request",           title: "Letter of Employment",         date: "2026-06-30", status: "Approved",  detail: "Requested document" },
];

const TABS = [
  { key: "all",            label: "All",              count: REQUESTS.length },
  { key: "leave",          label: "Leave",            count: REQUESTS.filter(r => r.type === "leave").length },
  { key: "regularization", label: "Regularization",   count: REQUESTS.filter(r => r.type === "regularization").length },
  { key: "wfh",            label: "Work From Home",   count: REQUESTS.filter(r => r.type === "wfh").length },
  { key: "permission",     label: "Permission",       count: REQUESTS.filter(r => r.type === "permission").length },
  { key: "other",          label: "Other",            count: REQUESTS.filter(r => r.type === "other").length },
];

const STATUS_CONFIG = {
  Approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Pending:  { icon: AlertCircle,  color: "text-amber-500",   bg: "bg-amber-50 text-amber-700 border-amber-200" },
  Rejected: { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50 text-red-700 border-red-200" },
};

const TYPE_COLORS = {
  leave:          "bg-blue-50 text-blue-600",
  regularization: "bg-orange-50 text-[#f18200]",
  wfh:            "bg-purple-50 text-purple-600",
  permission:     "bg-teal-50 text-teal-600",
  other:          "bg-slate-50 text-slate-600",
};

const SUMMARY_STATS = [
  { label: "Total Requests", value: REQUESTS.length,                                     color: "text-slate-900", bg: "bg-white" },
  { label: "Approved",       value: REQUESTS.filter(r => r.status === "Approved").length, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Pending",        value: REQUESTS.filter(r => r.status === "Pending").length,  color: "text-amber-600",  bg: "bg-amber-50" },
  { label: "Rejected",       value: REQUESTS.filter(r => r.status === "Rejected").length, color: "text-red-500",    bg: "bg-red-50" },
];

function NewRequestModal({ onClose }) {
  const [type, setType] = useState("leave");
  const types = [
    { key: "leave",          label: "Leave Request" },
    { key: "regularization", label: "Attendance Regularization" },
    { key: "wfh",            label: "Work From Home" },
    { key: "permission",     label: "Permission / Early Exit" },
    { key: "other",          label: "Other Request" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">New Request</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 text-lg leading-none">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Request Type</label>
            <div className="grid grid-cols-1 gap-2">
              {types.map((t) => (
                <label key={t.key} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${type === t.key ? "border-[#f18200] bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" name="rtype" value={t.key} checked={type === t.key} onChange={() => setType(t.key)} className="accent-[#f18200]" />
                  <span className="text-sm font-medium text-slate-800">{t.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Date / Period</label>
            <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Reason</label>
            <textarea rows={3} placeholder="Briefly describe your reason…" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] transition-colors resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
            <button className="flex-1 h-10 rounded-xl bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-bold transition-colors">Submit Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const RequestHub = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = activeTab === "all" ? REQUESTS : REQUESTS.filter(r => r.type === activeTab);

  return (
    <div className="space-y-6">
      {showModal && <NewRequestModal onClose={() => setShowModal(false)} />}

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Request Hub</h1>
          <p className="text-slate-500 mt-1 text-sm">Submit and track all your HR requests in one place.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_STATS.map((s) => (
          <div key={s.label} className={`${s.bg} border border-slate-100 rounded-2xl px-5 py-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto bg-white border border-slate-100 rounded-xl p-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key ? "bg-[#f18200] text-white shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Request list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No requests found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="col-span-5">Request</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Detail</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-1" />
            </div>
            {filtered.map((req) => {
              const Icon = req.icon;
              const sc = STATUS_CONFIG[req.status];
              const StatusIcon = sc.icon;
              return (
                <div key={req.id} className="grid grid-cols-12 px-5 py-4 border-b border-slate-50 items-center hover:bg-slate-50/60 transition-colors">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[req.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{req.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{req.label}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">{new Date(req.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">{req.detail}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg}`}>
                      <StatusIcon size={12} />
                      {req.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default RequestHub;
