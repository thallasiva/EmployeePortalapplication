import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Boxes, CalendarDays, Laptop, UserRoundCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import InteractivePieChart from "../../component/charts/InteractivePieChart";
import { getAssetDashboard } from "../../api/workforce.api";
import { getErrorMessage } from "../../api/client";

const CATEGORY_COLORS = ["#e87500", "#10b981", "#f59e0b", "#a855f7", "#e87500", "#f43f5e"];
const STATUS_COLORS = { Assigned: "#10b981", Available: "#e87500", Maintenance: "#f59e0b", Retired: "#94a3b8" };

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function AssetTrendChart({ rows }) {
  const width = 620;
  const height = 220;
  const padding = { top: 14, right: 12, bottom: 34, left: 34 };
  const max = Math.max(1, ...rows.map((row) => Math.max(Number(row.total_assets), Number(row.allocated))));
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;
  const point = (value, index) => ({
    x: padding.left + (rows.length <= 1 ? chartWidth / 2 : (index / (rows.length - 1)) * chartWidth),
    y: padding.top + chartHeight - (Number(value) / max) * chartHeight,
  });
  const path = (key) => rows.map((row, index) => {
    const { x, y } = point(row[key], index);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  const totalPath = path("total_assets");
  const allocatedPath = path("allocated");
  const last = rows.length ? point(rows[rows.length - 1].total_assets, rows.length - 1) : null;
  const areaPath = last ? `${totalPath} L ${last.x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z` : "";
  return rows.length ? <div className="w-full">
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-blue-500" />Total assets</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-500" />Allocated</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label="Monthly total and allocated asset trend">
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padding.top + chartHeight * (1 - tick);
        return <g key={tick}><line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" /><text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(max * tick)}</text></g>;
      })}
      <path d={areaPath} fill="#e87500" opacity="0.08" /><path d={totalPath} fill="none" stroke="#e87500" strokeWidth="2.5" strokeLinejoin="round" /><path d={allocatedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
      {rows.map((row, index) => {
        const totalPoint = point(row.total_assets, index);
        const allocatedPoint = point(row.allocated, index);
        return <g key={row.month}><circle cx={totalPoint.x} cy={totalPoint.y} r="3" fill="#e87500"><title>{`${row.label}: ${row.total_assets} total assets`}</title></circle><circle cx={allocatedPoint.x} cy={allocatedPoint.y} r="3" fill="#10b981"><title>{`${row.label}: ${row.allocated} allocated`}</title></circle><text x={totalPoint.x} y={height - 10} textAnchor="middle" fontSize="9" fill="#64748b">{row.label}</text></g>;
      })}
    </svg>
  </div> : <p className="py-16 text-center text-sm text-slate-500">Asset history will appear here as inventory and allocations build up.</p>;
}

export default function AssetManagement() {
  const [dashboard, setDashboard] = useState(null);
  const [trendRange, setTrendRange] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getAssetDashboard()
      .then(setDashboard)
      .catch((cause) => setError(getErrorMessage(cause, "Unable to load the asset dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  const summary = dashboard?.summary || { total: 0, allocated: 0, available: 0, maintenance: 0, retired: 0 };
  const cards = [
    { label: "Total assets", value: summary.total, icon: Boxes, tone: "text-[#e87500] bg-blue-50" },
    { label: "Allocated", value: summary.allocated, icon: UserRoundCheck, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Available", value: summary.available, icon: Laptop, tone: "text-[#e87500] bg-blue-50" },
    { label: "Under maintenance", value: summary.maintenance, icon: Wrench, tone: "text-rose-700 bg-rose-50" },
  ];
  const categories = (dashboard?.categories || []).map((item, index) => ({ label: item.category, value: Number(item.count), color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }));
  const status = [
    { label: "In use", value: summary.allocated, color: STATUS_COLORS.Assigned },
    { label: "Available", value: summary.available, color: STATUS_COLORS.Available },
    { label: "Under maintenance", value: summary.maintenance, color: STATUS_COLORS.Maintenance },
    { label: "Retired", value: summary.retired, color: STATUS_COLORS.Retired },
  ].filter((item) => item.value > 0);
  const trend = (dashboard?.trend || []).slice(-trendRange);

  return <div className="space-y-5">
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section aria-label="Asset inventory summary" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></span></div><p className="mt-3 text-3xl font-bold  text-[#e87500]">{loading ? "—" : value}</p><p className="mt-1 text-xs text-slate-500">{label === "Total assets" ? "Company inventory" : `${summary.total ? Math.round((value / summary.total) * 100) : 0}% of total assets`}</p></article>)}
    </section>
    <section className="grid gap-4 2xl:grid-cols-12">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm 2xl:col-span-5"><div className="mb-2 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-800">Asset trend</h2><p className="mt-1 text-xs text-slate-500">Inventory and active allocations over time</p></div><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600"><CalendarDays size={14} /><span className="sr-only">Trend period</span><select value={trendRange} onChange={(event) => setTrendRange(Number(event.target.value))} className="bg-transparent outline-none"><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></label></div>{loading ? <div className="h-56 animate-pulse rounded-lg bg-slate-50" /> : <AssetTrendChart rows={trend} />}</article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm 2xl:col-span-4"><h2 className="font-semibold text-slate-800">Assets by category</h2><p className="mt-1 text-xs text-slate-500">Company inventory breakdown</p><div className="mt-4">{loading ? <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-slate-100" /> : categories.length ? <InteractivePieChart data={categories} size={168} title="Asset counts by category" valueFormatter={(value) => `${Number(value)} assets`} /> : <p className="py-16 text-center text-sm text-slate-500">Add categories to see the breakdown.</p>}</div></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm 2xl:col-span-3"><h2 className="font-semibold text-slate-800">Asset status</h2><p className="mt-1 text-xs text-slate-500">Current inventory distribution</p><div className="mt-5 space-y-4">{loading ? [0, 1, 2].map((item) => <div key={item} className="h-10 animate-pulse rounded bg-slate-50" />) : status.map((item) => { const percent = summary.total ? Math.round((item.value / summary.total) * 100) : 0; return <div key={item.label}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><span className="font-semibold text-slate-700">{item.value} · {percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: item.color }} /></div></div>; })}{!loading && !summary.total && <p className="py-8 text-center text-sm text-slate-500">No inventory to summarize yet.</p>}</div></article>
    </section>
    <section className="grid gap-4 2xl:grid-cols-2">
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-800">Recent allocations</h2><p className="mt-1 text-xs text-slate-500">Latest active asset assignments</p></div><UserRoundCheck size={19} className="text-emerald-600" /></div>{loading ? <p className="p-5 text-sm text-slate-500">Loading allocations…</p> : (dashboard?.recentAllocations || []).length ? <div className="divide-y divide-slate-100">{dashboard.recentAllocations.map((item) => <div key={item.asset_id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{item.asset_name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.asset_tag} · {item.employee_name}</p></div><div className="shrink-0 text-right"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Active</span><p className="mt-1.5 text-[11px] text-slate-500">{formatDate(item.assigned_at)}</p></div></div>)}</div> : <p className="p-8 text-center text-sm text-slate-500">No active allocations yet.</p>}<Link to="/dashboard/assets/allocation" className="flex items-center justify-end gap-1 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-[#e87500] hover:text-blue-800">View all <ArrowUpRight size={14} /></Link></article>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-800">Upcoming alerts</h2><p className="mt-1 text-xs text-slate-500">Maintenance and inventory details to review</p></div><AlertTriangle size={19} className="text-amber-600" /></div>{loading ? <p className="p-5 text-sm text-slate-500">Loading alerts…</p> : (dashboard?.alerts || []).length ? <div className="divide-y divide-slate-100">{dashboard.alerts.map((item) => <div key={`${item.asset_id}-${item.alert}`} className="flex items-center justify-between gap-4 px-5 py-3"><div className="flex min-w-0 items-start gap-2.5"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.status === "Maintenance" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}><AlertTriangle size={13} /></span><div className="min-w-0"><p className="text-sm font-medium text-slate-800">{item.alert}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.asset_name} · {item.asset_tag}</p></div></div><span className="shrink-0 text-[11px] text-slate-500">{formatDate(item.updated_at)}</span></div>)}</div> : <div className="p-8 text-center text-sm text-slate-500">No inventory issues found.</div>}<Link to="/dashboard/assets/maintenance" className="flex items-center justify-end gap-1 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-[#e87500] hover:text-blue-800">View all <ArrowUpRight size={14} /></Link></article>
    </section>
  </div>;
}
