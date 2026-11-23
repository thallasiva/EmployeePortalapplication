import React, { useState } from "react";
import Button from "../../../../components/ui/Button";
import { assignAsset, listAssets } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, listAllocations, dateLabel, usePageData, useEmployees } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
import { Status } from "./Status";
import { FilterSearch } from "./FilterSearch";
function AssetAllocation() {
  const {
    rows: assets,
    refresh: refreshAssets
  } = usePageData(listAssets);
  const {
    rows: allocations,
    loading,
    error,
    refresh
  } = usePageData(listAllocations);
  const {
    employees,
    employeeError
  } = useEmployees();
  const [search, setSearch] = useState("");
  const [allocationSearch, setAllocationSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assetAssignments, setAssetAssignments] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const available = assets.filter(asset => asset.status === "Available");
  const filtered = allocations.filter(row => `${row.asset_tag} ${row.asset_name} ${row.employee_name} ${row.category || ""}`.toLowerCase().includes(allocationSearch.toLowerCase()));
  const visibleEmployees = employees.filter(employee => `${employee.first_name} ${employee.last_name || ""} ${employee.emp_code} ${employee.department_name || ""}`.toLowerCase().includes(employeeSearch.toLowerCase()));
  const visibleAssets = available.filter(asset => `${asset.asset_tag} ${asset.asset_name} ${asset.category || ""} ${asset.serial_number || ""}`.toLowerCase().includes(search.toLowerCase()));
  const selectedAssetIds = new Set(Object.values(assetAssignments).flat());
  const assignmentCount = Object.values(assetAssignments).reduce((total, ids) => total + ids.length, 0);
  const toggleEmployee = employeeId => {
    setSelectedEmployees(current => current.includes(employeeId) ? current.filter(id => id !== employeeId) : [...current, employeeId]);
    setAssetAssignments(current => {
      if (selectedEmployees.includes(employeeId)) {
        const next = {
          ...current
        };
        delete next[employeeId];
        return next;
      }
      return current;
    });
  };
  const toggleAsset = (employeeId, assetId) => {
    setAssetAssignments(current => {
      const employeeAssets = current[employeeId] || [];
      const nextAssets = employeeAssets.includes(assetId) ? employeeAssets.filter(id => id !== assetId) : [...employeeAssets, assetId];
      return {
        ...current,
        [employeeId]: nextAssets
      };
    });
  };
  const toggleAllVisibleEmployees = () => {
    const visibleIds = visibleEmployees.map(employee => Number(employee.employee_id));
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedEmployees.includes(id));
    if (allVisibleSelected) {
      setSelectedEmployees(current => current.filter(id => !visibleIds.includes(id)));
      setAssetAssignments(current => Object.fromEntries(Object.entries(current).filter(([id]) => !visibleIds.includes(Number(id)))));
      return;
    }
    setSelectedEmployees(current => Array.from(new Set([...current, ...visibleIds])));
  };
  const submit = async event => {
    event.preventDefault();
    const assignments = selectedEmployees.flatMap(employeeId => (assetAssignments[employeeId] || []).map(assetId => ({
      employeeId,
      assetId
    })));
    if (!assignments.length) {
      setNoticeError(true);
      setNotice("Select at least one employee and one available asset for them.");
      return;
    }
    setSaving(true);
    setNotice("");
    setNoticeError(false);
    const completed = [];
    const failed = [];
    for (const assignment of assignments) {
      try {
        await assignAsset(assignment.assetId, assignment.employeeId);
        completed.push(assignment);
      } catch (cause) {
        const employee = employees.find(row => Number(row.employee_id) === assignment.employeeId);
        const asset = available.find(row => Number(row.asset_id) === assignment.assetId);
        failed.push(`${asset?.asset_tag || "Asset"} → ${employee?.first_name || "Employee"}: ${getErrorMessage(cause, "assignment failed")}`);
      }
    }
    const completedKeys = new Set(completed.map(({
      employeeId,
      assetId
    }) => `${employeeId}:${assetId}`));
    setAssetAssignments(current => Object.fromEntries(Object.entries(current).map(([employeeId, ids]) => [employeeId, ids.filter(assetId => !completedKeys.has(`${employeeId}:${assetId}`))])));
    await Promise.all([refresh(), refreshAssets()]);
    setNotice(`${completed.length} asset${completed.length === 1 ? "" : "s"} assigned${failed.length ? `. ${failed.length} could not be assigned: ${failed.join("; ")}` : " successfully."}`);
    setNoticeError(failed.length > 0);
    setSaving(false);
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Allocation" description="Select multiple employees, then choose a unique laptop, mouse, or other available asset for each person." />
    <Notice error={Boolean(error || employeeError || noticeError)}>{error || employeeError || notice}</Notice>
    <form onSubmit={submit} className="space-y-4">
      <section className={`${panelClass} p-4 sm:p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-semibold text-slate-800">1. Select employees</h3><p className="mt-1 text-xs text-slate-500">{selectedEmployees.length} selected · choose more than one if needed</p></div>
          <Button type="button" size="sm" variant="secondary" onClick={toggleAllVisibleEmployees}>{visibleEmployees.length && visibleEmployees.every(employee => selectedEmployees.includes(Number(employee.employee_id))) ? "Clear visible" : "Select visible"}</Button>
        </div>
        <input className={`${fieldClass} mb-3 max-w-md`} value={employeeSearch} onChange={event => setEmployeeSearch(event.target.value)} placeholder="Search employees by name, ID, or department" aria-label="Search employees" />
        {visibleEmployees.length ? <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
          {visibleEmployees.map(employee => {
            const id = Number(employee.employee_id);
            return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selectedEmployees.includes(id) ? "border-orange-300 bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <input type="checkbox" checked={selectedEmployees.includes(id)} onChange={() => toggleEmployee(id)} className="h-4 w-4 accent-[#e87500]" />
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{employee.first_name} {employee.last_name || ""}</span><span className="block truncate text-xs text-slate-500">{employee.emp_code} · {employee.department_name || "No department"}</span></span>
            </label>;
          })}
        </div> : <Empty>No employees match this search.</Empty>}
      </section>
      <section className={`${panelClass} p-4 sm:p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-semibold text-slate-800">2. Choose assets for each employee</h3><p className="mt-1 text-xs text-slate-500">Each physical asset can be assigned to only one selected employee.</p></div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">{assignmentCount} asset{assignmentCount === 1 ? "" : "s"} selected</span>
        </div>
        <input className="mb-3 max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search available assets by tag, name, or category" aria-label="Search available assets" />
        {!selectedEmployees.length ? <Empty>Select one or more employees to choose equipment.</Empty> : !visibleAssets.length ? <Empty>No available assets match this search.</Empty> : <div className="space-y-3">
          {selectedEmployees.map(employeeId => {
            const employee = employees.find(row => Number(row.employee_id) === employeeId);
            return <div key={employeeId} className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-sm font-semibold text-slate-800">{employee?.first_name} {employee?.last_name || ""}</h4><p className="text-xs text-slate-500">{employee?.emp_code}</p></div><span className="text-xs text-slate-500">{(assetAssignments[employeeId] || []).length} selected</span></div>
              {(assetAssignments[employeeId] || []).length > 0 && <div className="mb-3 flex flex-wrap gap-2">{(assetAssignments[employeeId] || []).map(id => {
                  const selectedAsset = assets.find(asset => Number(asset.asset_id) === id);
                  return selectedAsset ? <span key={id} className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">{selectedAsset.asset_tag} · {selectedAsset.asset_name}{selectedAsset.status !== "Available" && " · no longer available"}<button type="button" disabled={saving} aria-label={`Remove ${selectedAsset.asset_tag} from ${employee?.first_name || "employee"}`} onClick={() => toggleAsset(employeeId, id)} className="font-bold text-orange-900">×</button></span> : null;
                })}</div>}
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {visibleAssets.map(asset => {
                  const id = Number(asset.asset_id);
                  const checked = (assetAssignments[employeeId] || []).includes(id);
                  const allocatedElsewhere = selectedAssetIds.has(id) && !checked;
                  return <label key={id} className={`flex items-start gap-3 rounded-lg border p-3 ${checked ? "border-orange-300 bg-orange-50" : allocatedElsewhere ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50" : "cursor-pointer border-slate-200 hover:bg-slate-50"}`}>
                    <input type="checkbox" checked={checked} disabled={allocatedElsewhere || saving} onChange={() => toggleAsset(employeeId, id)} className="mt-0.5 h-4 w-4 accent-[#e87500]" />
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{asset.asset_name}</span><span className="block truncate text-xs text-slate-500">{asset.asset_tag} · {asset.category || "Uncategorized"}</span>{asset.serial_number && <span className="block truncate text-xs text-slate-400">S/N {asset.serial_number}</span>}</span>
                  </label>;
                })}
              </div>
            </div>;
          })}
        </div>}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <p className="mr-auto text-xs text-slate-500">Selected equipment will appear in Active Allocations after assignment.</p>
          <Button type="submit" loading={saving} disabled={saving || assignmentCount === 0}>Assign {assignmentCount || "Selected"} Asset{assignmentCount === 1 ? "" : "s"}</Button>
        </div>
      </section>
    </form>
    <section className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h3 className="font-semibold text-slate-800">Active allocations</h3><p className="mt-1 text-xs text-slate-500">{allocations.length} allocated assets</p></div><FilterSearch value={allocationSearch} onChange={setAllocationSearch} placeholder="Search allocations..." /></div>
      {loading ? <Empty>Loading allocations…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Assigned date</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(row => <tr key={row.assignment_id}><td className="px-4 py-3 font-medium">{row.employee_name}<p className="text-xs font-normal text-slate-500">{row.emp_code}</p></td><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.category || "—"}</td><td className="px-4 py-3">{dateLabel(row.assigned_at)}</td><td className="px-4 py-3"><Status>Assigned</Status></td></tr>)}{!filtered.length && <tr><td colSpan={5}><Empty>No active allocations found.</Empty></td></tr>}</tbody></table></div>}
    </section>
  </div>;
}
export { AssetAllocation };
