import React, { useState, useEffect, useCallback } from "react";
import { CalendarClock, Plus, Edit2, Trash2, Play, Pause, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { emailSchedulesApi, emailTemplatesApi } from "../../../../../api/settings.api";
import { Btn, Toggle, Toast, ConfirmDialog } from "../components/SharedUI";

const FREQ_OPTS  = ["Daily","Weekly","Monthly","Yearly","Custom Cron"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const FREQ_EMOJI = { Daily:"🔁", Weekly:"📅", Monthly:"🗓️", Yearly:"🎯", "Custom Cron":"⚙️" };

const BLANK = { name:"", freq:"Daily", send_time:"08:00", template_name:"", recipient:"", cron_expr:"", status:"Active" };

function ScheduleModal({ open, onClose, onSave, initial, templates }) {
  const [form, setForm] = useState(initial || BLANK);
  const [days, setDays] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setForm(initial || BLANK); setDays([]); } }, [open, initial]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleDay = d => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); } catch {} finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#1e293b]">{initial?.id ? "Edit Schedule" : "New Schedule"}</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">✕</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {[
            { label:"Schedule Name", key:"name", placeholder:"e.g. Weekly Newsletter" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-[12px] font-semibold text-[#475569] mb-1 block">{label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
            </div>
          ))}

          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Frequency</label>
            <select value={form.freq} onChange={e => set("freq", e.target.value)}
              className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
              {FREQ_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {form.freq === "Weekly" && (
            <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-2 block">Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_SHORT.map(d => (
                  <button key={d} onClick={() => toggleDay(d)} type="button"
                    className={`w-10 h-8 rounded-lg text-[12px] font-semibold transition-colors ${days.includes(d) ? "bg-[#f18200] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(form.freq === "Monthly" || form.freq === "Yearly") && (
            <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-1 block">{form.freq === "Yearly" ? "Date (MM-DD)" : "Day of Month"}</label>
              <input type={form.freq === "Yearly" ? "text" : "number"} min="1" max="31"
                placeholder={form.freq === "Yearly" ? "01-15" : "1"}
                value={form.day || ""} onChange={e => set("day", e.target.value)}
                className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
            </div>
          )}

          {form.freq === "Custom Cron" && (
            <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Cron Expression</label>
              <input value={form.cron_expr || ""} onChange={e => set("cron_expr", e.target.value)}
                placeholder="0 8 * * 1"
                className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
              <p className="text-[11px] text-[#94a3b8] mt-1">min hour day month weekday</p>
            </div>
          )}

          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Send Time</label>
            <input type="time" value={form.send_time} onChange={e => set("send_time", e.target.value)}
              className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Template</label>
            <select value={form.template_name} onChange={e => set("template_name", e.target.value)}
              className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
              <option value="">Select template…</option>
              {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Recipient</label>
            <input value={form.recipient} onChange={e => set("recipient", e.target.value)}
              placeholder="all-employees, finance@company.com"
              className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
              {["Active","Paused"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end border-t border-[#f1f5f9] pt-4">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} icon={saving ? <Loader2 size={13} className="animate-spin" /> : null}>
            {saving ? "Saving…" : initial?.id ? "Update" : "Create"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledEmails() {
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, tmplRes] = await Promise.all([
        emailSchedulesApi.list(),
        emailTemplatesApi.list({ limit: 200 }),
      ]);
      setSchedules(Array.isArray(schRes) ? schRes : []);
      setTemplates(tmplRes.rows || []);
    } catch { showToast("Failed to load", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (modal.item?.id) {
      await emailSchedulesApi.update(modal.item.id, form);
      showToast("Schedule updated");
    } else {
      await emailSchedulesApi.create(form);
      showToast("Schedule created");
    }
    load();
  };

  const handleToggle = async (id) => {
    try { await emailSchedulesApi.toggle(id); load(); }
    catch { showToast("Toggle failed", "error"); }
  };

  const handleDelete = async (id) => {
    try { await emailSchedulesApi.delete(id); showToast("Deleted"); load(); }
    catch { showToast("Delete failed", "error"); }
  };

  const active = schedules.filter(s => s.status === "Active").length;
  const paused = schedules.filter(s => s.status === "Paused").length;

  return (
    <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {confirm && (
        <ConfirmDialog message="Delete this schedule?" onConfirm={() => { handleDelete(confirm); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      )}
      <ScheduleModal open={modal.open} onClose={() => setModal({ open: false, item: null })}
        onSave={handleSave} initial={modal.item} templates={templates} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total",  value:schedules.length, color:"#f18200", bg:"#fff8f0" },
          { label:"Active", value:active,            color:"#16a34a", bg:"#dcfce7" },
          { label:"Paused", value:paused,            color:"#ca8a04", bg:"#fef9c3" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-[#f1f5f9] p-4 text-center">
            <div className="text-[24px] font-bold" style={{ color }}>{value}</div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#64748b]">Automate recurring email campaigns and reminders</p>
        <Btn icon={<Plus size={14} />} onClick={() => setModal({ open: true, item: null })}>New Schedule</Btn>
      </div>

      {/* Schedule cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-[#f18200]" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f1f5f9] py-16 text-center text-[#94a3b8] text-[13px]">
          No schedules yet. Create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-[#f1f5f9] p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">{FREQ_EMOJI[s.freq] || "📧"}</span>
                  <div>
                    <div className="text-[14px] font-bold text-[#1e293b]">{s.name}</div>
                    <div className="text-[11px] text-[#94a3b8]">{s.freq} · {s.send_time}</div>
                  </div>
                </div>
                <Toggle on={s.status === "Active"} onToggle={() => handleToggle(s.id)} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[["Template", s.template_name||"—"],["Recipient", s.recipient||"—"]].map(([l,v]) => (
                  <div key={l}>
                    <div className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">{l}</div>
                    <div className="text-[12px] font-medium text-[#475569] truncate">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  s.status === "Active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                }`}>
                  {s.status === "Active" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {s.status}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal({ open: true, item: s })} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]"><Edit2 size={13} /></button>
                  <button onClick={() => setConfirm(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
