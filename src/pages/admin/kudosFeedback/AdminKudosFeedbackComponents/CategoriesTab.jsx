import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { deleteKfCategory, listKfCategories } from "../../../../api/kudosFeedback.api";
import { EmptyState, Loading, Tabs } from "../../../employee/worklife/kudosFeedbackShared";
import { CategoryForm } from "./CategoryForm";
const CategoriesTab = () => {
  const [type, setType] = useState("kudos");
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const load = useCallback(() => {
    listKfCategories({
      all: 1
    }).then(setRows).catch(err => {
      toast.error(getErrorMessage(err, "Could not load categories"));
      setRows([]);
    });
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const remove = async c => {
    const used = Number(c.usage_count);
    const msg = used ? `"${c.category_name}" is used ${used} time(s). Deleting it keeps those entries but removes their category. Delete anyway?\n\nTip: mark it inactive instead to hide it from new kudos.` : `Delete "${c.category_name}"?`;
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
  const visible = (rows || []).filter(c => c.category_type === type);
  const counts = {
    kudos: 0,
    feedback: 0
  };
  (rows || []).forEach(c => {
    counts[c.category_type] += 1;
  });
  return <div className="space-y-4">
      <Tabs label="Category type" active={type} onChange={t => {
      setType(t);
      setEditing(null);
    }} tabs={[{
      key: "kudos",
      label: `Kudos · ${counts.kudos}`
    }, {
      key: "feedback",
      label: `Feedback · ${counts.feedback}`
    }]} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          {rows === null ? <Loading /> : visible.length === 0 ? <EmptyState icon={<Tag className="text-[#e87500]" />} title="No categories yet" text="Add the first one using the form." /> : <table className="w-full min-w-[600px] text-sm">
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
                {visible.map(c => <tr key={c.category_id} className={`border-t border-slate-50 ${editing?.category_id === c.category_id ? "bg-orange-50/40" : ""}`}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="w-3 h-3 rounded" style={{
                    background: c.color
                  }} />{c.category_name}
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
                  </tr>)}
              </tbody>
            </table>}
        </section>
        <CategoryForm editing={editing} type={type} onCancel={() => setEditing(null)} onSaved={() => {
        setEditing(null);
        load();
      }} />
      </div>
    </div>;
};
export { CategoriesTab };
