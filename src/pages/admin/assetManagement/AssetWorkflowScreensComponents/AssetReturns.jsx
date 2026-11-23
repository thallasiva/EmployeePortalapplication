import React, { useState } from "react";
import Button from "../../../../components/ui/Button";
import { listAssetReturns, returnAsset } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, listAllocations, dateLabel, usePageData } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
function AssetReturns() {
  const {
    rows: active,
    refresh: refreshActive
  } = usePageData(listAllocations);
  const {
    rows: returned,
    loading,
    error,
    refresh
  } = usePageData(listAssetReturns);
  const [conditions, setConditions] = useState({});
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const doReturn = async row => {
    setSaving(row.asset_id);
    setNotice("");
    try {
      await returnAsset(row.asset_id, conditions[row.asset_id] || "Returned");
      setNotice(`${row.asset_tag} returned to inventory.`);
      await Promise.all([refresh(), refreshActive()]);
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to record return."));
    } finally {
      setSaving(null);
    }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Returns" description="Record issued-asset returns and review return history." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Currently allocated</h3><p className="mt-1 text-xs text-slate-500">Confirm the return condition before closing an allocation.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Assigned on</th><th className="px-4 py-3">Return condition</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{active.map(row => <tr key={row.assignment_id}><td className="px-4 py-3">{row.employee_name}</td><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{dateLabel(row.assigned_at)}</td><td className="px-4 py-3"><input maxLength={255} placeholder="Condition / reason" value={conditions[row.asset_id] || ""} onChange={e => setConditions({
                  ...conditions,
                  [row.asset_id]: e.target.value
                })} className={fieldClass} /></td><td className="px-4 py-3"><Button size="sm" variant="secondary" disabled={saving === row.asset_id} onClick={() => doReturn(row)}>Record return</Button></td></tr>)}{!active.length && <tr><td colSpan={5}><Empty>No assets are currently allocated.</Empty></td></tr>}</tbody></table></div></section>
    <section className={panelClass}><div className="border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Return history</h3></div>{loading ? <Empty>Loading returns…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Returned</th><th className="px-4 py-3">Condition / reason</th></tr></thead><tbody className="divide-y divide-slate-100">{returned.map(row => <tr key={row.assignment_id}><td className="px-4 py-3">{row.asset_name}<p className="text-xs text-slate-500">{row.asset_tag}</p></td><td className="px-4 py-3">{row.employee_name}</td><td className="px-4 py-3">{dateLabel(row.assigned_at)}</td><td className="px-4 py-3">{dateLabel(row.returned_at)}</td><td className="px-4 py-3">{row.return_condition || "—"}</td></tr>)}{!returned.length && <tr><td colSpan={5}><Empty>No return history yet.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
export { AssetReturns };
