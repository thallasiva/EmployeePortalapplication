import React, { useEffect, useState } from "react";
import { BookOpen, Laptop } from "lucide-react";
import Button from "../../components/ui/Button";
import { getMyAssets, getMyTraining, updateMyTraining } from "../../api/workforce.api";
import { getErrorMessage } from "../../api/client";

export default function TrainingAndAssets() {
  const [trainings, setTrainings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [notice, setNotice] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const [trainingRows, assetRows] = await Promise.all([getMyTraining(), getMyAssets()]);
      setTrainings(trainingRows || []);
      setAssets(assetRows || []);
    } catch (error) { setNotice(getErrorMessage(error, "Unable to load your development and asset details.")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const setStatus = async (row, status) => {
    setSaving(row.assignment_id);
    setNotice("");
    try { await updateMyTraining(row.assignment_id, status); await load(); }
    catch (error) { setNotice(getErrorMessage(error, "Unable to update training status.")); }
    finally { setSaving(null); }
  };
  return (
    <main className="space-y-6 p-5 md:p-8">
      <header><p className="text-sm font-semibold text-amber-700">EMPLOYEE SERVICES</p><h1 className="mt-1 text-2xl font-bold  text-[#f18200]">My Training &amp; Assets</h1><p className="mt-1 text-sm text-slate-500">Review assigned learning and equipment associated with your profile.</p></header>
      {notice && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">{notice}</div>}
      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading…</p> : <>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 p-5"><BookOpen size={19} className="text-amber-600" /><h2 className="font-semibold text-slate-800">Assigned training</h2></div>
          {!trainings.length ? <p className="p-6 text-sm text-slate-500">No training is currently assigned.</p> : <div className="divide-y divide-slate-100">{trainings.map((row) => <article key={row.assignment_id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h3 className="font-medium text-slate-800">{row.title}</h3><p className="mt-1 text-sm text-slate-500">{row.category || "General"} · Status: {row.status}{row.due_date ? ` · Due ${row.due_date}` : ""}</p></div><div className="flex gap-2">{row.status === "Assigned" && <Button size="sm" variant="secondary" disabled={saving === row.assignment_id} onClick={() => setStatus(row, "In Progress")}>Start training</Button>}{row.status !== "Completed" && <Button size="sm" disabled={saving === row.assignment_id} onClick={() => setStatus(row, "Completed")}>Mark complete</Button>}</div></article>)}</div>}
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 p-5"><Laptop size={19} className="text-amber-600" /><h2 className="font-semibold text-slate-800">My assigned assets</h2></div>
          {!assets.length ? <p className="p-6 text-sm text-slate-500">No company assets are currently assigned to you.</p> : <div className="divide-y divide-slate-100">{assets.map((asset) => <div key={asset.asset_id} className="flex flex-wrap justify-between gap-2 p-5"><div className="font-medium text-slate-800">{asset.asset_name}<p className="mt-1 text-sm font-normal text-slate-500">{asset.asset_tag} · {asset.category || "General"} · {asset.serial_number || "No serial number"}</p></div><span className="text-sm text-slate-500">Issued {asset.assigned_at ? new Date(asset.assigned_at).toLocaleDateString() : "—"}</span></div>)}</div>}
        </section>
      </>}
    </main>
  );
}
