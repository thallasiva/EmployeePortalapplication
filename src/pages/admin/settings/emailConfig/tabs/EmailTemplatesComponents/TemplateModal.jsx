import React, { useState, useRef } from "react";
import { X, Loader2, Save } from "lucide-react";
import { Btn } from "../../components/SharedUI";
import { CATEGORIES, SAMPLES, ACTION_VARS, renderPreview } from "./shared";
/* ── Editor Modal ── */
function TemplateModal({
  tpl,
  onClose,
  onSave
}) {
  const isNew = !tpl?.id;
  const [form, setForm] = useState({
    name: tpl?.name || "",
    category: tpl?.category || CATEGORIES[0],
    subject: tpl?.subject || "",
    body: tpl?.body || "",
    status: tpl?.status || "Active"
  });
  const [tab, setTab] = useState("edit");
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);
  const set = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  const insertVar = v => {
    const el = bodyRef.current;
    if (!el) {
      set("body", form.body + v);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = form.body.slice(0, start) + v + form.body.slice(end);
    set("body", newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    }, 0);
  };
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
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col" style={{
      maxHeight: "90vh"
    }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] shrink-0">
          <span className="text-[15px] font-bold text-[#e87500]">{isNew ? "New Template" : "Edit Template"}</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18} /></button>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {["edit", "preview"].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors ${tab === t ? "bg-[#e87500] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>{t}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === "edit" ? <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Template Name *</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Leave Approved" className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Subject</label>
                <input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Your {{LeaveType}} request has been {{Status}}" className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]" />
              </div>
              {/* Variable pills */}
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-2 block">Available Variables <span className="text-[#94a3b8] font-normal">(click to insert)</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Object.keys(SAMPLES).map(v => <button key={v} onClick={() => insertVar(v)} type="button" className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#fff8f0] hover:border-[#e87500] hover:text-[#e87500] text-[#64748b] transition-all">
                      {v}
                    </button>)}
                </div>
                <div className="mt-2">
                  <p className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wide mb-1.5">Action Buttons (renders as clickable buttons in email)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ACTION_VARS).map(v => <button key={v} onClick={() => insertVar(v)} type="button" className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#dcfce7] hover:border-[#10b981] hover:text-[#059669] text-[#059669] transition-all font-bold">
                        {v}
                      </button>)}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Body (HTML supported)</label>
                <textarea ref={bodyRef} value={form.body} onChange={e => set("body", e.target.value)} rows={12} placeholder="<p>Dear {{EmployeeName}},</p><p>Your leave has been approved.</p>" className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[#e87500] resize-none" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#e87500]">
                  {["Active", "Inactive"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div> : <div className="bg-[#f8fafc] rounded-xl p-6 border border-[#f1f5f9]">
              <p className="text-[11px] text-[#94a3b8] mb-3">Preview with sample values</p>
              <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 shadow-sm">
                <div className="border-b border-[#f1f5f9] pb-3 mb-4">
                  <div className="text-[11px] text-[#94a3b8]">Subject</div>
                  <div className="text-[14px] font-semibold text-[#1e293b]" dangerouslySetInnerHTML={{
                __html: renderPreview(form.subject)
              }} />
                </div>
                <div className="text-[13px] text-[#475569] leading-relaxed" dangerouslySetInnerHTML={{
              __html: renderPreview(form.body) || "<em>No body content</em>"
            }} />
              </div>
            </div>}
        </div>
        <div className="px-6 py-4 border-t border-[#f1f5f9] flex gap-3 justify-end shrink-0">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} icon={saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}>
            {saving ? "Saving…" : isNew ? "Create Template" : "Update Template"}
          </Btn>
        </div>
      </div>
    </div>;
}
/* ── Preview Modal ── */
export { TemplateModal };
