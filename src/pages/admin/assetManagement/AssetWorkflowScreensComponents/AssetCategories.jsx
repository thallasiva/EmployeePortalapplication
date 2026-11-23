import React, { useState } from "react";
import Button from "../../../../components/ui/Button";
import { saveAssetCategory } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, listAllAssetCategories, usePageData } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
import { Status } from "./Status";
function AssetCategories() {
  const {
    rows,
    loading,
    error,
    refresh
  } = usePageData(listAllAssetCategories);
  const [form, setForm] = useState({
    category_name: "",
    description: "",
    icon: ""
  });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      await saveAssetCategory(form, editing?.category_id);
      setNotice(editing ? "Category updated." : "Category created.");
      setForm({
        category_name: "",
        description: "",
        icon: ""
      });
      setEditing(null);
      await refresh();
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to save category."));
    } finally {
      setSaving(false);
    }
  };
  const edit = row => {
    setEditing(row);
    setForm({
      category_name: row.category_name,
      description: row.description || "",
      icon: row.icon || ""
    });
  };
  const toggle = async row => {
    setSaving(true);
    setNotice("");
    try {
      await saveAssetCategory({
        category_name: row.category_name,
        description: row.description,
        icon: row.icon,
        is_active: !Boolean(row.is_active)
      }, row.category_id);
      setNotice(row.is_active ? "Category deactivated." : "Category activated.");
      await refresh();
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to update category."));
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Categories" description="Organize assets into categories for consistent inventory and reporting." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={`${panelClass} p-5`}><h3 className="mb-4 font-semibold text-slate-800">{editing ? "Edit category" : "Add category"}</h3>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
        <input required maxLength={100} className={fieldClass} placeholder="Category name" value={form.category_name} onChange={e => setForm({
          ...form,
          category_name: e.target.value
        })} />
        <input maxLength={255} className={fieldClass} placeholder="Description" value={form.description} onChange={e => setForm({
          ...form,
          description: e.target.value
        })} />
        <input maxLength={40} className={fieldClass} placeholder="Icon name (optional)" value={form.icon} onChange={e => setForm({
          ...form,
          icon: e.target.value
        })} />
        <div className="flex gap-2"><Button type="submit" loading={saving}>{editing ? "Save changes" : "Add category"}</Button>{editing && <Button type="button" variant="secondary" onClick={() => {
            setEditing(null);
            setForm({
              category_name: "",
              description: "",
              icon: ""
            });
          }}>Cancel</Button>}</div>
      </form>
    </section>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Company categories</h3></div>{loading ? <Empty>Loading categories…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Category name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Assets</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.category_id}><td className="px-4 py-3 font-medium">{row.category_name}</td><td className="px-4 py-3 text-slate-500">{row.description || "—"}</td><td className="px-4 py-3">{row.asset_count}</td><td className="px-4 py-3"><Status>{row.is_active ? "Active" : "Inactive"}</Status></td><td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => edit(row)}>Edit</Button><Button size="sm" variant="secondary" disabled={saving} onClick={() => toggle(row)}>{row.is_active ? "Deactivate" : "Activate"}</Button></div></td></tr>)}{!rows.length && <tr><td colSpan={5}><Empty>No categories created.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
export { AssetCategories };
