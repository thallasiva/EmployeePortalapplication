import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { getAssetReport, listAssetCategories } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, dateLabel, downloadCsv } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
import { Status } from "./Status";
function AssetReports() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    type: "inventory",
    from_date: "",
    to_date: "",
    category_id: "",
    status: "All"
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    listAssetCategories(false).then(result => setCategories(result || [])).catch(cause => setError(getErrorMessage(cause, "Unable to load categories.")));
  }, []);
  const generate = async event => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const report = await getAssetReport(filters);
      setRows(report?.records || []);
    } catch (cause) {
      setError(getErrorMessage(cause, "Unable to generate report."));
    } finally {
      setLoading(false);
    }
  };
  const exportRows = rows.map(row => ({
    asset_tag: row.asset_tag,
    asset_name: row.asset_name,
    category: row.category || "",
    status: filters.type === "maintenance" ? row.maintenance_status : row.status,
    employee: row.employee_name || "",
    location: row.location || "",
    serial_number: row.serial_number || "",
    date: row.assigned_at || row.created_at || "",
    maintenance_issue: row.maintenance_issue || ""
  }));
  return <div className="space-y-5">
    <PageTitle title="Asset Reports" description="Generate inventory, allocation, or maintenance reports with company-scoped filters." action={<Button type="button" variant="secondary" icon={<Download size={15} />} disabled={!rows.length} onClick={() => downloadCsv(`asset-${filters.type}-report.csv`, exportRows)}>Export CSV</Button>} />
    <Notice error={Boolean(error)}>{error}</Notice>
    <form onSubmit={generate} className={`${panelClass} grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-6`}>
      <label className="text-xs text-slate-500">Report type<select className={`${fieldClass} mt-1`} value={filters.type} onChange={e => setFilters({
          ...filters,
          type: e.target.value
        })}><option value="inventory">Inventory report</option><option value="allocations">Allocation report</option><option value="maintenance">Maintenance report</option></select></label>
      <label className="text-xs text-slate-500">From date<input type="date" className={`${fieldClass} mt-1`} value={filters.from_date} onChange={e => setFilters({
          ...filters,
          from_date: e.target.value
        })} /></label>
      <label className="text-xs text-slate-500">To date<input type="date" className={`${fieldClass} mt-1`} value={filters.to_date} onChange={e => setFilters({
          ...filters,
          to_date: e.target.value
        })} /></label>
      <label className="text-xs text-slate-500">Category<select className={`${fieldClass} mt-1`} value={filters.category_id} onChange={e => setFilters({
          ...filters,
          category_id: e.target.value
        })}><option value="">All categories</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></label>
      <label className="text-xs text-slate-500">Status<select className={`${fieldClass} mt-1`} value={filters.status} onChange={e => setFilters({
          ...filters,
          status: e.target.value
        })}><option>All</option>{["Available", "Assigned", "Maintenance", "Retired"].map(status => <option key={status}>{status}</option>)}</select></label>
      <div className="flex items-end"><Button type="submit" loading={loading}>Generate report</Button></div>
    </form>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Report results</h3><p className="mt-1 text-xs text-slate-500">{rows.length} records</p></div>{loading ? <Empty>Generating report…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">{filters.type === "maintenance" ? "Issue" : "Date"}</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={`${row.asset_id}-${row.maintenance_status || row.assigned_at || row.status}`}><td className="px-4 py-3 font-medium">{row.asset_name}<p className="text-xs font-normal text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.category || "—"}</td><td className="px-4 py-3">{row.employee_name || "—"}</td><td className="px-4 py-3">{row.location || "—"}</td><td className="px-4 py-3"><Status>{filters.type === "maintenance" ? row.maintenance_status : row.status}</Status></td><td className="px-4 py-3">{filters.type === "maintenance" ? row.maintenance_issue : dateLabel(row.assigned_at || row.created_at)}</td></tr>)}{!rows.length && <tr><td colSpan={6}><Empty>Set report criteria and generate a report.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
export { AssetReports };
