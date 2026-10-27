import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Award, BarChart3, Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { getErrorMessage } from "../../../api/client";
import {
  createKfCategory,
  deleteKfCategory,
  listKfCategories,
  listKudos,
  updateKfCategory } from
"../../../api/kudosFeedback.api";
import {
  EmptyState,
  FeedbackReport,
  GiveKudosModal,
  KudosItem,
  Loading,
  PrimaryButton,
  SecondaryButton,
  Tabs } from
"../../employee/worklife/kudosFeedbackShared";
const COLORS = ["#f18200", "#16a34a", "#1d4ed8", "#7c3aed", "#0e7490", "#db2777", "#64748b"];
const EMPTY_FORM = { category_name: "", description: "", color: COLORS[0], category_type: "kudos", is_active: true };
const CategoryForm = ({ editing, type, onSaved, onCancel }) => {
  const [form, setForm] = useState(editing ? { ...editing, is_active: Boolean(editing.is_active) } : { ...EMPTY_FORM, category_type: type });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm(editing ? { ...editing, is_active: Boolean(editing.is_active) } : { ...EMPTY_FORM, category_type: type });
  }, [editing, type]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const submit = async (e) => {
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
      if (editing) await updateKfCategory(editing.category_id, payload);else
      await createKfCategory(payload);
      toast.success(editing ? "Category updated" : "Category added");
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save category"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <h2 className="text-base font-bold text-slate-900">{editing ? "Edit category" : "Add category"}</h2>
      <div>
        <label htmlFor="cat-name" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
        <input id="cat-name" value={form.category_name} onChange={set("category_name")} maxLength={60} placeholder="e.g. Going the extra mile" className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-[#f18200]" />
      </div>
      <div>
        <label htmlFor="cat-desc" className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
        <textarea id="cat-desc" value={form.description || ""} onChange={set("description")} rows={2} maxLength={255} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f18200] resize-none" />
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
          {COLORS.map((c) =>
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            aria-pressed={form.color === c}
            onClick={() => setForm((f) => ({ ...f, color: c }))}
            className={`w-8 h-8 rounded-full ${form.color === c ? "ring-2 ring-offset-2 ring-slate-800" : ""}`}
            style={{ background: c }} />
          )}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="w-4 h-4 accent-[#f18200]" /> Active
      </label>
      <div className="flex gap-2">
        {editing && <SecondaryButton type="button" onClick={onCancel} className="flex-1">Cancel</SecondaryButton>}
        <PrimaryButton type="submit" disabled={saving} className="flex-1">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editing ? "Save changes" : "Add category"}
        </PrimaryButton>
      </div>
    </form>);
};
const CategoriesTab = () => {
  const [type, setType] = useState("kudos");
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const load = useCallback(() => {
    listKfCategories({ all: 1 }).then(setRows).catch((err) => {
      toast.error(getErrorMessage(err, "Could not load categories"));
      setRows([]);
    });
  }, []);
  useEffect(() => {load();}, [load]);
  const remove = async (c) => {
    const used = Number(c.usage_count);
    const msg = used ?
    `"${c.category_name}" is used ${used} time(s). Deleting it keeps those entries but removes their category. Delete anyway?\n\nTip: mark it inactive instead to hide it from new kudos.` :
    `Delete "${c.category_name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await deleteKfCategory(c.category_id);
      toast.success("Category deleted");
      if (editing?.category_id === c.category_id) setEditing(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete category"));
    }
  };
  const visible = (rows || []).filter((c) => c.category_type === type);
  const counts = { kudos: 0, feedback: 0 };
  (rows || []).forEach((c) => {counts[c.category_type] += 1;});
  return (
    <div className="space-y-4">
      <Tabs
        label="Category type"
        active={type}
        onChange={(t) => {setType(t);setEditing(null);}}
        tabs={[{ key: "kudos", label: `Kudos · ${counts.kudos}` }, { key: "feedback", label: `Feedback · ${counts.feedback}` }]} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {rows === null ? <Loading /> :
          visible.length === 0 ?
          <EmptyState icon={<Tag className="text-[#f18200]" />} title="No categories yet" text="Add the first one using the form." /> :
          <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 text-left">
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Description</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Used</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) =>
              <tr key={c.category_id} className={`border-t border-slate-50 ${editing?.category_id === c.category_id ? "bg-orange-50/40" : ""}`}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="w-3 h-3 rounded" style={{ background: c.color }} />{c.category_name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{c.description || "–"}</td>
                    <td className="px-3 py-3 font-bold">{c.usage_count}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(c)} aria-label={`Edit ${c.category_name}`} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"><Pencil size={15} /></button>
                        <button onClick={() => remove(c)} aria-label={`Delete ${c.category_name}`} className="w-9 h-9 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-600"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          }
        </section>
        <CategoryForm
          editing={editing}
          type={type}
          onCancel={() => setEditing(null)}
          onSaved={() => {setEditing(null);load();}} />
      </div>
    </div>);
};
const WallTab = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listKudos({ scope: "wall", page, limit: 20 });
      setRows((prev) => page === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load kudos"));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {load(1);}, [load]);
  if (loading && !rows.length) return <Loading />;
  if (!rows.length) return <EmptyState icon={<Award className="text-[#f18200]" />} title="No kudos yet" />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">All kudos across the organisation, including private ones ({meta?.total}).</p>
      {rows.map((k) => <KudosItem key={k.kudos_id} k={k} perspective="wall" />)}
      {meta && meta.page < meta.totalPages &&
      <div className="flex justify-center pt-2"><SecondaryButton onClick={() => load(meta.page + 1)} disabled={loading}>Load more</SecondaryButton></div>
      }
    </div>);
};
const AdminKudosFeedback = () => {
  const [tab, setTab] = useState("overview");
  const [kudosFor, setKudosFor] = useState(null);
  return (
    <div className="space-y-6">
      {kudosFor && <GiveKudosModal preset={[kudosFor]} onClose={() => setKudosFor(null)} />}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kudos &amp; Feedback</h1>
        <p className="text-slate-500 mt-1 text-sm">Organisation-wide recognition, feedback trends and category setup.</p>
      </div>
      <Tabs
        label="Kudos and feedback admin"
        active={tab}
        onChange={setTab}
        tabs={[
        { key: "overview", label: "Reports" },
        { key: "wall", label: "Kudos Wall" },
        { key: "categories", label: "Manage Categories" }]
        } />
      {tab === "overview" &&
      <>
          <p className="text-sm text-slate-500 flex items-center gap-2"><BarChart3 size={15} /> Filters apply to every chart and the export.</p>
          <FeedbackReport onGiveKudos={setKudosFor} />
        </>
      }
      {tab === "wall" && <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"><WallTab /></section>}
      {tab === "categories" && <CategoriesTab />}
    </div>);
};
export default AdminKudosFeedback;
