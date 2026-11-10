import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileClock } from 'lucide-react';
import { getMyMonthlyAttendance } from '../../../api/attendance.api';

const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const monthStart = (value) => { const [year, month] = value.split('-').map(Number); return new Date(year, month - 1, 1); };
function exportCsv(rows) {
  const cols = [['Date','attendance_date'],['Check-in','check_in'],['Check-out','check_out'],['Work hours','work_hours'],['Status','status']];
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.map(([title])=>quote(title)).join(','), ...rows.map((row)=>cols.map(([,key])=>quote(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link=document.createElement('a'); link.href=url; link.download='attendance-history.csv'; link.click(); URL.revokeObjectURL(url);
}

export default function AttendanceHistory() {
  const today = iso(new Date());
  const monthAgo = iso(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const [filters, setFilters] = useState({ from: monthAgo, to: today, status: '' });
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const start = monthStart(filters.from); const end = monthStart(filters.to); const months = [];
      for (const date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) months.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
      const responses = await Promise.all(months.map((month) => getMyMonthlyAttendance(month)));
      const all = responses.flatMap((result) => Array.isArray(result) ? result : result?.data || []);
      setRows(all);
    } catch (err) { setError(err?.response?.data?.message || 'Could not load your attendance history.'); }
    finally { setLoading(false); }
  }, [filters.from, filters.to]);
  useEffect(() => { load(); }, [load]);
  const visible = useMemo(() => rows.filter((row) => {
    const date = String(row.attendance_date || row.date || '').slice(0,10);
    return date >= filters.from && date <= filters.to && (!filters.status || String(row.status || '').toLowerCase() === filters.status);
  }).sort((a,b) => String(b.attendance_date || b.date).localeCompare(String(a.attendance_date || a.date))), [rows, filters]);
  return <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><FileClock size={20}/></span><div><h1 className="text-xl font-bold text-slate-950">Attendance History</h1><p className="text-sm text-slate-500">View and filter your past attendance records.</p></div></div><button type="button" onClick={()=>exportCsv(visible)} disabled={!visible.length} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-sm font-semibold text-white hover:bg-[#cf6900] disabled:opacity-50"><Download size={15}/> Export</button></header>
    {error&&<div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4"><label className="text-xs font-semibold text-slate-600">From<input type="date" value={filters.from} max={filters.to} onChange={(event)=>setFilters((current)=>({...current,from:event.target.value}))} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"/></label><label className="text-xs font-semibold text-slate-600">To<input type="date" value={filters.to} min={filters.from} max={today} onChange={(event)=>setFilters((current)=>({...current,to:event.target.value}))} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"/></label><label className="text-xs font-semibold text-slate-600">Status<select value={filters.status} onChange={(event)=>setFilters((current)=>({...current,status:event.target.value}))} className="mt-1 block min-w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All statuses</option>{['present','late','absent','leave','half_day','holiday','weekend'].map((status)=><option key={status} value={status}>{status.replace('_',' ')}</option>)}</select></label><span className="ml-auto pb-2 text-xs text-slate-500">{visible.length} records</span></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{['Date','Check-in','Check-out','Work hours','Status','Location'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visible.length?visible.map((row,index)=><tr key={row.attendance_id||row.attendance_date||index}><td className="px-4 py-3 font-medium">{String(row.attendance_date||row.date||'').slice(0,10)}</td><td className="px-4 py-3">{String(row.check_in||'—').slice(0,5)}</td><td className="px-4 py-3">{String(row.check_out||'—').slice(0,5)}</td><td className="px-4 py-3">{row.work_hours??'—'}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{row.status||'—'}</span></td><td className="px-4 py-3 text-slate-500">{row.location||'—'}</td></tr>):<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">{loading?'Loading attendance history…':'No attendance records in this date range.'}</td></tr>}</tbody></table></div></section>
  </div>;
}
