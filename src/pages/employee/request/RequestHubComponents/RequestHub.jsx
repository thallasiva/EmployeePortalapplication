import React, { useState } from "react";
import { FileText, Plus, ChevronRight } from "lucide-react";
// ── Static sample data ────────────────────────────────────────────────────────
import { REQUESTS, TABS, STATUS_CONFIG, TYPE_COLORS, SUMMARY_STATS } from "./shared";
import { NewRequestModal } from "./NewRequestModal";
const RequestHub = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const filtered = activeTab === "all" ? REQUESTS : REQUESTS.filter(r => r.type === activeTab);
  return <div className="space-y-6">
      {showModal && <NewRequestModal onClose={() => setShowModal(false)} />}
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold  text-[#e87500]">Request Hub</h1>
          <p className="text-slate-500 mt-1 text-sm">Submit and track all your HR requests in one place.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#e87500] hover:bg-[#e07000] text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
          <Plus size={16} /> New Request
        </button>
      </div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_STATS.map(s => <div key={s.label} className={`${s.bg} border border-slate-100 rounded-2xl px-5 py-4 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>)}
      </div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto bg-white border border-slate-100 rounded-xl p-1 shadow-sm w-fit">
        {TABS.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === t.key ? "bg-[#e87500] text-white shadow-sm" : "text-slate-500 hover: text-[#e87500] hover:bg-slate-50"}`}>
            {t.label}
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
              {t.count}
            </span>
          </button>)}
      </div>
      {/* Request list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? <div className="py-16 text-center">
            <FileText size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No requests found in this category.</p>
          </div> : <>
            <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="col-span-5">Request</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Detail</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-1" />
            </div>
            {filtered.map(req => {
          const Icon = req.icon;
          const sc = STATUS_CONFIG[req.status];
          const StatusIcon = sc.icon;
          return <div key={req.id} className="grid grid-cols-12 px-5 py-4 border-b border-slate-50 items-center hover:bg-slate-50/60 transition-colors">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[req.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold  text-[#e87500]">{req.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{req.label}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">{new Date(req.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}</p>
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
                </div>;
        })}
          </>}
      </div>
    </div>;
};
export { RequestHub };
