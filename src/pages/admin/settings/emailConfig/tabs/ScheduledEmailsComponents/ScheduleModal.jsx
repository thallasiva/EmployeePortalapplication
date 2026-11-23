import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Btn } from "../../components/SharedUI";
import { FREQ_OPTS, DAYS_SHORT, BLANK } from "./shared";
function ScheduleModal({
  open,
  onClose,
  onSave,
  initial,
  templates
}) {
  const [form, setForm] = useState(initial || BLANK);
  const [days, setDays] = useState([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(initial || BLANK);
      setDays([]);
    }
  }, [open, initial]);
  const set = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  const toggleDay = d => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {} finally {
      setSaving(false);
    }
  };
  if (!open) return null;
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#e87500]">{initial?.id ? "Edit Schedule" : "New Schedule"}</span>
          <button onClick={onClose} aria-label="Close" className="text-[#94a3b8] hover:text-[#64748b]"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {[{
          label: "Schedule Name",
          key: "name",
          placeholder: "e.g. Weekly Newsletter"
        }].map(({
          label,
          key,
          placeholder
        }) => <div key={key}>
              <label className="text-[12px] font-semibold text-[#475569] mb-1 block">{label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
            </div>)}
          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Frequency</label>
            <select value={form.freq} onChange={e => set("freq", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
              {FREQ_OPTS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          {form.freq === "Weekly" && <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-2 block">Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_SHORT.map(d => <button key={d} onClick={() => toggleDay(d)} type="button" className={`w-10 h-8 rounded-lg text-[12px] font-semibold transition-colors ${days.includes(d) ? "bg-[#e87500] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"}`}>
                    {d}
                  </button>)}
              </div>
            </div>}
          {(form.freq === "Monthly" || form.freq === "Yearly") && <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-1 block">{form.freq === "Yearly" ? "Date (MM-DD)" : "Day of Month"}</label>
              <input type={form.freq === "Yearly" ? "text" : "number"} min="1" max="31" placeholder={form.freq === "Yearly" ? "01-15" : "1"} value={form.day || ""} onChange={e => set("day", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
            </div>}
          {form.freq === "Custom Cron" && <div>
              <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Cron Expression</label>
              <input value={form.cron_expr || ""} onChange={e => set("cron_expr", e.target.value)} placeholder="0 8 * * 1" className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
              <p className="text-[11px] text-[#94a3b8] mt-1">min hour day month weekday</p>
            </div>}
          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Send Time</label>
            <input type="time" value={form.send_time} onChange={e => set("send_time", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Template</label>
            <select value={form.template_name} onChange={e => set("template_name", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
              <option value="">Select template…</option>
              {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Recipient</label>
            <input value={form.recipient} onChange={e => set("recipient", e.target.value)} placeholder="all-employees, finance@company.com" className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
              {["Active", "Paused"].map(o => <option key={o}>{o}</option>)}
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
    </div>;
}
export { ScheduleModal };
