import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getLoggedInUser } from '../../../lib/dateUtils';
import { getMyMonthlyAttendance } from '../../../api/attendance.api';

const STATUS = {
  present: ['Present', 'bg-emerald-100 text-emerald-800'],
  late: ['Late', 'bg-amber-100 text-amber-800'],
  absent: ['Absent', 'bg-rose-100 text-rose-800'],
  leave: ['Leave', 'bg-violet-100 text-violet-800'],
  holiday: ['Holiday', 'bg-slate-200 text-slate-700'],
  weekend: ['Week Off', 'bg-slate-100 text-slate-500'],
  half_day: ['Half Day', 'bg-sky-100 text-sky-800'],
};
const asIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function monthCells(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  return [...Array(first).fill(null), ...Array.from({ length: total }, (_, index) => index + 1)];
}
function exportRows(rows, month) {
  const columns = ['attendance_date', 'status', 'check_in', 'check_out', 'work_hours'];
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => quote(row[column])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `monthly-attendance-${month}.csv`; link.click(); URL.revokeObjectURL(url);
}

export default function AttendanceMuster() {
  const user = getLoggedInUser();
  const [month, setMonth] = useState(() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(asIso(new Date()));
  const [year, monthNumber] = month.split('-').map(Number);
  useEffect(() => {
    setLoading(true); setError('');
    getMyMonthlyAttendance({ year, month: monthNumber })
      .then((result) => setRows(Array.isArray(result) ? result : result?.data || []))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load monthly attendance.'))
      .finally(() => setLoading(false));
  }, [year, monthNumber]);
  const dateMap = useMemo(() => new Map(rows.map((row) => [String(row.attendance_date || row.date || '').slice(0, 10), row])), [rows]);
  const days = useMemo(() => monthCells(year, monthNumber - 1), [year, monthNumber]);
  const summary = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, leave: 0, holiday: 0, weekend: 0, half_day: 0 };
    const totalDays = new Date(year, monthNumber, 0).getDate();
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, monthNumber - 1, day);
      const row = dateMap.get(asIso(date));
      const raw = String(row?.status || '').toLowerCase();
      const key = raw === 'on_leave' ? 'leave' : raw === 'week_off' || raw === 'week off' ? 'weekend' : raw;
      if (counts[key] !== undefined) counts[key] += 1;
      else if (!row && (date.getDay() === 0 || date.getDay() === 6)) counts.weekend += 1;
      else if (!row && date < new Date(new Date().setHours(0, 0, 0, 0))) counts.absent += 1;
    }
    return counts;
  }, [dateMap, year, monthNumber]);
  const workingDays = Math.max(0, new Date(year, monthNumber, 0).getDate() - summary.weekend - summary.holiday);
  const attendanceRate = workingDays ? Math.min(100, Math.round(((summary.present + summary.late + summary.half_day) / workingDays) * 100)) : 0;
  const monthLabel = new Date(year, monthNumber - 1, 15).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const selected = dateMap.get(selectedDate);
  const setMonthOffset = (offset) => { const date = new Date(year, monthNumber - 1 + offset, 1); setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`); };
  const donutStyle = { background: `conic-gradient(#16a34a 0 ${attendanceRate}%, #e2e8f0 ${attendanceRate}% 100%)` };

  return <div className="space-y-4 bg-slate-50 p-3 sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><CalendarDays size={20}/></span><div><h1 className="text-xl font-bold text-slate-950">Monthly Attendance</h1><p className="text-sm text-slate-500">View your complete monthly attendance with status.</p></div></div><label className="text-xs font-semibold text-slate-600">View by <select className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option>Month</option></select></label></header>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1"><button type="button" onClick={()=>setMonthOffset(-1)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft size={18}/></button><strong className="min-w-36 text-center text-sm">{monthLabel}</strong><button type="button" onClick={()=>setMonthOffset(1)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Next month"><ChevronRight size={18}/></button></div><button type="button" onClick={()=>exportRows(rows,month)} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-sm font-semibold text-white hover:bg-[#cf6900] disabled:opacity-50"><Download size={15}/> Export</button></div>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3 text-center"><h2 className="font-semibold text-slate-900">{monthLabel}</h2></div><div className="p-3 sm:p-5"><div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day)=><span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{days.map((day,index)=>{if(!day)return <span key={`pad-${index}`} className="min-h-[58px] sm:min-h-[72px]"/>;const date=new Date(year,monthNumber-1,day);const iso=asIso(date);const row=dateMap.get(iso);const raw=String(row?.status||'').toLowerCase();const key=raw==='on_leave'?'leave':raw==='week_off'?'weekend':raw||(date.getDay()===0||date.getDay()===6?'weekend':date<new Date(new Date().setHours(0,0,0,0))?'absent':'');const status=STATUS[key];const current=iso===asIso(new Date());return <button type="button" key={iso} onClick={()=>setSelectedDate(iso)} className={`min-h-[58px] rounded-lg border p-1.5 text-left transition sm:min-h-[72px] ${selectedDate===iso?'border-[#e87500] bg-orange-50 ring-1 ring-orange-200':status?.[0]==='Absent'?'border-rose-100 bg-rose-50/40':'border-slate-100 bg-white hover:border-orange-200'}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${current?'bg-[#e87500] text-white':'text-slate-800'}`}>{day}</span>{status&&<span className={`mt-1 block truncate rounded px-1 py-0.5 text-[9px] font-bold ${status[1]}`}>{status[0]}</span>}</button>})}</div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">{[['Present','bg-emerald-500'],['Absent','bg-rose-500'],['Late','bg-amber-500'],['Leave','bg-violet-500'],['Holiday / Week Off','bg-slate-400']].map(([label,color])=><span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"><i className={`h-2 w-2 rounded-full ${color}`}/>{label}</span>)}</div></div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="font-semibold text-slate-900">Monthly Summary – {monthLabel}</h2><div className="mt-4 grid gap-4 md:grid-cols-[1fr_170px]"><div className="divide-y divide-slate-100">{[['Total Working Days',workingDays],['Present Days',summary.present],['Absent Days',summary.absent],['Late Days',summary.late],['Leave Days',summary.leave],['Holidays / Week Offs',summary.holiday+summary.weekend]].map(([label,value])=><div key={label} className="flex justify-between py-2.5 text-sm"><span className="text-slate-600">{label}</span><b className="text-slate-900">{loading?'—':value}</b></div>)}</div><div className="grid place-items-center"><div className="grid h-36 w-36 place-items-center rounded-full" style={donutStyle}><div className="grid h-24 w-24 place-content-center rounded-full bg-white text-center"><b className="text-2xl text-slate-900">{loading?'—':`${attendanceRate}%`}</b><span className="text-[11px] text-slate-500">Attendance</span></div></div></div></div><div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{selectedDate}: {selected?.status || 'No record'} · {selected?.check_in ? String(selected.check_in).slice(0,5) : '—'} to {selected?.check_out ? String(selected.check_out).slice(0,5) : '—'}</div></section>
    </div>
  </div>;
}
