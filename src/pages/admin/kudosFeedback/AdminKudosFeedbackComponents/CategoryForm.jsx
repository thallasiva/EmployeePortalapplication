import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Plus } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { createKfCategory, updateKfCategory } from "../../../../api/kudosFeedback.api";
import { PrimaryButton, SecondaryButton } from "../../../employee/worklife/kudosFeedbackShared";
import { COLORS, EMPTY_FORM } from "./shared";
const CategoryForm = ({
  editing,
  type,
  onSaved,
  onCancel
}) => {
  const [form, setForm] = useState(editing ? {
    ...editing,
    is_active: Boolean(editing.is_active)
  } : {
    ...EMPTY_FORM,
    category_type: type
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm(editing ? {
      ...editing,
      is_active: Boolean(editing.is_active)
    } : {
      ...EMPTY_FORM,
      category_type: type
    });
  }, [editing, type]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value
  }));
  const submit = async e => {
    e.preventDefault();
    if (form.category_name.trim().length < 2) return toast.error("Enter a category name");
    const payload = {
      category_name: form.category_name.trim(),
      description: form.description?.trim() || null,
      color: form.color,
      category_type: form.category_type,
      is_active: form.is_active
    };
    setSaving(true);
    try {
      if (editing) await updateKfCategory(editing.category_id, payload);else await createKfCategory(payload);
      toast.success(editing ? "Category updated" : "Category added");
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save category"));
    } finally {
      setSaving(false);
    }
  };
  return <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <h2 className="text-base font-bold  text-[#e87500]">{editing ? "Edit category" : "Add category"}</h2>
      <div>
        <label htmlFor="cat-name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
        <input id="cat-name" value={form.category_name} onChange={set("category_name")} maxLength={60} placeholder="e.g. Going the extra mile" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-[#e87500]" />
      </div>
      <div>
        <label htmlFor="cat-desc" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
        <textarea id="cat-desc" value={form.description || ""} onChange={set("description")} rows={2} maxLength={255} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#e87500] resize-none" />
      </div>
      <div>
        <label htmlFor="cat-type" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Used for</label>
        <select id="cat-type" value={form.category_type} onChange={set("category_type")} className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm bg-white">
          <option value="kudos">Kudos</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>
      <fieldset>
        <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Colour</legend>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={form.color === c} onClick={() => setForm(f => ({
          ...f,
          color: c
        }))} className={`w-8 h-8 rounded-full ${form.color === c ? "ring-2 ring-offset-2 ring-slate-800" : ""}`} style={{
          background: c
        }} />)}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="w-4 h-4 accent-[#e87500]" /> Active
      </label>
      <div className="flex gap-2">
        {editing && <SecondaryButton type="button" onClick={onCancel} className="flex-1">Cancel</SecondaryButton>}
        <PrimaryButton type="submit" disabled={saving} className="flex-1">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editing ? "Save changes" : "Add category"}
        </PrimaryButton>
      </div>
    </form>;
};
export { CategoryForm };
