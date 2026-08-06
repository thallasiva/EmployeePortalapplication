import React, { useEffect, useState } from "react";
import
  {
    Plus, Eye, Save, Trash2, Edit2, X, GripVertical, Copy,
    Type, Hash, Calendar, List, CheckSquare, Circle, AlignLeft, Upload, Star, ToggleLeft, ChevronDown
  } from "lucide-react";
import { getRolesForSelect } from "../../data/auth";
import { formsApi } from "../../api/settings.api";

const BRAND = "#f18200";

const FIELD_TYPES = [
  { type: "text", label: "Text Input", icon: <Type size={14} />, desc: "Single line text" },
  { type: "number", label: "Number", icon: <Hash size={14} />, desc: "Numeric input" },
  { type: "date", label: "Date", icon: <Calendar size={14} />, desc: "Date picker" },
  { type: "select", label: "Dropdown", icon: <List size={14} />, desc: "Select from list" },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare size={14} />, desc: "Multiple choice" },
  { type: "radio", label: "Radio Group", icon: <Circle size={14} />, desc: "Single choice" },
  { type: "textarea", label: "Long Text", icon: <AlignLeft size={14} />, desc: "Multi-line text" },
  { type: "file", label: "File Upload", icon: <Upload size={14} />, desc: "Upload files" },
  { type: "rating", label: "Rating", icon: <Star size={14} />, desc: "1–5 star rating" },
  { type: "toggle", label: "Yes/No", icon: <ToggleLeft size={14} />, desc: "Boolean toggle" },
];

const CATS = ["HR", "Payroll", "Leave", "Attendance", "Performance", "Recruitment", "General"];

const SEED_FORMS = [
  { id: 1, name: "Employee Onboarding Form", fields: 8, category: "HR", status: "Published", published: true, assignedRoles: [1, 2, 3], updated: "01 Aug 2026" },
  { id: 2, name: "Leave Request Form", fields: 5, category: "Leave", status: "Published", published: true, assignedRoles: [1, 2, 3, 4, 5], updated: "29 Jul 2026" },
  { id: 3, name: "Performance Review Form", fields: 12, category: "Performance", status: "Draft", published: false, assignedRoles: [1, 3], updated: "28 Jul 2026" },
  { id: 4, name: "Expense Claim Form", fields: 7, category: "General", status: "Published", published: true, assignedRoles: [1, 2, 4], updated: "25 Jul 2026" },
];

let _nextId = 100;
const newField = (type) =>
{
  const def = FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];
  return {
    id: _nextId++,
    type,
    label: def.label,
    placeholder: "",
    required: false,
    options: ["checkbox", "radio", "select"].includes(type) ? ["Option 1", "Option 2"] : [],
  };
};

/* ── Field edit panel ── */
function FieldEditor({ field, onChange, onDelete })
{
  return (
    <div className="bg-[#fff8f0] border border-[#fed7aa] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#f18200] uppercase tracking-wide">Editing: {field.type}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Label</label>
        <input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })}
          className="w-full h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] outline-none focus:border-[#f18200]" />
      </div>
      {["text", "number", "textarea"].includes(field.type) && (
        <div>
          <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Placeholder</label>
          <input value={field.placeholder} onChange={e => onChange({ ...field, placeholder: e.target.value })}
            className="w-full h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] outline-none focus:border-[#f18200]" />
        </div>
      )}
      {["checkbox", "radio", "select"].includes(field.type) && (
        <div>
          <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Options (one per line)</label>
          <textarea rows={3} value={field.options.join("\n")}
            onChange={e => onChange({ ...field, options: e.target.value.split("\n").filter(Boolean) })}
            className="w-full border border-[#e2e8f0] rounded-lg p-2 text-[12px] outline-none focus:border-[#f18200] resize-none" />
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={field.required} onChange={e => onChange({ ...field, required: e.target.checked })}
          className="accent-[#f18200]" />
        <span className="text-[12px] text-[#374151]">Required field</span>
      </label>
    </div>
  );
}

/* ── Field preview ── */
function FieldPreview({ field })
{
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-semibold text-[#374151]">
        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {field.type === "text" && <input placeholder={field.placeholder || "Enter text…"} className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white" />}
      {field.type === "number" && <input type="number" placeholder={field.placeholder || "0"} className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white" />}
      {field.type === "date" && <input type="date" className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white" />}
      {field.type === "textarea" && <textarea rows={2} placeholder={field.placeholder || "Enter text…"} className="w-full border border-[#e2e8f0] rounded-lg p-2 text-[12px] bg-white resize-none" />}
      {field.type === "file" && <div className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-4 text-center text-[11px] text-[#94a3b8] bg-white">Click to upload or drag and drop</div>}
      {field.type === "rating" && <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={20} className="text-[#e2e8f0]" />)}</div>}
      {field.type === "toggle" && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-5 bg-[#e2e8f0] rounded-full" />
          <span className="text-[12px] text-[#94a3b8]">No</span>
        </div>
      )}
      {field.type === "select" && (
        <div className="relative">
          <select className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white appearance-none">
            <option>Select…</option>
            {field.options.map(o => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        </div>
      )}
      {field.type === "checkbox" && <div className="space-y-1">{field.options.map(o => (
        <label key={o} className="flex items-center gap-2 text-[12px] text-[#374151]"><input type="checkbox" className="accent-[#f18200]" />{o}</label>
      ))}</div>}
      {field.type === "radio" && <div className="space-y-1">{field.options.map(o => (
        <label key={o} className="flex items-center gap-2 text-[12px] text-[#374151]"><input type="radio" className="accent-[#f18200]" />{o}</label>
      ))}</div>}
    </div>
  );
}

/* ── Builder view ── */
function BuilderView({ form, onBack, onSave })
{
  const [fields, setFields] = useState(Array.isArray(form.fields) ? form.fields : []);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("build"); // build | preview
  const [meta, setMeta] = useState({
    name: form.name || "",
    category: form.category || "HR",
    status: form.status || "Draft",
    published: form.published ?? form.status === "Published",
    assignedRoles: form.assignedRoles ?? []
  });

  useEffect(() => {
    setMeta({
      name: form.name || "",
      category: form.category || "HR",
      status: form.status || "Draft",
      published: form.published ?? form.status === "Published",
      assignedRoles: form.assignedRoles ?? []
    });
  }, [form]);

  const addField = (type) =>
  {
    const f = newField(type);
    setFields(p => [...p, f]);
    setSelected(f.id);
  };

  const updateField = (updated) => setFields(p => p.map(f => f.id === updated.id ? updated : f));
  const deleteField = (id) => { setFields(p => p.filter(f => f.id !== id)); setSelected(null); };
  const cloneField = (f) => { const c = { ...f, id: _nextId++ }; setFields(p => [...p, c]); setSelected(c.id); };

  const roleOptions = getRolesForSelect();
  const selField = fields.find(f => f.id === selected);

  return (
    <div className="flex flex-col h-full">
      {/* Builder toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#f18200] text-[12px] font-semibold">← Forms</button>
        <div className="w-px h-5 bg-[#e2e8f0]" />
        <input value={meta.name} onChange={e => setMeta(p => ({ ...p, name: e.target.value }))}
          placeholder="Form name…"
          className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] font-bold outline-none focus:border-[#f18200] w-56" />
        <div className="relative">
          <select value={meta.category} onChange={e => setMeta(p => ({ ...p, category: e.target.value }))}
            className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 pr-7 text-[12px] appearance-none outline-none focus:border-[#f18200]">
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setMode(m => m === "build" ? "preview" : "build")}
            className={`flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[12px] font-semibold border transition-all ${mode === "preview" ? "bg-[#f18200] text-white border-[#f18200]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#f18200]/40"}`}>
            <Eye size={13} /> {mode === "build" ? "Preview" : "Edit"}
          </button>
          <button onClick={() => onSave({ ...meta, fields, updated: "Now" })}
            className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[12px] font-bold transition-colors">
            <Save size={13} /> Save Form
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: field palette */}
        {mode === "build" && (
          <div className="w-52 bg-white border-r border-[#e2e8f0] overflow-y-auto shrink-0">
            <p className="px-4 pt-4 pb-2 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Add Fields</p>
            <div className="px-3 pb-4 space-y-1">
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={() => addField(ft.type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#fff8f0] hover:text-[#f18200] text-left transition-colors group">
                  <span className="text-[#94a3b8] group-hover:text-[#f18200] transition-colors">{ft.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold text-[#374151] group-hover:text-[#f18200]">{ft.label}</p>
                    <p className="text-[10px] text-[#94a3b8]">{ft.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center: form canvas */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4">
            <div className="border-b border-[#f1f5f9] pb-4">
              <h3 className="text-[16px] font-bold text-[#1e293b]">{meta.name || "Untitled Form"}</h3>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">{meta.category} · {fields.length} fields</p>
            </div>
            {fields.length === 0 && (
              <div className="py-16 text-center">
                <Plus size={32} className="text-[#e2e8f0] mx-auto mb-2" />
                <p className="text-[#94a3b8] text-[13px]">Click a field type on the left to add it here</p>
              </div>
            )}
            {fields.map(f => (
              <div key={f.id}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${selected === f.id && mode === "build" ? "border-[#f18200] bg-[#fff8f0]" : "border-transparent hover:border-[#f18200]/30 hover:bg-[#fafafa]"}`}
                onClick={() => mode === "build" && setSelected(f.id)}>
                <FieldPreview field={f} />
                {mode === "build" && selected === f.id && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={e => { e.stopPropagation(); cloneField(f) }} className="w-6 h-6 rounded flex items-center justify-center bg-white border border-[#e2e8f0] text-[#94a3b8] hover:text-[#f18200]"><Copy size={10} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteField(f.id) }} className="w-6 h-6 rounded flex items-center justify-center bg-white border border-[#e2e8f0] text-[#94a3b8] hover:text-red-500"><Trash2 size={10} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: field editor and settings */}
        {mode === "build" && (
          <div className="w-72 bg-white border-l border-[#e2e8f0] overflow-y-auto shrink-0 p-4">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Field Properties</p>
            {selField ? (
              <FieldEditor field={selField} onChange={updateField} onDelete={() => deleteField(selField.id)} />
            ) : (
              <p className="text-[12px] text-[#94a3b8] text-center py-8">Select a field to edit its properties</p>
            )}

            <div className="mt-6 pt-4 border-t border-[#e2e8f0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Form Settings</p>
                <label className="inline-flex items-center gap-2 text-[12px] text-[#374151]">
                  <input type="checkbox" checked={meta.published} onChange={e => setMeta(p => ({ ...p, published: e.target.checked, status: e.target.checked ? "Published" : "Draft" }))}
                    className="accent-[#f18200]" />
                  Publish
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Assign To Roles</p>
                <div className="grid grid-cols-1 gap-2">
                  {roleOptions.map((role) => (
                    <label key={role.id} className="inline-flex items-center gap-2 text-[12px] text-[#374151]">
                      <input type="checkbox" checked={meta.assignedRoles.includes(role.id)}
                        onChange={() => setMeta((p) => ({
                          ...p,
                          assignedRoles: p.assignedRoles.includes(role.id)
                            ? p.assignedRoles.filter((id) => id !== role.id)
                            : [...p.assignedRoles, role.id]
                        }))}
                        className="accent-[#f18200]" />
                      {role.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function FormBuilder()
{
  const [forms, setForms] = useState(SEED_FORMS);
  const [editing, setEditing] = useState(null); // null = list view
  const [toast, setToast] = useState("");

  useEffect(() => {
    formsApi.list().then(data => {
      if (Array.isArray(data) && data.length > 0) setForms(data);
    }).catch(() => {});
  }, []);

  const handleSave = (data) =>
  {
    const payload = {
      ...data,
      id: data.id || Date.now(),
      fields: Array.isArray(data.fields) ? data.fields : [],
      status: data.published ? "Published" : "Draft",
      published: data.published ?? data.status === "Published",
      assignedRoles: data.assignedRoles || []
    };

    setForms((p) => p.find((f) => f.id === payload.id)
      ? p.map((f) => (f.id === payload.id ? { ...f, ...payload } : f))
      : [...p, payload]
    );
    setEditing(null);
    setToast("Form saved successfully!");
    setTimeout(() => setToast(""), 3000);
  };

  if (editing !== null)
  {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
        <BuilderView form={editing} onBack={() => setEditing(null)} onSave={handleSave} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1e293b]">Form Builder</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">Create and manage custom HR forms with drag-and-drop fields</p>
        </div>
        <button onClick={() => setEditing({ name: "", category: "HR", status: "Draft", fields: [] })}
          className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
          <Plus size={15} /> New Form
        </button>
      </div>

      {/* Summary */}
      <div className="px-6 pb-5 grid grid-cols-4 gap-4">
        {[
          { label: "Total Forms", value: forms.length, color: "#f18200", bg: "#fff8f0" },
          { label: "Published", value: forms.filter(f => f.status === "Published").length, color: "#10b981", bg: "#ecfdf5" },
          { label: "Drafts", value: forms.filter(f => f.status === "Draft").length, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Categories", value: [...new Set(forms.map(f => f.category))].length, color: "#6366f1", bg: "#f5f3ff" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: c.bg }}>
              <AlignLeft size={17} style={{ color: c.color }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{c.label}</p>
              <p className="text-[20px] font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Forms list */}
      <div className="px-6 pb-10">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
            <span className="col-span-4">Form Name</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-2 text-center">Fields</span>
            <span className="col-span-2 text-center">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {forms.map(f => (
            <div key={f.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#f8fafc] items-center hover:bg-[#fafbff]">
              <div className="col-span-4">
                <p className="text-[13px] font-semibold text-[#1e293b]">{f.name}</p>
                <p className="text-[11px] text-[#94a3b8]">Updated {f.updated}</p>
              </div>
              <div className="col-span-2">
                <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#64748b] rounded-full text-[11px] font-semibold">{f.category}</span>
              </div>
              <div className="col-span-2 text-center text-[13px] font-semibold text-[#374151]">
                {typeof f.fields === "number" ? f.fields : f.fields?.length || 0}
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${f.status === "Published" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                  {f.status}
                </span>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => setEditing(f)} title="Edit"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#f18200]">
                  <Edit2 size={13} />
                </button>
                <button onClick={async () => { try { await formsApi.delete(f.id); } catch {} setForms(p => p.filter(x => x.id !== f.id)); }} title="Delete"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
