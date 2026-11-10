import React from 'react';
import { RefreshCw } from 'lucide-react';

export function PageHeader({ eyebrow = 'TIME & ATTENDANCE', title, description, action, onRefresh, loading }) {
  return <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-cyan-700">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="flex items-center gap-2">{onRefresh && <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</button>}{action}</div></header>;
}

export function MetricCard({ label, value, note, tone = 'cyan', icon: Icon }) {
  const tones = { cyan: 'bg-cyan-50 text-cyan-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>{Icon && <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon size={19}/></span>}</div>{note && <p className="mt-2 text-xs text-slate-500">{note}</p>}</div>;
}

export function Panel({ title, children, action }) { return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><h2 className="font-semibold text-slate-900">{title}</h2>{action}</div>{children}</section>; }

export function StatusBadge({ status }) {
  const normalized = String(status || 'Unknown').toLowerCase();
  const tone = ['present', 'approved', 'active'].includes(normalized) ? 'bg-emerald-100 text-emerald-800' : ['late', 'pending'].includes(normalized) ? 'bg-amber-100 text-amber-800' : ['rejected', 'absent', 'inactive'].includes(normalized) ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status || 'Unknown'}</span>;
}

export function EmptyRows({ colSpan, children = 'No records match these filters.' }) { return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-500">{children}</td></tr>; }

export function Table({ headers, children, minWidth = '760px' }) { return <div className="overflow-x-auto"><table className="w-full text-left text-sm" style={{ minWidth }}><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div>; }

export function Alert({ children, tone = 'red' }) { return <div role="status" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone === 'red' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-cyan-200 bg-cyan-50 text-cyan-900'}`}>{children}</div>; }

export function FilterInput(props) { return <input {...props} className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 ${props.className || ''}`} />; }
