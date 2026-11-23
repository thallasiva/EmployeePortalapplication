import React, { useState } from "react";
import Button from "../../../../components/ui/Button";
import { createAssetMaintenance, listAssetMaintenance, listAssets, updateAssetMaintenance } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, dateLabel, usePageData } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
import { Status } from "./Status";
function AssetMaintenance() {
  const {
    rows,
    loading,
    error,
    refresh
  } = usePageData(listAssetMaintenance);
  const {
    rows: assets,
    refresh: refreshAssets
  } = usePageData(listAssets);
  const [form, setForm] = useState({
    asset_id: "",
    issue: "",
    priority: "Medium"
  });
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const create = async event => {
    event.preventDefault();
    setSaving("create");
    setNotice("");
    try {
      await createAssetMaintenance({
        ...form,
        asset_id: Number(form.asset_id)
      });
      setForm({
        asset_id: "",
        issue: "",
        priority: "Medium"
      });
      setNotice("Maintenance record opened.");
      await Promise.all([refresh(), refreshAssets()]);
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to create maintenance record."));
    } finally {
      setSaving(null);
    }
  };
  const update = async (row, status) => {
    setSaving(row.maintenance_id);
    setNotice("");
    try {
      await updateAssetMaintenance(row.maintenance_id, {
        status,
        resolution_notes: notes[row.maintenance_id] || ""
      });
      setNotice("Maintenance record updated.");
      await Promise.all([refresh(), refreshAssets()]);
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to update maintenance record."));
    } finally {
      setSaving(null);
    }
  };
  return <div className="space-y-5">
    <PageTitle title="Maintenance Management" description="Track repairs and maintenance for company assets." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={`${panelClass} p-5`}><form onSubmit={create} className="grid gap-3 md:grid-cols-[1fr_2fr_160px_auto]">
      <select required className={fieldClass} value={form.asset_id} onChange={e => setForm({
          ...form,
          asset_id: e.target.value
        })}><option value="">Select unassigned asset</option>{assets.filter(asset => ["Available", "Maintenance"].includes(asset.status)).map(asset => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_tag} · {asset.asset_name}</option>)}</select>
      <input required minLength={4} maxLength={1000} className={fieldClass} placeholder="Describe the issue" value={form.issue} onChange={e => setForm({
          ...form,
          issue: e.target.value
        })} />
      <select className={fieldClass} value={form.priority} onChange={e => setForm({
          ...form,
          priority: e.target.value
        })}><option>Low</option><option>Medium</option><option>High</option></select>
      <Button type="submit" loading={saving === "create"}>Open maintenance</Button>
    </form></section>
    <section className={panelClass}>{loading ? <Empty>Loading maintenance records…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Reported</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.maintenance_id}><td className="px-4 py-3 font-medium">{row.asset_tag}<p className="text-xs font-normal text-slate-500">{row.asset_name}</p></td><td className="max-w-60 px-4 py-3">{row.issue}</td><td className="px-4 py-3">{row.priority}</td><td className="px-4 py-3">{dateLabel(row.reported_at)}</td><td className="px-4 py-3"><Status>{row.status}</Status>{row.resolution_notes && <p className="mt-1 max-w-48 text-xs text-slate-500">{row.resolution_notes}</p>}</td><td className="px-4 py-3">{["Open", "In Progress"].includes(row.status) && <div className="flex flex-wrap gap-2"><input aria-label="Resolution notes" maxLength={1000} placeholder="Update notes" value={notes[row.maintenance_id] || ""} onChange={e => setNotes({
                    ...notes,
                    [row.maintenance_id]: e.target.value
                  })} className="w-36 rounded border border-slate-300 px-2 py-1 text-xs" />{row.status === "Open" && <Button size="sm" variant="secondary" disabled={saving === row.maintenance_id} onClick={() => update(row, "In Progress")}>Start</Button>}<Button size="sm" disabled={saving === row.maintenance_id} onClick={() => update(row, "Resolved")}>Resolve</Button><Button size="sm" variant="secondary" disabled={saving === row.maintenance_id} onClick={() => update(row, "Cancelled")}>Cancel</Button></div>}</td></tr>)}{!rows.length && <tr><td colSpan={6}><Empty>No maintenance records.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
export { AssetMaintenance };
