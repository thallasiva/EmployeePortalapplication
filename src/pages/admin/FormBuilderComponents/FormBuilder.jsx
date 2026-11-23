import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, AlignLeft, Check } from "lucide-react";
import { formsApi } from "../../../api/settings.api";
import { BuilderView } from "./BuilderView";
function FormBuilder() {
  const [forms, setForms] = useState([]);
  const [editing, setEditing] = useState(null); // null = list view
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    formsApi.list().then(data => {
      if (Array.isArray(data)) setForms(data.map(form => ({
        ...form,
        assignedRoles: form.assigned_roles || form.assignedRoles || [],
        updated: form.updated_at || form.updated,
        fields: Array.isArray(form.fields) ? form.fields : []
      })));
    }).catch(() => setToast("Unable to load forms from the server.")).finally(() => setLoading(false));
  }, []);
  const handleSave = async data => {
    const payload = {
      ...data,
      fields: Array.isArray(data.fields) ? data.fields : [],
      status: data.published ? "Published" : "Draft",
      published: data.published ?? data.status === "Published",
      assignedRoles: data.assignedRoles || []
    };
    try {
      const saved = payload.id ? await formsApi.update(payload.id, payload) : await formsApi.create(payload);
      const normalized = {
        ...saved,
        assignedRoles: saved.assigned_roles || saved.assignedRoles || payload.assignedRoles,
        updated: saved.updated_at || "Just now",
        fields: Array.isArray(saved.fields) ? saved.fields : payload.fields
      };
      setForms(previous => payload.id ? previous.map(form => Number(form.id) === Number(payload.id) ? normalized : form) : [normalized, ...previous]);
      setEditing(null);
      setToast("Form saved successfully.");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("Unable to save the form. Please try again.");
    }
  };
  if (editing !== null) {
    return <div className="min-h-screen   flex flex-col">
        {toast && <div role="status" className="fixed top-4 right-4 z-50 rounded-xl bg-red-600 px-4 py-3 text-[13px] font-semibold text-white shadow-lg">{toast}</div>}
        <BuilderView form={editing} onBack={() => setEditing(null)} onSave={handleSave} />
      </div>;
  }
  return <div className="min-h-screen  ">
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 text-white px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}>
          <Check size={14} className="inline -mt-0.5" /> {toast}
        </div>}
      {/* Header */}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#e87500]">Form Builder</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">Create and manage custom HR forms with drag-and-drop fields</p>
        </div>
        <button onClick={() => setEditing({
        name: "",
        category: "HR",
        status: "Draft",
        fields: []
      })} className="flex items-center gap-2 h-[38px] px-5 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
          <Plus size={15} /> New Form
        </button>
      </div>
      {/* Summary */}
      <div className="px-6 pb-5 grid grid-cols-4 gap-4">
        {[{
        label: "Total Forms",
        value: forms.length,
        color: "#e87500",
        bg: "#fff8f0"
      }, {
        label: "Published",
        value: forms.filter(f => f.status === "Published").length,
        color: "#10b981",
        bg: "#ecfdf5"
      }, {
        label: "Drafts",
        value: forms.filter(f => f.status === "Draft").length,
        color: "#f59e0b",
        bg: "#fffbeb"
      }, {
        label: "Categories",
        value: [...new Set(forms.map(f => f.category))].length,
        color: "#e87500",
        bg: "#f5f3ff"
      }].map(c => <div key={c.label} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{
          background: c.bg
        }}>
              <AlignLeft size={17} style={{
            color: c.color
          }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{c.label}</p>
              <p className="text-[20px] font-bold" style={{
            color: c.color
          }}>{c.value}</p>
            </div>
          </div>)}
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
          {loading ? <p className="p-8 text-center text-sm text-slate-400">Loading forms…</p> : forms.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No forms created yet.</p> : forms.map(f => <div key={f.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#f8fafc] items-center hover:bg-[#fafbff]">
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
                <button onClick={async () => {
              try {
                const form = await formsApi.get(f.id);
                setEditing({
                  ...form,
                  assignedRoles: form.assigned_roles || form.assignedRoles || [],
                  fields: Array.isArray(form.fields) ? form.fields : []
                });
              } catch {
                setToast("Unable to load the selected form.");
              }
            }} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#e87500]">
                  <Edit2 size={13} />
                </button>
                <button onClick={async () => {
              try {
                await formsApi.delete(f.id);
                setForms(p => p.filter(x => x.id !== f.id));
              } catch {
                setToast("Unable to delete the form.");
              }
            }} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
}
export { FormBuilder };
