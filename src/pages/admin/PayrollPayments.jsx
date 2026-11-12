import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CircleDollarSign, Loader2, RefreshCw, Save, Search } from "lucide-react";
import { listPayrollPaymentBatches, getPayrollPaymentBatch, reconcilePayrollPaymentBatch } from "../../api/payroll.api";
import { apiErrorToast, successToast } from "../../utils/ToastControllers";
import { getErrorMessage } from "../../api/client";

const inr = (value, currency = "INR") => new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
const badge = (status) => status === "COMPLETED" || status === "PAID" ? "bg-green-50 text-green-700" : status === "FAILED" ? "bg-rose-50 text-rose-700" : status === "PARTIAL" ? "bg-amber-50 text-amber-800" : "bg-orange-50 text-orange-800";
const period = (row) => `${new Date(Number(row.year), Number(row.month) - 1, 1).toLocaleString("en-IN", { month: "long" })} ${row.year}`;

export default function PayrollPayments() {
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBatches = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await listPayrollPaymentBatches({ status: statusFilter || undefined, limit: 100 });
      setBatches(response.data || []);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [statusFilter]);
  useEffect(() => { loadBatches(); }, [loadBatches]);

  const openBatch = useCallback(async (batchId) => {
    setDetailLoading(true); setSelected(null); setDrafts({}); setError("");
    try {
      const detail = await getPayrollPaymentBatch(batchId);
      setSelected(detail);
      setDrafts(Object.fromEntries((detail.items || []).map((item) => [item.payment_item_id, {
        status: item.status,
        payment_reference: item.payment_reference || "",
        failure_reason: item.failure_reason || "",
        paid_amount: Number(item.paid_amount || 0),
      }])));
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setDetailLoading(false); }
  }, []);

  const setDraft = (id, key, value) => setDrafts((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
  const filteredItems = useMemo(() => (selected?.items || []).filter((item) => `${item.employee_name} ${item.emp_code} ${item.department_name || ""}`.toLowerCase().includes(search.trim().toLowerCase())), [selected, search]);
  const changedItems = useMemo(() => (selected?.items || []).filter((item) => {
    const draft = drafts[item.payment_item_id];
    return draft && (draft.status !== item.status || draft.payment_reference !== (item.payment_reference || "") || draft.failure_reason !== (item.failure_reason || "") || Number(draft.paid_amount || 0) !== Number(item.paid_amount || 0));
  }).map((item) => ({ payment_item_id: item.payment_item_id, ...drafts[item.payment_item_id] })), [selected, drafts]);

  const reconcile = async (event) => {
    event.preventDefault();
    if (!selected || !changedItems.length) return;
    setSaving(true);
    try {
      const result = await reconcilePayrollPaymentBatch(selected.payment_batch_id, { items: changedItems });
      setSelected(result);
      setDrafts(Object.fromEntries((result.items || []).map((item) => [item.payment_item_id, { status: item.status, payment_reference: item.payment_reference || "", failure_reason: item.failure_reason || "", paid_amount: Number(item.paid_amount || 0) }])));
      successToast("Bank payment results saved.");
      await loadBatches();
    } catch (e) { apiErrorToast(e, "reconcile payroll payments"); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-[#f7f8fa] p-4 md:p-7">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {selected && <button type="button" onClick={() => { setSelected(null); setSearch(""); }} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600" aria-label="Back to batches"><ArrowLeft size={17} /></button>}
        <div><h1 className="m-0 text-xl font-extrabold text-gray-900">Payment reconciliation</h1><p className="mt-1 text-sm text-gray-500">{selected ? `${selected.batch_reference} · ${period(selected)}` : "Review exported bank batches and record confirmed results."}</p></div>
      </div>
      <button type="button" onClick={loadBatches} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh</button>
    </header>

    <div className="mb-4 flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900"><AlertCircle size={16} className="mt-0.5 shrink-0" /><p className="m-0">Creating a bank file does not mark salaries as paid. Record <strong>Paid</strong> only when you have a bank confirmation/reference. This screen does not initiate bank transfers.</p></div>
    {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

    {!selected ? <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4"><div className="flex items-center gap-2 text-sm font-bold text-gray-800"><CircleDollarSign size={17} className="text-[#e87500]" /> Bank payment batches</div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">All statuses</option><option value="AWAITING_RECONCILIATION">Awaiting reconciliation</option><option value="PARTIAL">Partial</option><option value="COMPLETED">Completed</option><option value="FAILED">Failed</option></select></div>
      {loading ? <div className="p-10 text-center text-sm text-gray-500"><Loader2 size={18} className="mr-2 inline animate-spin" />Loading batches…</div> : batches.length ? <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-sm"><thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Employees</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Pending</th><th className="px-4 py-3 text-right">Failed</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-gray-100">{batches.map((batch) => <tr key={batch.payment_batch_id}><td className="px-4 py-3 font-semibold text-gray-800">{batch.batch_reference}</td><td className="px-4 py-3 text-gray-600">{period(batch)}</td><td className="px-4 py-3 text-right">{batch.employee_count}</td><td className="px-4 py-3 text-right font-semibold">{inr(batch.batch_amount, batch.currency_code)}</td><td className="px-4 py-3 text-right">{batch.pending_count}</td><td className="px-4 py-3 text-right text-rose-700">{batch.failed_count}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${badge(batch.status)}`}>{String(batch.status).replace(/_/g, " ")}</span></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openBatch(batch.payment_batch_id)} className="font-bold text-[#b45309] hover:underline">Open</button></td></tr>)}</tbody></table></div> : <div className="p-12 text-center"><CircleDollarSign size={26} className="mx-auto mb-2 text-gray-300" /><p className="m-0 text-sm font-semibold text-gray-700">No payment batches yet</p><p className="mt-1 text-xs text-gray-500">Approve payroll and export its bank file from the Payroll Overview to create a batch.</p></div>}
    </section> : detailLoading ? <div className="rounded-xl border bg-white p-12 text-center text-sm text-gray-500"><Loader2 size={18} className="mr-2 inline animate-spin" />Loading batch…</div> : <form onSubmit={reconcile} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4"><div><h2 className="m-0 text-sm font-bold text-gray-800">Employee payment results</h2><p className="mt-1 text-xs text-gray-500">Update only rows included in your bank response. Paid rows require a bank reference.</p></div><label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"><Search size={14} className="text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee" className="w-40 text-sm outline-none" /></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500"><tr><th className="px-3 py-3">Employee</th><th className="px-3 py-3">Department</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-right">Paid to date</th><th className="px-3 py-3">Result</th><th className="px-3 py-3">Bank reference / failure reason</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredItems.map((item) => { const draft = drafts[item.payment_item_id] || {}; const resultStatus = draft.status || item.status; return <tr key={item.payment_item_id}><td className="px-3 py-3 font-semibold text-gray-800">{item.employee_name}<span className="ml-1 text-xs font-normal text-gray-400">{item.emp_code}</span></td><td className="px-3 py-3 text-gray-600">{item.department_name || "—"}</td><td className="px-3 py-3 text-right font-semibold">{inr(item.amount, selected.currency_code)}</td><td className="px-3 py-3 text-right text-gray-600">{inr(item.paid_amount, selected.currency_code)}</td><td className="px-3 py-3"><select value={resultStatus} disabled={item.status === "PAID"} onChange={(e) => setDraft(item.payment_item_id, "status", e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"><option value="PENDING">Pending</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="FAILED">Failed</option></select></td><td className="px-3 py-3">{resultStatus === "PARTIAL" ? <div className="grid gap-1"><input type="number" min="0.01" max={Number(item.amount) - 0.01} step="0.01" value={draft.paid_amount || ""} onChange={(e) => setDraft(item.payment_item_id, "paid_amount", e.target.value)} required placeholder="Cumulative paid amount" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" /><input value={draft.payment_reference || ""} onChange={(e) => setDraft(item.payment_item_id, "payment_reference", e.target.value)} required placeholder="Bank confirmation reference" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" /></div> : resultStatus === "PAID" ? <input value={draft.payment_reference || ""} disabled={item.status === "PAID"} onChange={(e) => setDraft(item.payment_item_id, "payment_reference", e.target.value)} required placeholder="Bank confirmation reference" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs disabled:bg-gray-50" /> : resultStatus === "FAILED" ? <input value={draft.failure_reason || ""} onChange={(e) => setDraft(item.payment_item_id, "failure_reason", e.target.value)} required placeholder="Reason reported by bank" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" /> : <span className="text-xs text-gray-400">No bank result recorded</span>}</td></tr>; })}{!filteredItems.length && <tr><td colSpan={6} className="p-10 text-center text-sm text-gray-500">No employees match this search.</td></tr>}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4"><span className="text-xs text-gray-500">{changedItems.length} changed row(s) ready to save</span><button type="submit" disabled={saving || !changedItems.length} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving…" : "Save reconciliation"}</button></div>
    </form>}
  </main>;
}
