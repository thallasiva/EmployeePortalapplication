import React, { useState } from "react";
import { Plus, X, Play, Pause, Trash2, Edit2, Calendar, Clock, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge, Btn, Toggle, Toast, ConfirmDialog, SectionCard } from "../components/SharedUI";
import { SEED_SCHEDULES, FREQ_OPTIONS } from "../constants";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FREQ_ICON = {
  Daily:   "🔁", Weekly: "📅", Monthly: "🗓️",
  Yearly:  "🎯", Custom: "⚙️",
};

const STATUS_STYLE = {
  Active:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Paused:   "bg-amber-50 text-amber-700 border-amber-200",
  Disabled: "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]",
};

/* ── Schedule modal ── */
function ScheduleModal({ sched, onSave, onClose }) {
  const isNew = !sched.id;
  const [form, setForm] = useState({
    name:      sched.name || "",
    freq:      sched.freq || "Daily",
    time:      sched.time || "08:00",
    template:  sched.template || "",
    recipient: sched.recipient || "",
    cron:      sched.cron || "",
    status:    sched.status || "Active",
    day:       sched.day || "Mon",
    date:      sched.date || 1,
    month:     sched.month || "Jan",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [err, setErr] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.template.trim()) e.template = "Template is required";
    if (!form.recipient.trim()) e.recipient = "Recipient is required";
    if (form.freq === "Custom" && !form.cron.trim()) e.cron = "Cron expression is required";
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      id: sched.id || Date.now(),
      nextRun: "—",
      lastRun: sched.lastRun || "—",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#1e293b]">{isNew ? "Create Scheduled Email" : "Edit Schedule"}</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Schedule Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e=>set("name",e.target.value)}
              placeholder="e.g. Weekly Payslip Digest"
              className={`w-full h-[40px] border rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] ${err.name?"border-red-300":"border-[#e2e8f0]"}`}/>
            {err.name && <p className="text-red-500 text-[11px] mt-1">{err.name}</p>}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Frequency</label>
            <div className="flex flex-wrap gap-2">
              {FREQ_OPTIONS.map(f=>(
                <button key={f} onClick={()=>set("freq",f)}
                  className={`px-3 h-[34px] rounded-lg text-[12px] font-semibold border transition-all ${
                    form.freq===f?"border-[#f18200] bg-[#fff8f0] text-[#f18200]":"border-[#e2e8f0] text-[#64748b] hover:border-[#f18200]/40"}`}>
                  {FREQ_ICON[f]} {f}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional schedule fields */}
          {form.freq==="Weekly" && (
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Day of Week</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d=>(
                  <button key={d} onClick={()=>set("day",d)}
                    className={`w-12 h-9 rounded-lg text-[12px] font-semibold border transition-all ${
                      form.day===d?"bg-[#f18200] text-white border-[#f18200]":"border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.freq==="Monthly" && (
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Day of Month</label>
              <input type="number" min={1} max={31} value={form.date} onChange={e=>set("date",Number(e.target.value))}
                className="w-32 h-[40px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200]"/>
            </div>
          )}

          {form.freq==="Yearly" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Month</label>
                <div className="relative">
                  <select value={form.month} onChange={e=>set("month",e.target.value)}
                    className="w-full h-[40px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] appearance-none outline-none focus:border-[#f18200]">
                    {MONTHS_SHORT.map(m=><option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"/>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Day</label>
                <input type="number" min={1} max={31} value={form.date} onChange={e=>set("date",Number(e.target.value))}
                  className="w-full h-[40px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200]"/>
              </div>
            </div>
          )}

          {form.freq==="Custom" && (
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Cron Expression <span className="text-red-400">*</span></label>
              <input value={form.cron} onChange={e=>set("cron",e.target.value)}
                placeholder="e.g. 0 8 * * 1-5"
                className={`w-full h-[40px] border rounded-lg px-3 text-[13px] font-mono outline-none focus:border-[#f18200] ${err.cron?"border-red-300":"border-[#e2e8f0]"}`}/>
              {err.cron && <p className="text-red-500 text-[11px] mt-1">{err.cron}</p>}
              <p className="text-[11px] text-[#94a3b8] mt-1">Standard cron: minute hour day-of-month month day-of-week</p>
            </div>
          )}

          {/* Send time */}
          {form.freq !== "Custom" && (
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Send Time</label>
              <input type="time" value={form.time} onChange={e=>set("time",e.target.value)}
                className="h-[40px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200]"/>
            </div>
          )}

          {/* Template */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Email Template <span className="text-red-400">*</span></label>
            <input value={form.template} onChange={e=>set("template",e.target.value)}
              placeholder="e.g. Weekly Summary"
              className={`w-full h-[40px] border rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] ${err.template?"border-red-300":"border-[#e2e8f0]"}`}/>
            {err.template && <p className="text-red-500 text-[11px] mt-1">{err.template}</p>}
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Recipient / Group <span className="text-red-400">*</span></label>
            <input value={form.recipient} onChange={e=>set("recipient",e.target.value)}
              placeholder="e.g. All Employees or specific email"
              className={`w-full h-[40px] border rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] ${err.recipient?"border-red-300":"border-[#e2e8f0]"}`}/>
            {err.recipient && <p className="text-red-500 text-[11px] mt-1">{err.recipient}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-2">Status</label>
            <div className="flex gap-2">
              {["Active","Paused","Disabled"].map(s=>(
                <button key={s} onClick={()=>set("status",s)}
                  className={`px-4 h-[34px] rounded-lg text-[12px] font-semibold border transition-all ${
                    form.status===s?"border-[#f18200] bg-[#fff8f0] text-[#f18200]":"border-[#e2e8f0] text-[#64748b] hover:border-[#f18200]/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 border-t border-[#f1f5f9] pt-4">
          <Btn variant="primary" onClick={handleSave}>{isNew ? "Create Schedule" : "Save Changes"}</Btn>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Schedule row card ── */
function ScheduleCard({ s, onEdit, onDelete, onToggle }) {
  const active = s.status === "Active";
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#fff8f0] flex items-center justify-center shrink-0 text-xl">
          {FREQ_ICON[s.freq] || "📧"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-[#1e293b] truncate">{s.name}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[s.status]}`}>
              {s.status==="Active"?<CheckCircle2 size={10}/>:s.status==="Paused"?<Clock size={10}/>:<AlertCircle size={10}/>} {s.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#64748b]">
            <span className="flex items-center gap-1"><Calendar size={11}/> {s.freq}{s.cron?` (${s.cron})`:""}</span>
            <span className="flex items-center gap-1"><Clock size={11}/> {s.time || "—"}</span>
            <span>Template: <strong className="text-[#1e293b]">{s.template}</strong></span>
            <span>To: <strong className="text-[#1e293b]">{s.recipient}</strong></span>
          </div>
          <div className="mt-1.5 flex gap-4 text-[11px] text-[#94a3b8]">
            <span>Next run: <strong className="text-[#64748b]">{s.nextRun}</strong></span>
            <span>Last run: <strong className="text-[#64748b]">{s.lastRun}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Toggle on={active} onToggle={()=>onToggle(s.id)}/>
          <button title="Edit" onClick={()=>onEdit(s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#f18200] transition-colors">
            <Edit2 size={13}/>
          </button>
          <button title="Delete" onClick={()=>onDelete(s.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledEmails() {
  const [schedules, setSchedules] = useState(SEED_SCHEDULES);
  const [modal, setModal]         = useState(null); // null | {}
  const [delId, setDelId]         = useState(null);
  const [toast, setToast]         = useState(null);

  const handleSave = (data) => {
    setSchedules(p => data.id && p.find(s=>s.id===data.id)
      ? p.map(s=>s.id===data.id?data:s)
      : [...p, data]
    );
    setModal(null);
    setToast({ message: data.id ? "Schedule updated." : "Schedule created.", type:"success" });
  };

  const handleDelete = (id) => {
    setSchedules(p=>p.filter(s=>s.id!==id));
    setDelId(null);
    setToast({ message:"Schedule deleted.", type:"info" });
  };

  const handleToggle = (id) => {
    setSchedules(p=>p.map(s=>s.id===id
      ? {...s, status: s.status==="Active"?"Paused":"Active"}
      : s));
  };

  const counts = {
    active:  schedules.filter(s=>s.status==="Active").length,
    paused:  schedules.filter(s=>s.status==="Paused").length,
    total:   schedules.length,
  };

  return (
    <>
      {modal !== null && <ScheduleModal sched={modal} onSave={handleSave} onClose={()=>setModal(null)}/>}
      <ConfirmDialog
        open={delId!==null}
        title="Delete Schedule"
        message="This schedule will be permanently removed and all future sends cancelled."
        onConfirm={()=>handleDelete(delId)}
        onCancel={()=>setDelId(null)}
        danger/>
      <Toast message={toast?.message} type={toast?.type} onClose={()=>setToast(null)}/>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label:"Total Schedules", value:counts.total,  color:"#f18200", bg:"#fff8f0" },
          { label:"Active",          value:counts.active, color:"#10b981", bg:"#ecfdf5" },
          { label:"Paused",          value:counts.paused, color:"#f59e0b", bg:"#fffbeb" },
        ].map(c=>(
          <div key={c.label} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{background:c.bg}}>
              <Calendar size={18} style={{color:c.color}}/>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{c.label}</p>
              <p className="text-[20px] font-bold" style={{color:c.color}}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[#1e293b]">Scheduled Emails</h2>
          <p className="text-[12px] text-[#94a3b8]">Automated emails sent on a recurring schedule</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14}/>} onClick={()=>setModal({})}>
          New Schedule
        </Btn>
      </div>

      {/* List */}
      {schedules.length===0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-16 text-center">
          <Calendar size={48} strokeWidth={1} className="text-[#e2e8f0] mx-auto mb-3"/>
          <p className="text-[#94a3b8] text-[14px]">No scheduled emails yet.</p>
          <button onClick={()=>setModal({})} className="mt-3 text-[#f18200] text-[13px] font-semibold hover:underline">
            + Create your first schedule
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {schedules.map(s=>(
            <ScheduleCard key={s.id} s={s}
              onEdit={()=>setModal(s)}
              onDelete={()=>setDelId(s.id)}
              onToggle={handleToggle}/>
          ))}
        </div>
      )}
    </>
  );
}
