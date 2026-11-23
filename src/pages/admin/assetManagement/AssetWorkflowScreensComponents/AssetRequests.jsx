import React, { useState } from "react";
import Button from "../../../../components/ui/Button";
import { fulfillAssetRequest, listAssetRequests, listAssets, reviewAssetRequest } from "../../../../api/workforce.api";
import { getErrorMessage } from "../../../../api/client";
import { fieldClass, panelClass, usePageData } from "./shared";
import { PageTitle } from "./PageTitle";
import { Notice } from "./Notice";
import { Empty } from "./Empty";
import { Status } from "./Status";
function AssetRequests() {
  const {
    rows,
    loading,
    error,
    refresh
  } = usePageData(listAssetRequests);
  const {
    rows: assets,
    refresh: refreshAssets
  } = usePageData(listAssets);
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState("");
  const act = async (id, operation, success) => {
    setSavingId(id);
    setNotice("");
    try {
      await operation();
      setNotice(success);
      await Promise.all([refresh(), refreshAssets()]);
    } catch (cause) {
      setNotice(getErrorMessage(cause, "Unable to process request."));
    } finally {
      setSavingId(null);
    }
  };
  return <div className="space-y-5">
    <PageTitle title="Asset Requests" description="Review employee requests and fulfill approved requests from available inventory." />
    <Notice error={Boolean(error)}>{error || notice}</Notice>
    <section className={panelClass}>{loading ? <Empty>Loading requests…</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Justification</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.request_id}><td className="px-4 py-3 font-medium">{row.employee_name}<p className="text-xs font-normal text-slate-500">{row.emp_code}</p></td><td className="px-4 py-3">{row.request_type}<p className="text-xs text-slate-500">{row.category_name || "Any category"}</p></td><td className="max-w-64 px-4 py-3 text-slate-600">{row.justification}</td><td className="px-4 py-3">{row.priority}</td><td className="px-4 py-3"><Status>{row.status}</Status></td><td className="px-4 py-3">
      {row.status === "Pending" && <div className="space-y-2"><input maxLength={500} placeholder="Review notes" value={notes[row.request_id] || ""} onChange={e => setNotes({
                    ...notes,
                    [row.request_id]: e.target.value
                  })} className={`${fieldClass} min-w-40`} /><div className="flex gap-2"><Button size="sm" disabled={savingId === row.request_id} onClick={() => act(row.request_id, () => reviewAssetRequest(row.request_id, {
                      decision: "Approved",
                      review_notes: notes[row.request_id]
                    }), "Request approved.")}>Approve</Button><Button size="sm" variant="secondary" disabled={savingId === row.request_id} onClick={() => act(row.request_id, () => reviewAssetRequest(row.request_id, {
                      decision: "Rejected",
                      review_notes: notes[row.request_id]
                    }), "Request rejected.")}>Reject</Button></div></div>}
      {row.status === "Approved" && <div className="flex min-w-56 gap-2"><select className={fieldClass} value={selected[row.request_id] || ""} onChange={e => setSelected({
                    ...selected,
                    [row.request_id]: e.target.value
                  })}><option value="">Select available asset</option>{assets.filter(asset => asset.status === "Available" && (!row.category_id || Number(asset.category_id) === Number(row.category_id))).map(asset => <option key={asset.asset_id} value={asset.asset_id}>{asset.asset_tag} · {asset.asset_name}</option>)}</select><Button size="sm" disabled={savingId === row.request_id || !selected[row.request_id]} onClick={() => act(row.request_id, () => fulfillAssetRequest(row.request_id, Number(selected[row.request_id])), "Request fulfilled and asset assigned.")}>Fulfill</Button></div>}
      {row.status !== "Pending" && row.status !== "Approved" && (row.asset_tag ? <span className="text-xs text-slate-500">Assigned {row.asset_tag}</span> : <span className="text-xs text-slate-500">{row.review_notes || "—"}</span>)}
    </td></tr>)}{!rows.length && <tr><td colSpan={6}><Empty>No asset requests to review.</Empty></td></tr>}</tbody></table></div>}</section>
  </div>;
}
export { AssetRequests };
