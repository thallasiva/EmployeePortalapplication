import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import Button from "../../../components/ui/Button";
import { listEmployees } from "../../../api/employee.api";
import {
  assignAsset,
  createAsset,
  createAssetMaintenance,
  fulfillAssetRequest,
  getAssetReport,
  listAssetAllocations,
  listAssetCategories,
  listAssetMaintenance,
  listAssetRequests,
  listAssetReturns,
  listAssetTransfers,
  listAssets,
  returnAsset,
  reviewAssetRequest,
  saveAssetCategory,
  transferAsset,
  updateAssetMaintenance,
  updateAssetStatus,
} from "../../../api/workforce.api";
import { getErrorMessage } from "../../../api/client";

const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const panelClass = "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";
const blankAsset = { asset_tag: "", asset_name: "", category_id: "", serial_number: "", location: "", purchase_date: "", notes: "" };
const listAllAssetCategories = () => listAssetCategories();
const listActiveAssetCategories = () => listAssetCategories(false);
const listAllocations = () => listAssetAllocations();

function PageTitle({ title, description, action }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold  text-[#e87500]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}
function Notice({ children, error = false }) {
  return children ? <div role={error ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-800"}`}>{children}</div> : null;
}
function Empty({ children }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}
function Status({ children }) {
  const tone = { Available: "bg-blue-50 text-[#e87500]", Assigned: "bg-emerald-50 text-emerald-700", Maintenance: "bg-amber-50 text-amber-700", Retired: "bg-slate-100 text-slate-600", Active: "bg-emerald-50 text-emerald-700", Inactive: "bg-slate-100 text-slate-600", Pending: "bg-amber-50 text-amber-700", Approved: "bg-blue-50 text-[#e87500]", Rejected: "bg-red-50 text-red-700", Fulfilled: "bg-emerald-50 text-emerald-700", Open: "bg-amber-50 text-amber-700", "In Progress": "bg-blue-50 text-[#e87500]", Resolved: "bg-emerald-50 text-emerald-700", Cancelled: "bg-slate-100 text-slate-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone[children] || "bg-slate-100 text-slate-600"}`}>{children || "—"}</span>;
}
function FilterSearch({ value, onChange, placeholder = "Search..." }) {
  return <label className="relative block min-w-48"><span className="sr-only">{placeholder}</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${fieldClass} pl-9`} /></label>;
}
function dateLabel(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [columns.map(escape).join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function usePageData(loader) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setRows(await loader() || []); }
    catch (cause) { setError(getErrorMessage(cause, "Unable to load asset data.")); }
    finally { setLoading(false); }
  }, [loader]);
  useEffect(() => { refresh(); }, [refresh]);
  return { rows, setRows, loading, error, refresh };
}
function useEmployees() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    listEmployees({ limit: 1000, status: "Active" })
      .then((result) => setRows(result?.data || []))
      .catch((cause) => setError(getErrorMessage(cause, "Unable to load employees.")));
  }, []);
  return { employees: rows, employeeError: error };
}

export function AssetInventory() {
  const { rows: assets, loading, error, refresh } = usePageData(listAssets);
  const { rows: categories } = usePageData(listActiveAssetCategories);
  const [form, setForm] = useState(blankAsset);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => assets.filter((asset) =>
    (status === "All" || asset.status === status) &&
    `${asset.asset_tag} ${asset.asset_name} ${asset.category || ""} ${asset.location || ""} ${asset.employee_name || ""}`.toLowerCase().includes(search.toLowerCase())
  ), [assets, status, search]);
  const add = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice("");
    try {
      await createAsset({ ...form, category_id: form.category_id ? Number(form.category_id) : null, purchase_date: form.purchase_date || null });
      setForm(blankAsset); setNotice("Asset added to inventory."); await refresh();
    } catch (cause) { setNotice(getErrorMessage(cause, "Unable to add asset.")); }
    finally { setSaving(false); }
  };
  const changeStatus = async (asset, next) => {
    setSaving(true); setNotice("");
    try { await updateAssetStatus(asset.asset_id, next); setNotice("Asset status updated."); await refresh(); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to update asset status.")); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Inventory" description="View and manage company assets." action={<Button type="button" icon={<Download size={15} />} onClick={() => downloadCsv("asset-inventory.csv", filtered)}>Export CSV</Button>} />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={`${panelClass} p-5`}>
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Plus size={17} /> Add asset</h3>
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input required maxLength={80} className={fieldClass} placeholder="Asset tag *" value={form.asset_tag} onChange={(e) => setForm({ ...form, asset_tag: e.target.value })} />
        <input required maxLength={160} className={fieldClass} placeholder="Asset name *" value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} />
        <select className={fieldClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</select>
        <input maxLength={120} className={fieldClass} placeholder="Serial number" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
        <input maxLength={120} className={fieldClass} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <label className="text-xs text-slate-500">Purchase date<input type="date" className={`${fieldClass} mt-1`} value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></label>
        <input maxLength={500} className={fieldClass} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="flex items-end"><Button type="submit" loading={saving}>Add asset</Button></div>
      </form>
    </section>
    <section className={panelClass}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div><h3 className="font-semibold text-slate-800">Inventory</h3><p className="mt-1 text-xs text-slate-500">{filtered.length} of {assets.length} assets</p></div>
        <div className="flex flex-wrap gap-2"><FilterSearch value={search} onChange={setSearch} placeholder="Search tag, name, location..." /><select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{["Available", "Assigned", "Maintenance", "Retired"].map((item) => <option key={item}>{item}</option>)}</select></div>
      </div>
      {loading ? <Empty>Loading inventory…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["#", "Asset Tag", "Asset Name", "Category", "Employee", "Location", "Status", "Actions"].map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{filtered.map((asset, index) => <tr key={asset.asset_id}>
          <td className="px-4 py-3 text-slate-400">{index + 1}</td><td className="px-4 py-3 font-medium text-[#e87500]">{asset.asset_tag}</td><td className="px-4 py-3 font-medium text-slate-800">{asset.asset_name}<p className="text-xs font-normal text-slate-500">{asset.serial_number || "No serial number"}</p></td><td className="px-4 py-3">{asset.category || "—"}</td><td className="px-4 py-3">{asset.employee_name || "—"}</td><td className="px-4 py-3">{asset.location || "—"}</td><td className="px-4 py-3"><Status>{asset.status}</Status></td><td className="px-4 py-3">{asset.status !== "Assigned" && asset.status !== "Retired" && <select aria-label={`Set status for ${asset.asset_tag}`} disabled={saving} value={asset.status} onChange={(e) => changeStatus(asset, e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs"><option>Available</option><option>Retired</option></select>}</td>
        </tr>)}{!filtered.length && <tr><td colSpan={8}><Empty>No inventory matches the filters.</Empty></td></tr>}</tbody>
      </table></div>}
    </section>
  </div>;
}

export function AssetCategories() {
  const { rows, loading, error, refresh } = usePageData(listAllAssetCategories);
  const [form, setForm] = useState({ category_name: "", description: "", icon: "" });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      await saveAssetCategory(form, editing?.category_id);
      setNotice(editing ? "Category updated." : "Category created.");
      setForm({ category_name: "", description: "", icon: "" }); setEditing(null); await refresh();
    } catch (cause) { setNotice(getErrorMessage(cause, "Unable to save category.")); }
    finally { setSaving(false); }
  };
  const edit = (row) => { setEditing(row); setForm({ category_name: row.category_name, description: row.description || "", icon: row.icon || "" }); };
  const toggle = async (row) => {
    setSaving(true); setNotice("");
    try { await saveAssetCategory({ category_name: row.category_name, description: row.description, icon: row.icon, is_active: !Boolean(row.is_active) }, row.category_id); setNotice(row.is_active ? "Category deactivated." : "Category activated."); await refresh(); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to update category.")); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Categories" description="Organize assets into categories for consistent inventory and reporting." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={`${panelClass} p-5`}><h3 className="mb-4 font-semibold text-slate-800">{editing ? "Edit category" : "Add category"}</h3>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
        <input required maxLength={100} className={fieldClass} placeholder="Category name" value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} />
        <input maxLength={255} className={fieldClass} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input maxLength={40} className={fieldClass} placeholder="Icon name (optional)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        <div className="flex gap-2"><Button type="submit" loading={saving}>{editing ? "Save changes" : "Add category"}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm({ category_name: "", description: "", icon: "" }); }}>Cancel</Button>}</div>
      </form>
    </section>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Company categories</h3></div>{loading ? <Empty>Loading categories…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Category name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Assets</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.category_id}><td className="px-4 py-3 font-medium">{row.category_name}</td><td className="px-4 py-3 text-slate-500">{row.description || "—"}</td><td className="px-4 py-3">{row.asset_count}</td><td className="px-4 py-3"><Status>{row.is_active ? "Active" : "Inactive"}</Status></td><td className="px-4 py-3"><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => edit(row)}>Edit</Button><Button size="sm" variant="secondary" disabled={saving} onClick={() => toggle(row)}>{row.is_active ? "Deactivate" : "Activate"}</Button></div></td></tr>)}{!rows.length && <tr><td colSpan={5}><Empty>No categories created.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}

export function AssetAllocation() {
  const { rows: assets, refresh: refreshAssets } = usePageData(listAssets);
  const { rows: allocations, loading, error, refresh } = usePageData(listAllocations);
  const { employees, employeeError } = useEmployees();
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const available = assets.filter((asset) => asset.status === "Available");
  const filtered = allocations.filter((row) => `${row.asset_tag} ${row.asset_name} ${row.employee_name} ${row.category || ""}`.toLowerCase().includes(search.toLowerCase()));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try { await assignAsset(assetId, Number(employeeId)); setAssetId(""); setEmployeeId(""); setNotice("Asset assigned successfully."); await Promise.all([refresh(), refreshAssets()]); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to assign asset.")); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Allocation" description="Assign available company assets to active employees." />
    <Notice error={Boolean(error || employeeError)}>{error || employeeError || notice}</Notice>
    <section className={`${panelClass} p-5`}><form onSubmit={submit} className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
      <label className="text-xs font-medium text-slate-600">Employee<select required className={`${fieldClass} mt-1`} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.employee_id} value={employee.employee_id}>{employee.first_name} {employee.last_name || ""} · {employee.emp_code}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-600">Available asset<select required className={`${fieldClass} mt-1`} value={assetId} onChange={(e) => setAssetId(e.target.value)}><option value="">Select asset</option>{available.map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_tag} · {asset.asset_name} · {asset.category || "Uncategorized"}</option>)}</select></label>
      <Button type="submit" loading={saving}>Allocate asset</Button>
    </form></section>
    <section className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h3 className="font-semibold text-slate-800">Active allocations</h3><p className="mt-1 text-xs text-slate-500">{allocations.length} allocated assets</p></div><FilterSearch value={search} onChange={setSearch} placeholder="Search allocations..." /></div>
      {loading ? <Empty>Loading allocations…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Assigned date</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((row) => <tr key={row.assignment_id}><td className="px-4 py-3 font-medium">{row.employee_name}<p className="text-xs font-normal text-slate-500">{row.emp_code}</p></td><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.category || "—"}</td><td className="px-4 py-3">{dateLabel(row.assigned_at)}</td><td className="px-4 py-3"><Status>Assigned</Status></td></tr>)}{!filtered.length && <tr><td colSpan={5}><Empty>No active allocations found.</Empty></td></tr>}</tbody></table></div>}
    </section>
  </div>;
}

export function AssetRequests() {
  const { rows, loading, error, refresh } = usePageData(listAssetRequests);
  const { rows: assets, refresh: refreshAssets } = usePageData(listAssets);
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState("");
  const act = async (id, operation, success) => {
    setSavingId(id); setNotice("");
    try { await operation(); setNotice(success); await Promise.all([refresh(), refreshAssets()]); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to process request.")); }
    finally { setSavingId(null); }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Requests" description="Review employee requests and fulfill approved requests from available inventory." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={panelClass}>{loading ? <Empty>Loading requests…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Justification</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.request_id}><td className="px-4 py-3 font-medium">{row.employee_name}<p className="text-xs font-normal text-slate-500">{row.emp_code}</p></td><td className="px-4 py-3">{row.request_type}<p className="text-xs text-slate-500">{row.category_name || "Any category"}</p></td><td className="max-w-64 px-4 py-3 text-slate-600">{row.justification}</td><td className="px-4 py-3">{row.priority}</td><td className="px-4 py-3"><Status>{row.status}</Status></td><td className="px-4 py-3">
      {row.status === "Pending" && <div className="space-y-2"><input maxLength={500} placeholder="Review notes" value={notes[row.request_id] || ""} onChange={(e) => setNotes({ ...notes, [row.request_id]: e.target.value })} className={`${fieldClass} min-w-40`} /><div className="flex gap-2"><Button size="sm" disabled={savingId === row.request_id} onClick={() => act(row.request_id, () => reviewAssetRequest(row.request_id, { decision: "Approved", review_notes: notes[row.request_id] }), "Request approved.")}>Approve</Button><Button size="sm" variant="secondary" disabled={savingId === row.request_id} onClick={() => act(row.request_id, () => reviewAssetRequest(row.request_id, { decision: "Rejected", review_notes: notes[row.request_id] }), "Request rejected.")}>Reject</Button></div></div>}
      {row.status === "Approved" && <div className="flex min-w-56 gap-2"><select className={fieldClass} value={selected[row.request_id] || ""} onChange={(e) => setSelected({ ...selected, [row.request_id]: e.target.value })}><option value="">Select available asset</option>{assets.filter((asset) => asset.status === "Available" && (!row.category_id || Number(asset.category_id) === Number(row.category_id))).map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_tag} · {asset.asset_name}</option>)}</select><Button size="sm" disabled={savingId === row.request_id || !selected[row.request_id]} onClick={() => act(row.request_id, () => fulfillAssetRequest(row.request_id, Number(selected[row.request_id])), "Request fulfilled and asset assigned.")}>Fulfill</Button></div>}
      {row.status !== "Pending" && row.status !== "Approved" && (row.asset_tag ? <span className="text-xs text-slate-500">Assigned {row.asset_tag}</span> : <span className="text-xs text-slate-500">{row.review_notes || "—"}</span>)}
    </td></tr>)}{!rows.length && <tr><td colSpan={6}><Empty>No asset requests to review.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}

export function AssetReturns() {
  const { rows: active, refresh: refreshActive } = usePageData(listAllocations);
  const { rows: returned, loading, error, refresh } = usePageData(listAssetReturns);
  const [conditions, setConditions] = useState({});
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const doReturn = async (row) => {
    setSaving(row.asset_id); setNotice("");
    try { await returnAsset(row.asset_id, conditions[row.asset_id] || "Returned"); setNotice(`${row.asset_tag} returned to inventory.`); await Promise.all([refresh(), refreshActive()]); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to record return.")); }
    finally { setSaving(null); }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Returns" description="Record issued-asset returns and review return history." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Currently allocated</h3><p className="mt-1 text-xs text-slate-500">Confirm the return condition before closing an allocation.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Assigned on</th><th className="px-4 py-3">Return condition</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{active.map((row) => <tr key={row.assignment_id}><td className="px-4 py-3">{row.employee_name}</td><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{dateLabel(row.assigned_at)}</td><td className="px-4 py-3"><input maxLength={255} placeholder="Condition / reason" value={conditions[row.asset_id] || ""} onChange={(e) => setConditions({ ...conditions, [row.asset_id]: e.target.value })} className={fieldClass} /></td><td className="px-4 py-3"><Button size="sm" variant="secondary" disabled={saving === row.asset_id} onClick={() => doReturn(row)}>Record return</Button></td></tr>)}{!active.length && <tr><td colSpan={5}><Empty>No assets are currently allocated.</Empty></td></tr>}</tbody></table></div></section>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Return history</h3></div>{loading ? <Empty>Loading returns…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Returned</th><th className="px-4 py-3">Condition / reason</th></tr></thead><tbody className="divide-y divide-slate-100">{returned.map((row) => <tr key={row.assignment_id}><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.employee_name}</td><td className="px-4 py-3">{dateLabel(row.assigned_at)}</td><td className="px-4 py-3">{dateLabel(row.returned_at)}</td><td className="px-4 py-3">{row.return_condition || "—"}</td></tr>)}{!returned.length && <tr><td colSpan={5}><Empty>No return history yet.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}

export function AssetMaintenance() {
  const { rows, loading, error, refresh } = usePageData(listAssetMaintenance);
  const { rows: assets, refresh: refreshAssets } = usePageData(listAssets);
  const [form, setForm] = useState({ asset_id: "", issue: "", priority: "Medium" });
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const create = async (event) => {
    event.preventDefault(); setSaving("create"); setNotice("");
    try { await createAssetMaintenance({ ...form, asset_id: Number(form.asset_id) }); setForm({ asset_id: "", issue: "", priority: "Medium" }); setNotice("Maintenance record opened."); await Promise.all([refresh(), refreshAssets()]); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to create maintenance record.")); }
    finally { setSaving(null); }
  };
  const update = async (row, status) => {
    setSaving(row.maintenance_id); setNotice("");
    try { await updateAssetMaintenance(row.maintenance_id, { status, resolution_notes: notes[row.maintenance_id] || "" }); setNotice("Maintenance record updated."); await Promise.all([refresh(), refreshAssets()]); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to update maintenance record.")); }
    finally { setSaving(null); }
  };
  return <div className="space-y-5">
    <PageTitle title="Maintenance Management" description="Track repairs and maintenance for company assets." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={`${panelClass} p-5`}><form onSubmit={create} className="grid gap-3 md:grid-cols-[1fr_2fr_160px_auto]">
      <select required className={fieldClass} value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })}><option value="">Select unassigned asset</option>{assets.filter((asset) => ["Available", "Maintenance"].includes(asset.status)).map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_tag} · {asset.asset_name}</option>)}</select>
      <input required minLength={4} maxLength={1000} className={fieldClass} placeholder="Describe the issue" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
      <select className={fieldClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
      <Button type="submit" loading={saving === "create"}>Open maintenance</Button>
    </form></section>
    <section className={panelClass}>{loading ? <Empty>Loading maintenance records…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Reported</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.maintenance_id}><td className="px-4 py-3 font-medium">{row.asset_tag}<p className="text-xs font-normal text-slate-500">{row.asset_name}</p></td><td className="max-w-60 px-4 py-3">{row.issue}</td><td className="px-4 py-3">{row.priority}</td><td className="px-4 py-3">{dateLabel(row.reported_at)}</td><td className="px-4 py-3"><Status>{row.status}</Status>{row.resolution_notes && <p className="mt-1 max-w-48 text-xs text-slate-500">{row.resolution_notes}</p>}</td><td className="px-4 py-3">{["Open", "In Progress"].includes(row.status) && <div className="flex flex-wrap gap-2"><input aria-label="Resolution notes" maxLength={1000} placeholder="Update notes" value={notes[row.maintenance_id] || ""} onChange={(e) => setNotes({ ...notes, [row.maintenance_id]: e.target.value })} className="w-36 rounded border border-slate-300 px-2 py-1 text-xs" />{row.status === "Open" && <Button size="sm" variant="secondary" disabled={saving === row.maintenance_id} onClick={() => update(row, "In Progress")}>Start</Button>}<Button size="sm" disabled={saving === row.maintenance_id} onClick={() => update(row, "Resolved")}>Resolve</Button><Button size="sm" variant="secondary" disabled={saving === row.maintenance_id} onClick={() => update(row, "Cancelled")}>Cancel</Button></div>}</td></tr>)}{!rows.length && <tr><td colSpan={6}><Empty>No maintenance records.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}

export function AssetTransfers() {
  const { rows: allocations, refresh } = usePageData(listAllocations);
  const { rows: history, loading, error } = usePageData(listAssetTransfers);
  const { employees, employeeError } = useEmployees();
  const [targetIds, setTargetIds] = useState({});
  const [remarks, setRemarks] = useState({});
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const move = async (row) => {
    setSaving(row.asset_id); setNotice("");
    try { await transferAsset(row.asset_id, { to_employee_id: Number(targetIds[row.asset_id]), remarks: remarks[row.asset_id] || "" }); setNotice(`${row.asset_tag} transferred.`); await refresh(); }
    catch (cause) { setNotice(getErrorMessage(cause, "Unable to transfer asset.")); }
    finally { setSaving(null); }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Transfers" description="Transfer assigned assets between active employees and review transfer history." />
    <Notice error={Boolean(error || employeeError)}>{error || employeeError || notice}</Notice>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Transfer an allocated asset</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Current employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">New employee</th><th className="px-4 py-3">Remarks</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{allocations.map((row) => <tr key={row.assignment_id}><td className="px-4 py-3">{row.employee_name}</td><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3"><select className={fieldClass} value={targetIds[row.asset_id] || ""} onChange={(e) => setTargetIds({ ...targetIds, [row.asset_id]: e.target.value })}><option value="">Choose employee</option>{employees.filter((emp) => Number(emp.employee_id) !== Number(row.employee_id)).map((emp) => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name || ""} · {emp.emp_code}</option>)}</select></td><td className="px-4 py-3"><input maxLength={500} className={fieldClass} placeholder="Transfer reason" value={remarks[row.asset_id] || ""} onChange={(e) => setRemarks({ ...remarks, [row.asset_id]: e.target.value })} /></td><td className="px-4 py-3"><Button size="sm" disabled={saving === row.asset_id || !targetIds[row.asset_id]} onClick={() => move(row)}>Transfer</Button></td></tr>)}{!allocations.length && <tr><td colSpan={5}><Empty>No assigned assets are available to transfer.</Empty></td></tr>}</tbody></table></div></section>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Transfer history</h3></div>{loading ? <Empty>Loading transfer history…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map((row) => <tr key={row.transfer_id}><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.from_employee}</td><td className="px-4 py-3">{row.to_employee}</td><td className="px-4 py-3">{dateLabel(row.transferred_at)}</td><td className="px-4 py-3">{row.remarks || "—"}</td></tr>)}{!history.length && <tr><td colSpan={5}><Empty>No transfer history yet.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}

export function AssetReports() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: "inventory", from_date: "", to_date: "", category_id: "", status: "All" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { listAssetCategories(false).then((result) => setCategories(result || [])).catch((cause) => setError(getErrorMessage(cause, "Unable to load categories."))); }, []);
  const generate = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    try { const report = await getAssetReport(filters); setRows(report?.records || []); }
    catch (cause) { setError(getErrorMessage(cause, "Unable to generate report.")); }
    finally { setLoading(false); }
  };
  const exportRows = rows.map((row) => ({
    asset_tag: row.asset_tag,
    asset_name: row.asset_name,
    category: row.category || "",
    status: filters.type === "maintenance" ? row.maintenance_status : row.status,
    employee: row.employee_name || "",
    location: row.location || "",
    serial_number: row.serial_number || "",
    date: row.assigned_at || row.created_at || "",
    maintenance_issue: row.maintenance_issue || "",
  }));
  return <div className="space-y-5">
    <PageTitle title="Asset Reports" description="Generate inventory, allocation, or maintenance reports with company-scoped filters." action={<Button type="button" variant="secondary" icon={<Download size={15} />} disabled={!rows.length} onClick={() => downloadCsv(`asset-${filters.type}-report.csv`, exportRows)}>Export CSV</Button>} />
    <Notice error={Boolean(error)}>{error}</Notice>
    <form onSubmit={generate} className={`${panelClass} grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-6`}>
      <label className="text-xs text-slate-500">Report type<select className={`${fieldClass} mt-1`} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="inventory">Inventory report</option><option value="allocations">Allocation report</option><option value="maintenance">Maintenance report</option></select></label>
      <label className="text-xs text-slate-500">From date<input type="date" className={`${fieldClass} mt-1`} value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} /></label>
      <label className="text-xs text-slate-500">To date<input type="date" className={`${fieldClass} mt-1`} value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} /></label>
      <label className="text-xs text-slate-500">Category<select className={`${fieldClass} mt-1`} value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}><option value="">All categories</option>{categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></label>
      <label className="text-xs text-slate-500">Status<select className={`${fieldClass} mt-1`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option>All</option>{["Available", "Assigned", "Maintenance", "Retired"].map((status) => <option key={status}>{status}</option>)}</select></label>
      <div className="flex items-end"><Button type="submit" loading={loading}>Generate report</Button></div>
    </form>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Report results</h3><p className="mt-1 text-xs text-slate-500">{rows.length} records</p></div>{loading ? <Empty>Generating report…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">{filters.type === "maintenance" ? "Issue" : "Date"}</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={`${row.asset_id}-${row.maintenance_status || row.assigned_at || row.status}`}><td className="px-4 py-3 font-medium">{row.asset_name}<p className="text-xs font-normal text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.category || "—"}</td><td className="px-4 py-3">{row.employee_name || "—"}</td><td className="px-4 py-3">{row.location || "—"}</td><td className="px-4 py-3"><Status>{filters.type === "maintenance" ? row.maintenance_status : row.status}</Status></td><td className="px-4 py-3">{filters.type === "maintenance" ? row.maintenance_issue : dateLabel(row.assigned_at || row.created_at)}</td></tr>)}{!rows.length && <tr><td colSpan={6}><Empty>Set report criteria and generate a report.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
