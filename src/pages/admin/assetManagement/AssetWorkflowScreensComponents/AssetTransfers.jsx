import React, { useState } from "react";
import Button from "../../../../components/ui/Button";
import { listAssetTransfers, transferAsset } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, listAllocations, dateLabel, usePageData, useEmployees } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
function AssetTransfers() {
  const {
    rows: allocations,
    refresh
  } = usePageData(listAllocations);
  const {
    rows: history,
    loading,
    error
  } = usePageData(listAssetTransfers);
  const {
    employees,
    employeeError
  } = useEmployees();
  const [targetIds, setTargetIds] = useState({});
  const [remarks, setRemarks] = useState({});
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const move = async row => {
    setSaving(row.asset_id);
    setNotice("");
    try {
      await transferAsset(row.asset_id, {
        to_employee_id: Number(targetIds[row.asset_id]),
        remarks: remarks[row.asset_id] || ""
      });
      setNotice(`${row.asset_tag} transferred.`);
      await refresh();
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to transfer asset."));
    } finally {
      setSaving(null);
    }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Transfers" description="Transfer assigned assets between active employees and review transfer history." />
    <Notice error={Boolean(error || employeeError)}>{error || employeeError || notice}</Notice>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Transfer an allocated asset</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Current employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">New employee</th><th className="px-4 py-3">Remarks</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{allocations.map(row => <tr key={row.assignment_id}><td className="px-4 py-3">{row.employee_name}</td><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3"><select className={fieldClass} value={targetIds[row.asset_id] || ""} onChange={e => setTargetIds({
                  ...targetIds,
                  [row.asset_id]: e.target.value
                })}><option value="">Choose employee</option>{employees.filter(emp => Number(emp.employee_id) !== Number(row.employee_id)).map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name || ""} · {emp.emp_code}</option>)}</select></td><td className="px-4 py-3"><input maxLength={500} className={fieldClass} placeholder="Transfer reason" value={remarks[row.asset_id] || ""} onChange={e => setRemarks({
                  ...remarks,
                  [row.asset_id]: e.target.value
                })} /></td><td className="px-4 py-3"><Button size="sm" disabled={saving === row.asset_id || !targetIds[row.asset_id]} onClick={() => move(row)}>Transfer</Button></td></tr>)}{!allocations.length && <tr><td colSpan={5}><Empty>No assigned assets are available to transfer.</Empty></td></tr>}</tbody></table></div></section>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Transfer history</h3></div>{loading ? <Empty>Loading transfer history…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Remarks</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map(row => <tr key={row.transfer_id}><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.from_employee}</td><td className="px-4 py-3">{row.to_employee}</td><td className="px-4 py-3">{dateLabel(row.transferred_at)}</td><td className="px-4 py-3">{row.remarks || "—"}</td></tr>)}{!history.length && <tr><td colSpan={5}><Empty>No transfer history yet.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
export { AssetTransfers };
