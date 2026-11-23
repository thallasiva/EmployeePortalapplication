import React, { useEffect, useState } from "react";
import { Plus, Eye, Save, Trash2, Copy, ChevronDown, ArrowLeft } from "lucide-react";
import { getRolesForSelect } from "../../../data/auth";
import { FIELD_TYPES } from "./FIELD_TYPES";
import { CATS, _nextId, newField } from "./shared";
import { FieldEditor } from "./FieldEditor";
import { FieldPreview } from "./FieldPreview";
/* ── Builder view ── */
function BuilderView({
  form,
  onBack,
  onSave
}) {
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
  const addField = type => {
    const f = newField(type);
    setFields(p => [...p, f]);
    setSelected(f.id);
  };
  const updateField = updated => setFields(p => p.map(f => f.id === updated.id ? updated : f));
  const deleteField = id => {
    setFields(p => p.filter(f => f.id !== id));
    setSelected(null);
  };
  const cloneField = f => {
    const c = {
      ...f,
      id: _nextId++
    };
    setFields(p => [...p, c]);
    setSelected(c.id);
  };
  const roleOptions = getRolesForSelect();
  const selField = fields.find(f => f.id === selected);
  return <div className="flex flex-col h-full">
      {/* Builder toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#e87500] text-[12px] font-semibold inline-flex items-center gap-1"><ArrowLeft size={12} /> Forms</button>
        <div className="w-px h-5 bg-[#e2e8f0]" />
        <input value={meta.name} onChange={e => setMeta(p => ({
        ...p,
        name: e.target.value
      }))} placeholder="Form name…" className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] font-bold outline-none focus:border-[#e87500] w-56" />
        <div className="relative">
          <select value={meta.category} onChange={e => setMeta(p => ({
          ...p,
          category: e.target.value
        }))} className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 pr-7 text-[12px] appearance-none outline-none focus:border-[#e87500]">
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setMode(m => m === "build" ? "preview" : "build")} className={`flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[12px] font-semibold border transition-all ${mode === "preview" ? "bg-[#e87500] text-white border-[#e87500]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#e87500]/40"}`}>
            <Eye size={13} /> {mode === "build" ? "Preview" : "Edit"}
          </button>
          <button onClick={() => onSave({
          ...meta,
          fields,
          updated: "Now"
        })} className="flex items-center gap-1.5 h-[34px] px-4 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[12px] font-bold transition-colors">
            <Save size={13} /> Save Form
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Left: field palette */}
        {mode === "build" && <div className="w-52 bg-white border-r border-[#e2e8f0] overflow-y-auto shrink-0">
            <p className="px-4 pt-4 pb-2 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Add Fields</p>
            <div className="px-3 pb-4 space-y-1">
              {FIELD_TYPES.map(ft => <button key={ft.type} onClick={() => addField(ft.type)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#fff8f0] hover:text-[#e87500] text-left transition-colors group">
                  <span className="text-[#94a3b8] group-hover:text-[#e87500] transition-colors">{ft.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold text-[#374151] group-hover:text-[#e87500]">{ft.label}</p>
                    <p className="text-[10px] text-[#94a3b8]">{ft.desc}</p>
                  </div>
                </button>)}
            </div>
          </div>}
        {/* Center: form canvas */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-4">
            <div className="border-b border-[#f1f5f9] pb-4">
              <h3 className="text-[16px] font-bold text-[#e87500]">{meta.name || "Untitled Form"}</h3>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">{meta.category} · {fields.length} fields</p>
            </div>
            {fields.length === 0 && <div className="py-16 text-center">
                <Plus size={32} className="text-[#e2e8f0] mx-auto mb-2" />
                <p className="text-[#94a3b8] text-[13px]">Click a field type on the left to add it here</p>
              </div>}
            {fields.map(f => <div key={f.id} className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${selected === f.id && mode === "build" ? "border-[#e87500] bg-[#fff8f0]" : "border-transparent hover:border-[#e87500]/30 hover:bg-[#fafafa]"}`} onClick={() => mode === "build" && setSelected(f.id)}>
                <FieldPreview field={f} />
                {mode === "build" && selected === f.id && <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={e => {
                e.stopPropagation();
                cloneField(f);
              }} className="w-6 h-6 rounded flex items-center justify-center bg-white border border-[#e2e8f0] text-[#94a3b8] hover:text-[#e87500]"><Copy size={10} /></button>
                    <button onClick={e => {
                e.stopPropagation();
                deleteField(f.id);
              }} className="w-6 h-6 rounded flex items-center justify-center bg-white border border-[#e2e8f0] text-[#94a3b8] hover:text-red-500"><Trash2 size={10} /></button>
                  </div>}
              </div>)}
          </div>
        </div>
        {/* Right: field editor and settings */}
        {mode === "build" && <div className="w-72 bg-white border-l border-[#e2e8f0] overflow-y-auto shrink-0 p-4">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Field Properties</p>
            {selField ? <FieldEditor field={selField} onChange={updateField} onDelete={() => deleteField(selField.id)} /> : <p className="text-[12px] text-[#94a3b8] text-center py-8">Select a field to edit its properties</p>}
            <div className="mt-6 pt-4 border-t border-[#e2e8f0]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Form Settings</p>
                <label className="inline-flex items-center gap-2 text-[12px] text-[#374151]">
                  <input type="checkbox" checked={meta.published} onChange={e => setMeta(p => ({
                ...p,
                published: e.target.checked,
                status: e.target.checked ? "Published" : "Draft"
              }))} className="accent-[#e87500]" />
                  Publish
                </label>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Assign To Roles</p>
                <div className="grid grid-cols-1 gap-2">
                  {roleOptions.map(role => <label key={role.id} className="inline-flex items-center gap-2 text-[12px] text-[#374151]">
                      <input type="checkbox" checked={meta.assignedRoles.includes(role.id)} onChange={() => setMeta(p => ({
                  ...p,
                  assignedRoles: p.assignedRoles.includes(role.id) ? p.assignedRoles.filter(id => id !== role.id) : [...p.assignedRoles, role.id]
                }))} className="accent-[#e87500]" />
                      {role.label}
                    </label>)}
                </div>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}
/* ── Main page ── */
export { BuilderView };
