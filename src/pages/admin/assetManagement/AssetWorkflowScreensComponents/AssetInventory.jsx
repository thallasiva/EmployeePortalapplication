import React, { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { createAsset, listAssets, updateAssetStatus } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, blankAsset, listActiveAssetCategories, downloadCsv, usePageData } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
import { Status } from "./Status";
import { FilterSearch } from "./FilterSearch";
function AssetInventory() {
  const {
    rows: assets,
    loading,
    error,
    refresh
  } = usePageData(listAssets);
  const {
    rows: categories
  } = usePageData(listActiveAssetCategories);
  const [form, setForm] = useState(blankAsset);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => assets.filter(asset => (status === "All" || asset.status === status) && `${asset.asset_tag} ${asset.asset_name} ${asset.category || ""} ${asset.location || ""} ${asset.employee_name || ""}`.toLowerCase().includes(search.toLowerCase())), [assets, status, search]);
  const add = async event => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      await createAsset({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        purchase_date: form.purchase_date || null
      });
      setForm(blankAsset);
      setNotice("Asset added to inventory.");
      await refresh();
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to add asset."));
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = async (asset, next) => {
    setSaving(true);
    setNotice("");
    try {
      await updateAssetStatus(asset.asset_id, next);
      setNotice("Asset status updated.");
      await refresh();
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to update asset status."));
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Inventory" description="View and manage company assets." action={<Button type="button" icon={<Download size={15} />} onClick={() => downloadCsv("asset-inventory.csv", filtered)}>Export CSV</Button>} />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={`${panelClass} p-5`}>
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Plus size={17} /> Add asset</h3>
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input required maxLength={80} className={fieldClass} placeholder="Asset tag *" value={form.asset_tag} onChange={e => setForm({
          ...form,
          asset_tag: e.target.value
        })} />
        <input required maxLength={160} className={fieldClass} placeholder="Asset name *" value={form.asset_name} onChange={e => setForm({
          ...form,
          asset_name: e.target.value
        })} />
        <select className={fieldClass} value={form.category_id} onChange={e => setForm({
          ...form,
          category_id: e.target.value
        })}><option value="">Select category</option>{categories.map(category => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</select>
        <input maxLength={120} className={fieldClass} placeholder="Serial number" value={form.serial_number} onChange={e => setForm({
          ...form,
          serial_number: e.target.value
        })} />
        <input maxLength={120} className={fieldClass} placeholder="Location" value={form.location} onChange={e => setForm({
          ...form,
          location: e.target.value
        })} />
        <label className="text-xs text-slate-500">Purchase date<input type="date" className={`${fieldClass} mt-1`} value={form.purchase_date} onChange={e => setForm({
            ...form,
            purchase_date: e.target.value
          })} /></label>
        <input maxLength={500} className={fieldClass} placeholder="Notes" value={form.notes} onChange={e => setForm({
          ...form,
          notes: e.target.value
        })} />
        <div className="flex items-end"><Button type="submit" loading={saving}>Add asset</Button></div>
      </form>
    </section>
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div><h3 className="font-semibold text-slate-800">Inventory</h3><p className="mt-1 text-xs text-slate-500">{filtered.length} of {assets.length} assets</p></div>
        <div className="flex flex-wrap gap-2"><FilterSearch value={search} onChange={setSearch} placeholder="Search tag, name, location..." /><select className={fieldClass} value={status} onChange={e => setStatus(e.target.value)}><option>All</option>{["Available", "Assigned", "Maintenance", "Retired"].map(item => <option key={item}>{item}</option>)}</select></div>
      </div>
      {loading ? <Empty>Loading inventory…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["#", "Asset Tag", "Asset Name", "Category", "Employee", "Location", "Status", "Actions"].map(column => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{filtered.map((asset, index) => <tr key={asset.asset_id}>
          <td className="px-4 py-3 text-slate-400">{index + 1}</td><td className="px-4 py-3 font-medium text-[#e87500]">{asset.asset_tag}</td><td className="px-4 py-3 font-medium text-slate-800">{asset.asset_name}<p className="text-xs font-normal text-slate-500">{asset.serial_number || "No serial number"}</p></td><td className="px-4 py-3">{asset.category || "—"}</td><td className="px-4 py-3">{asset.employee_name || "—"}</td><td className="px-4 py-3">{asset.location || "—"}</td><td className="px-4 py-3"><Status>{asset.status}</Status></td><td className="px-4 py-3">{asset.status !== "Assigned" && asset.status !== "Retired" && <select aria-label={`Set status for ${asset.asset_tag}`} disabled={saving} value={asset.status} onChange={e => changeStatus(asset, e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs"><option>Available</option><option>Retired</option></select>}</td>
        </tr>)}{!filtered.length && <tr><td colSpan={8}><Empty>No inventory matches the filters.</Empty></td></tr>}</tbody>
      </table></div>}
    </section>
  </div>;
}
export { AssetInventory };
