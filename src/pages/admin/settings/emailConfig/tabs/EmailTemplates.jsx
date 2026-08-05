import React, { useState } from "react";
import { Plus, Search, Eye, Edit2, Copy, Trash2, X, Send, ChevronDown, Mail, Loader2, LayoutTemplate } from "lucide-react";
import { Btn, Badge, Dot, Select, SectionCard, ConfirmDialog, Toast, Pagination } from "../components/SharedUI";
import { SEED_TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_VARS, CAT_COLOR } from "../constants";

const PER = 8;

/* ── Variable pill ── */
function VarPill({ v, onInsert }) {
  return (
    <button onClick={()=>onInsert(v)}
      className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#fff8f0] hover:border-[#f18200] hover:text-[#f18200] text-[#64748b] transition-all">
      {v}
    </button>
  );
}

/* ── Preview renderer: replace {{var}} with sample values ── */
const SAMPLES = {
  "{{EmployeeName}}":"Rajan Kumar","{{EmployeeId}}":"EMP1042","{{Department}}":"Engineering",
  "{{Designation}}":"Senior Developer","{{ManagerName}}":"Priya Sharma","{{LeaveType}}":"Casual Leave",
  "{{FromDate}}":"10 Aug 2026","{{ToDate}}":"12 Aug 2026","{{CompanyName}}":"NAT IT Pvt. Ltd.",
  "{{InterviewDate}}":"15 Aug 2026","{{InterviewTime}}":"11:00 AM","{{JobTitle}}":"UI Developer",
  "{{OfferDate}}":"05 Aug 2026","{{JoiningDate}}":"01 Sep 2026","{{Month}}":"July 2026",
  "{{Amount}}":"₹4,500","{{PolicyName}}":"Health Insurance","{{DocumentName}}":"Passport",
  "{{ExpiryDate}}":"31 Dec 2026",
};
const renderBody = (body) => Object.entries(SAMPLES).reduce((s,[k,v])=>s.replaceAll(k,`<strong style="color:#f18200">${v}</strong>`),body||"");

/* ── Template Editor Modal ── */
function TemplateModal({ tpl, onClose, onSave }) {
  const isNew = !tpl?.id;
  const [form, setForm] = useState({
    name: tpl?.name||"", category: tpl?.category||TEMPLATE_CATEGORIES[0],
    subject: tpl?.subject||"", body: tpl?.body||"", status: tpl?.status||"Active",
  });
  const [tab, setTab] = useState("edit");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:""})); };
  const insertVar = (v) => set("body", form.body + v);
  const insertSubjectVar = (v) => set("subject", form.subject + v);

  const validate = () => {
    const e={};
    if (!form.name.trim()) e.name="Template name required";
    if (!form.subject.trim()) e.subject="Subject required";
    if (!form.body.trim()) e.body="Body required";
    return e;
  };

  const handleSave = () => {
    const e=validate();
    if(Object.keys(e).length){setErrors(e);return;}
    onSave({...tpl,...form,updated:"Today"});
  };

  const handleSendTest = () => {
    if(!testEmail.includes("@")) return;
    setSending(true);
    setTimeout(()=>{setSending(false);setSent(true);},1800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
              <LayoutTemplate size={15} color="#f18200"/>
            </div>
            <span className="text-[16px] font-bold text-[#1e293b]">{isNew?"Create Template":"Edit Template"}</span>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] transition-colors"><X size={20}/></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-[#f1f5f9]">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">Template Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Leave Approved"
                  className={`w-full h-[40px] border rounded-lg px-3 text-[13px] outline-none transition-all ${errors.name?"border-red-400":"border-[#e2e8f0] focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"}`} />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div className="relative">
                <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">Category</label>
                <select value={form.category} onChange={e=>set("category",e.target.value)}
                  className="w-full h-[40px] border border-[#e2e8f0] rounded-lg px-3 pr-8 text-[13px] text-[#1e293b] bg-white outline-none focus:border-[#f18200] appearance-none">
                  {TEMPLATE_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-[34px] text-[#94a3b8] pointer-events-none"/>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">Subject <span className="text-red-500">*</span></label>
              <input value={form.subject} onChange={e=>set("subject",e.target.value)}
                placeholder="e.g. Welcome to {{CompanyName}}, {{EmployeeName}}!"
                className={`w-full h-[40px] border rounded-lg px-3 text-[13px] outline-none transition-all ${errors.subject?"border-red-400":"border-[#e2e8f0] focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"}`} />
              {errors.subject && <p className="text-[11px] text-red-500 mt-1">{errors.subject}</p>}
              <div className="flex flex-wrap gap-1 mt-2">
                {TEMPLATE_VARS.slice(0,8).map(v=><VarPill key={v} v={v} onInsert={insertSubjectVar}/>)}
              </div>
            </div>

            {/* Tabs: Edit / Preview */}
            <div>
              <div className="flex gap-1 bg-[#f8fafc] rounded-lg p-1 w-fit mb-3">
                {["edit","preview"].map(t=>(
                  <button key={t} onClick={()=>setTab(t)}
                    className={`px-4 h-[32px] rounded-md text-[12px] font-semibold capitalize transition-all ${tab===t?"bg-[#f18200] text-white shadow-sm":"text-[#64748b] hover:text-[#1e293b]"}`}>
                    {t==="edit"?"Edit Body":"Preview"}
                  </button>
                ))}
              </div>

              {tab==="edit" ? (
                <>
                  <textarea value={form.body} onChange={e=>set("body",e.target.value)}
                    rows={10} placeholder="Write your email body here. Use the variable buttons below to insert dynamic values."
                    className={`w-full border rounded-lg p-3 text-[13px] resize-none outline-none transition-all font-mono ${errors.body?"border-red-400":"border-[#e2e8f0] focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"}`} />
                  {errors.body && <p className="text-[11px] text-red-500 mt-1">{errors.body}</p>}
                  <p className="text-[11px] text-[#94a3b8] mt-2 mb-2">Click to insert dynamic variable:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATE_VARS.map(v=><VarPill key={v} v={v} onInsert={insertVar}/>)}
                  </div>
                </>
              ) : (
                <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                  {/* Email preview */}
                  <div className="bg-[#f8fafc] px-4 py-2 border-b border-[#e2e8f0] text-[11px] text-[#64748b]">
                    <span className="font-bold">From:</span> NAT IT HR Portal &lt;hr@natit.com&gt; &nbsp;|&nbsp;
                    <span className="font-bold">Subject:</span> <span dangerouslySetInnerHTML={{__html:renderBody(form.subject)}}/>
                  </div>
                  <div className="p-6 bg-white min-h-[200px]">
                    <pre className="text-[13px] text-[#1e293b] whitespace-pre-wrap font-sans leading-relaxed"
                      dangerouslySetInnerHTML={{__html:renderBody(form.body)}} />
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <label className="text-[12px] font-semibold text-[#475569]">Status</label>
              {["Active","Inactive"].map(s=>(
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={form.status===s} onChange={()=>set("status",s)}
                    className="accent-[#f18200]"/>
                  <span className="text-[13px] text-[#374151]">{s}</span>
                </label>
              ))}
            </div>

            {/* Send test email */}
            <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8eef5] space-y-3">
              <p className="text-[12px] font-bold text-[#64748b]">Send Test Email</p>
              <div className="flex gap-2">
                <input value={testEmail} onChange={e=>{setTestEmail(e.target.value);setSent(false);}}
                  placeholder="test@example.com" type="email"
                  className="flex-1 h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200]" />
                <Btn variant="outline" size="sm" icon={sending?<Loader2 size={12} className="animate-spin"/>:<Send size={12}/>}
                  onClick={handleSendTest} disabled={sending||!testEmail}>
                  {sending?"Sending…":"Send Test"}
                </Btn>
              </div>
              {sent && <p className="text-[11px] text-emerald-600 font-semibold">✓ Test email sent to {testEmail}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9] shrink-0">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>{isNew?"Create Template":"Save Changes"}</Btn>
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="text-[15px] font-bold text-[#1e293b]">Preview — {tpl.name}</span>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#e2e8f0] text-[12px] text-[#64748b]">
            <strong>Subject:</strong> <span dangerouslySetInnerHTML={{__html:renderBody(tpl.subject)}}/>
          </div>
          <div className="p-6">
            <pre className="text-[13px] text-[#1e293b] whitespace-pre-wrap font-sans leading-relaxed"
              dangerouslySetInnerHTML={{__html:renderBody(tpl.body)}}/>
          </div>
          <div className="px-5 pb-3 text-[10px] text-[#94a3b8]">
            ℹ️ Values shown in <strong className="text-[#f18200]">orange</strong> are sample data — actual values will be replaced at send time.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#f1f5f9]">
          <Btn variant="primary" onClick={onClose}>Close Preview</Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function EmailTemplates() {
  const [templates, setTemplates] = useState(SEED_TEMPLATES);
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("All");
  const [page, setPage] = useState(1);
  const [editTpl, setEditTpl] = useState(null);   // null | template obj (empty={} for new)
  const [previewTpl, setPreviewTpl] = useState(null);
  const [confirm, setConfirm] = useState(null);    // {id}
  const [toast, setToast] = useState(null);

  const filtered = templates.filter(t=>
    (catF==="All"||t.category===catF)&&
    (t.name.toLowerCase().includes(search.toLowerCase())||t.subject.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1,Math.ceil(filtered.length/PER));
  const paged = filtered.slice((page-1)*PER,page*PER);

  const handleSave = (updated) => {
    if (updated.id) {
      setTemplates(p=>p.map(t=>t.id===updated.id?{...updated,updated:"Today"}:t));
      setToast({message:"Template updated!",type:"success"});
    } else {
      const newT={...updated,id:Date.now(),updated:"Today"};
      setTemplates(p=>[newT,...p]);
      setToast({message:"Template created!",type:"success"});
    }
    setEditTpl(null);
  };

  const handleClone = (t) => {
    const cl={...t,id:Date.now(),name:`${t.name} (Copy)`,updated:"Today"};
    setTemplates(p=>[cl,...p]);
    setToast({message:"Template cloned!",type:"info"});
  };

  const handleDelete = (id) => {
    setTemplates(p=>p.filter(t=>t.id!==id));
    setConfirm(null);
    setToast({message:"Template deleted.",type:"info"});
  };

  const handleToggleStatus = (id) => {
    setTemplates(p=>p.map(t=>t.id===id?{...t,status:t.status==="Active"?"Inactive":"Active"}:t));
  };

  const cats = ["All",...TEMPLATE_CATEGORIES];

  return (
    <>
      {editTpl !== null && <TemplateModal tpl={editTpl?.id?editTpl:{}} onClose={()=>setEditTpl(null)} onSave={handleSave}/>}
      {previewTpl && <PreviewModal tpl={previewTpl} onClose={()=>setPreviewTpl(null)}/>}
      <ConfirmDialog open={!!confirm} title="Delete Template" danger
        message={`Are you sure you want to delete "${confirm?.name}"? This cannot be undone.`}
        onConfirm={()=>handleDelete(confirm.id)} onCancel={()=>setConfirm(null)}/>
      <Toast message={toast?.message} type={toast?.type} onClose={()=>setToast(null)}/>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-[#e8eef5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"/>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Search templates…"
                className="h-[36px] pl-9 pr-4 border border-[#e2e8f0] rounded-lg text-[13px] outline-none focus:border-[#f18200] w-52 bg-white"/>
            </div>
            <div className="relative">
              <select value={catF} onChange={e=>{setCatF(e.target.value);setPage(1);}}
                className="h-[36px] pl-3 pr-8 border border-[#e2e8f0] rounded-lg text-[13px] outline-none focus:border-[#f18200] appearance-none bg-white text-[#374151]">
                {cats.map(c=><option key={c}>{c==="All"?"All Categories":c}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"/>
            </div>
          </div>
          <Btn variant="primary" size="sm" icon={<Plus size={13}/>} onClick={()=>setEditTpl({})}>
            Create Template
          </Btn>
        </div>

        {/* Table head */}
        <div className="grid grid-cols-12 px-5 py-3 bg-[#f8fafc] border-b border-[#e8eef5] text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
          <span className="col-span-3">Template Name</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-3">Subject</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1">Updated</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {paged.length===0 ? (
          <div className="p-16 text-center">
            <Mail size={40} className="text-[#e2e8f0] mx-auto mb-3"/>
            <p className="text-[#94a3b8] text-[14px]">No templates found.</p>
            <button onClick={()=>setEditTpl({})} className="mt-3 text-[13px] text-[#f18200] font-semibold hover:underline">
              + Create your first template
            </button>
          </div>
        ) : paged.map(t=>(
          <div key={t.id} className="grid grid-cols-12 px-5 py-3.5 border-b border-[#f8fafc] items-center hover:bg-[#fafbff] transition-colors">
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center shrink-0">
                <Mail size={13} color="#f18200"/>
              </div>
              <span className="text-[13px] font-semibold text-[#1e293b] truncate">{t.name}</span>
            </div>
            <div className="col-span-2">
              <Badge color={CAT_COLOR[t.category]||"gray"}>{t.category}</Badge>
            </div>
            <div className="col-span-3 text-[12px] text-[#64748b] truncate pr-3"
              dangerouslySetInnerHTML={{__html: t.subject.replace(/\{\{[^}]+\}\}/g,'<span class="text-[#f18200] font-mono text-[10px]">$&</span>')}} />
            <div className="col-span-1 flex justify-center">
              <button onClick={()=>handleToggleStatus(t.id)}>
                <Badge color={t.status==="Active"?"green":"gray"}><Dot color={t.status==="Active"?"green":"gray"}/>{t.status}</Badge>
              </button>
            </div>
            <div className="col-span-1 text-[11px] text-[#94a3b8]">{t.updated}</div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              {[
                {icon:<Eye size={12}/>,   action:()=>setPreviewTpl(t),  tip:"Preview", cls:"hover:text-[#f18200]"},
                {icon:<Edit2 size={12}/>, action:()=>setEditTpl(t),     tip:"Edit",    cls:"hover:text-[#f18200]"},
                {icon:<Copy size={12}/>,  action:()=>handleClone(t),    tip:"Clone",   cls:"hover:text-indigo-500"},
                {icon:<Trash2 size={12}/>,action:()=>setConfirm(t),     tip:"Delete",  cls:"hover:text-red-500"},
              ].map((a,i)=>(
                <button key={i} title={a.tip} onClick={a.action}
                  className={`w-7 h-7 rounded flex items-center justify-center hover:bg-[#f1f5f9] text-[#94a3b8] ${a.cls} transition-colors`}>
                  {a.icon}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between border-t border-[#f8fafc]">
          <p className="text-[12px] text-[#94a3b8]">
            {filtered.length} template{filtered.length!==1?"s":""} · Showing {Math.min((page-1)*PER+1,filtered.length)}–{Math.min(page*PER,filtered.length)}
          </p>
          <Pagination page={page} totalPages={totalPages} onPage={setPage}/>
        </div>
      </div>
    </>
  );
}
