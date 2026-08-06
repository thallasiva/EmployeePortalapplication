import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Eye, Edit2, Copy, Trash2, X, Send, Mail, Loader2, LayoutTemplate, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Btn, Badge, ConfirmDialog, Toast } from "../components/SharedUI";
import { emailTemplatesApi } from "../../../../../api/settings.api";

const PER = 8;
const CATEGORIES = ["Onboarding","Leave","Attendance","Payroll","Recruitment","Performance","Helpdesk","Announcements","System"];
const CAT_COLORS  = { Onboarding:"#6366f1",Leave:"#10b981",Attendance:"#f59e0b",Payroll:"#3b82f6",Recruitment:"#8b5cf6",Performance:"#ec4899",Helpdesk:"#14b8a6",Announcements:"#f97316",System:"#64748b" };

const SAMPLES = {
  "{{EmployeeName}}":"Rajan Kumar","{{EmployeeId}}":"EMP1042","{{Department}}":"Engineering",
  "{{Designation}}":"Senior Developer","{{ManagerName}}":"Priya Sharma","{{LeaveType}}":"Casual Leave",
  "{{FromDate}}":"10 Aug 2026","{{ToDate}}":"12 Aug 2026","{{CompanyName}}":"NAT IT Pvt. Ltd.",
  "{{InterviewDate}}":"15 Aug 2026","{{InterviewTime}}":"11:00 AM","{{JobTitle}}":"UI Developer",
  "{{OfferDate}}":"05 Aug 2026","{{JoiningDate}}":"01 Sep 2026","{{Month}}":"July 2026",
  "{{Amount}}":"₹4,500","{{PolicyName}}":"Health Insurance","{{DocumentName}}":"Passport",
  "{{ExpiryDate}}":"31 Dec 2026","{{SupportLink}}":"https://support.company.com","{{Year}}":"2026",
};
const ALL_VARS = Object.keys(SAMPLES);
const renderPreview = (body) => Object.entries(SAMPLES).reduce((s,[k,v]) => s.replaceAll(k,`<strong style="color:#f18200">${v}</strong>`), body || "");

/* ── Editor Modal ── */
function TemplateModal({ tpl, onClose, onSave }) {
  const isNew = !tpl?.id;
  const [form, setForm] = useState({
    name: tpl?.name||"", category: tpl?.category||CATEGORIES[0],
    subject: tpl?.subject||"", body: tpl?.body||"", status: tpl?.status||"Active",
  });
  const [tab, setTab] = useState("edit");
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const insertVar = (v) => {
    const el = bodyRef.current;
    if (!el) { set("body", form.body + v); return; }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const newVal = form.body.slice(0, start) + v + form.body.slice(end);
    set("body", newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch { }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] shrink-0">
          <span className="text-[15px] font-bold text-[#1e293b]">{isNew ? "New Template" : "Edit Template"}</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18} /></button>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {["edit","preview"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors ${
                tab===t ? "bg-[#f18200] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"
              }`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === "edit" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Template Name *</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Leave Approved"
                    className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)}
                    className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Subject</label>
                <input value={form.subject} onChange={e => set("subject", e.target.value)}
                  placeholder="Your {{LeaveType}} request has been {{Status}}"
                  className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
              </div>
              {/* Variable pills */}
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-2 block">Available Variables <span className="text-[#94a3b8] font-normal">(click to insert)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_VARS.map(v => (
                    <button key={v} onClick={() => insertVar(v)} type="button"
                      className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#fff8f0] hover:border-[#f18200] hover:text-[#f18200] text-[#64748b] transition-all">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Body (HTML supported)</label>
                <textarea ref={bodyRef} value={form.body} onChange={e => set("body", e.target.value)} rows={12}
                  placeholder="<p>Dear {{EmployeeName}},</p><p>Your leave has been approved.</p>"
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[#f18200] resize-none" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#475569] mb-1 block">Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)}
                  className="w-full h-[38px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
                  {["Active","Inactive"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-[#f1f5f9]">
              <p className="text-[11px] text-[#94a3b8] mb-3">Preview with sample values</p>
              <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 shadow-sm">
                <div className="border-b border-[#f1f5f9] pb-3 mb-4">
                  <div className="text-[11px] text-[#94a3b8]">Subject</div>
                  <div className="text-[14px] font-semibold text-[#1e293b]"
                    dangerouslySetInnerHTML={{ __html: renderPreview(form.subject) }} />
                </div>
                <div className="text-[13px] text-[#475569] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderPreview(form.body) || "<em>No body content</em>" }} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#f1f5f9] flex gap-3 justify-end shrink-0">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}
            icon={saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}>
            {saving ? "Saving…" : isNew ? "Create Template" : "Update Template"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Preview Modal ── */
function PreviewModal({ tpl, onClose }) {
  if (!tpl) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" style={{ maxHeight:"90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#1e293b]">Template Preview</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight:"70vh" }}>
          <div className="bg-[#f8fafc] rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail size={16} className="text-[#f18200]" />
              <span className="text-[11px] text-[#94a3b8] uppercase tracking-wide font-semibold">{tpl.category}</span>
            </div>
            <div className="text-[12px] text-[#94a3b8]">Subject</div>
            <div className="text-[14px] font-semibold text-[#1e293b]"
              dangerouslySetInnerHTML={{ __html: renderPreview(tpl.subject) }} />
          </div>
          <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 text-[13px] text-[#475569] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderPreview(tpl.body) || "<em>No body content</em>" }} />
        </div>
        <div className="px-6 pb-5 border-t border-[#f1f5f9] pt-4">
          <button onClick={onClose} className="w-full h-[38px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);   // null | { mode:"edit"|"preview", item }
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailTemplatesApi.list({ search, category: category||undefined, status: status||undefined, page, limit: PER });
      setTemplates(res.rows || []);
      setTotal(res.total || 0);
    } catch { showToast("Failed to load templates", "error"); }
    finally { setLoading(false); }
  }, [search, category, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, category, status]);

  const handleSave = async (form) => {
    if (modal?.item?.id) {
      await emailTemplatesApi.update(modal.item.id, form);
      showToast("Template updated");
    } else {
      await emailTemplatesApi.create(form);
      showToast("Template created");
    }
    load();
  };

  const handleClone = async (id) => {
    try { await emailTemplatesApi.clone(id); showToast("Template cloned"); load(); }
    catch { showToast("Clone failed", "error"); }
  };

  const handleDelete = async (id) => {
    try { await emailTemplatesApi.delete(id); showToast("Deleted"); load(); }
    catch { showToast("Delete failed", "error"); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PER));

  return (
    <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {confirm && (
        <ConfirmDialog message="Delete this template?" onConfirm={() => { handleDelete(confirm); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      )}
      {modal?.mode === "edit" && (
        <TemplateModal tpl={modal.item} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.mode === "preview" && (
        <PreviewModal tpl={modal.item} onClose={() => setModal(null)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            className="w-full pl-8 pr-3 h-[36px] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="h-[36px] px-3 border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#f18200]">
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option>
        </select>
        <Btn icon={<Plus size={14} />} onClick={() => setModal({ mode:"edit", item: null })}>New Template</Btn>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-[#f18200]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f1f5f9] py-16 text-center text-[#94a3b8] text-[13px]">
          No templates found. <button onClick={() => setModal({ mode:"edit", item: null })} className="text-[#f18200] font-semibold ml-1">Create one</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-[#f1f5f9] p-4 hover:shadow-sm transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[#1e293b] truncate">{t.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${CAT_COLORS[t.category] || "#64748b"}18`, color: CAT_COLORS[t.category] || "#64748b" }}>
                      {t.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status==="Active" ? "bg-green-50 text-green-700" : "bg-[#f1f5f9] text-[#94a3b8]"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#94a3b8] line-clamp-2">{t.subject || "No subject"}</div>
              <div className="flex items-center gap-1 pt-1 border-t border-[#f8fafc]">
                <button onClick={() => setModal({ mode:"preview", item: t })} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]" title="Preview"><Eye size={13} /></button>
                <button onClick={() => setModal({ mode:"edit", item: t })} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]" title="Edit"><Edit2 size={13} /></button>
                <button onClick={() => handleClone(t.id)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]" title="Clone"><Copy size={13} /></button>
                <button onClick={() => setConfirm(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Delete"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] text-[#94a3b8]">
            {total} template{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i+1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-7 h-7 rounded text-[12px] ${n===page ? "bg-[#f18200] text-white" : "hover:bg-[#f1f5f9] text-[#64748b]"}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
              className="p-1.5 rounded hover:bg-[#f1f5f9] disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
