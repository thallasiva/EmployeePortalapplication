import React, { useEffect, useState } from "react";
import { ClipboardList, Laptop } from "lucide-react";
import Button from "../../components/ui/Button";
import { getErrorMessage } from "../../api/client";
import { createAssetRequest, listAssetCategories, listMyAssetRequests } from "../../api/workforce.api";

const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const initialForm = { request_type: "New Asset", category_id: "", justification: "", priority: "Medium" };
const statusClass = { Pending: "bg-amber-50 text-amber-700", Approved: "bg-blue-50 text-[#e87500]", Rejected: "bg-red-50 text-red-700", Fulfilled: "bg-emerald-50 text-emerald-700" };

export default function EmployeeAssetRequest() {
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryRows, requestRows] = await Promise.all([listAssetCategories(false), listMyAssetRequests()]);
      setCategories(categoryRows || []);
      setRequests(requestRows || []);
    } catch (cause) {
      setError(getErrorMessage(cause, "Unable to load your asset requests."));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setNotice(""); setError("");
    try {
      await createAssetRequest({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
      });
      setForm(initialForm);
      setNotice("Your asset request has been submitted.");
      await load();
    } catch (cause) {
      setError(getErrorMessage(cause, "Unable to submit your request."));
    } finally { setSaving(false); }
  };
  return (
    <main className="space-y-6 p-5 md:p-8">
      <header className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#e87500]"><Laptop size={22} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-[#e87500]">Employee Services</p><h1 className="mt-1 text-2xl font-bold  text-[#e87500]">Asset Requests</h1><p className="mt-1 text-sm text-slate-500">Request equipment or accessories and track your request status.</p></div></header>
      {notice && <div role="status" className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{notice}</div>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Submit a request</h2>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <label className="text-xs font-medium text-slate-600">Request type<select className={`${fieldClass} mt-1`} value={form.request_type} onChange={(e) => setForm({ ...form, request_type: e.target.value })}><option>New Asset</option><option>Accessory</option><option>Replacement</option></select></label>
          <label className="text-xs font-medium text-slate-600">Category<select className={`${fieldClass} mt-1`} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Any category</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.category_name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">Priority<select className={`${fieldClass} mt-1`} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label className="text-xs font-medium text-slate-600 lg:col-span-3">Business justification<textarea required minLength={5} maxLength={1000} rows={4} className={`${fieldClass} mt-1`} placeholder="Explain what equipment is needed and why." value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></label>
          <div className="lg:col-span-3"><Button type="submit" loading={saving}>Submit request</Button></div>
        </form>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5"><ClipboardList size={18} className="text-blue-600" /><div><h2 className="font-semibold text-slate-800">My request history</h2><p className="mt-1 text-xs text-slate-500">{requests.length} requests</p></div></div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading requests…</p> : requests.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Review notes</th></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={request.request_id}><td className="px-5 py-4 font-medium text-slate-800">{request.request_type}<p className="mt-1 max-w-64 truncate text-xs font-normal text-slate-500">{request.justification}</p></td><td className="px-5 py-4">{request.category_name || "Any"}</td><td className="px-5 py-4">{request.created_at ? new Date(request.created_at).toLocaleDateString() : "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[request.status] || "bg-slate-100 text-slate-600"}`}>{request.status}</span>{request.asset_tag && <p className="mt-1 text-xs text-slate-500">Assigned: {request.asset_tag}</p>}</td><td className="px-5 py-4 text-slate-500">{request.review_notes || "—"}</td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-slate-500">You haven’t submitted any asset requests.</p>}
      </section>
    </main>
  );
}
