import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Send } from 'lucide-react';
import apiClient, { unwrap } from '../../../api/client';
import { getMyMonthlyAttendance } from '../../../api/attendance.api';

const dateForInput = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const duration = (minutes) => Number.isFinite(minutes) ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '—';
const hoursToMinutes = (value) => {
  if (typeof value === 'number') return Math.round(value * 60);
  const normalized = String(value || '').trim();
  const clock = normalized.match(/^(\d+):(\d{1,2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const decimal = Number(normalized);
  return Number.isFinite(decimal) ? Math.round(decimal * 60) : 0;
};

export default function WorkHoursOvertime() {
  const [rows, setRows] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ work_date: dateForInput(), overtime_minutes: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('work-hours');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const date = new Date();
      const [attendance, overtime] = await Promise.all([
        getMyMonthlyAttendance({ year: date.getFullYear(), month: date.getMonth() + 1 }),
        apiClient.get('/attendance/overtime').then(unwrap),
      ]);
      setRows(Array.isArray(attendance) ? attendance : attendance?.data || []);
      setRequests(Array.isArray(overtime) ? overtime : []);
    } catch (err) { setError(err?.response?.data?.message || 'Could not load work hour details.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const totalMinutes = useMemo(() => rows.reduce((total, row) => total + hoursToMinutes(row.work_hours), 0), [rows]);
  const approvedMinutes = requests.filter((row) => String(row.status).toLowerCase() === 'approved').reduce((total, row) => total + Number(row.overtime_minutes || 0), 0);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setSubmitting(true);
    try {
      await apiClient.post('/attendance/overtime', { ...form, overtime_minutes: Number(form.overtime_minutes) }).then(unwrap);
      setNotice('Overtime request submitted for approval.');
      setForm((current) => ({ ...current, overtime_minutes: '', reason: '' }));
      await load();
    } catch (err) { setError(err?.response?.data?.message || 'Could not submit overtime request.'); }
    finally { setSubmitting(false); }
  };
  return <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
    <header className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><Clock3 size={20}/></span><div><h1 className="text-xl font-bold text-slate-950">Work Hours &amp; Overtime</h1><p className="mt-0.5 text-sm text-slate-500">Track your daily work hours and overtime requests.</p></div></header>
    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}{notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock3 size={15}/> Recorded hours this month</span><b className="mt-2 block text-2xl text-slate-950">{duration(totalMinutes)}</b></div><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex items-center gap-2 text-xs font-medium text-slate-500"><CheckCircle2 size={15}/> Approved overtime</span><b className="mt-2 block text-2xl text-slate-950">{duration(approvedMinutes)}</b></div><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock3 size={15}/> Pending requests</span><b className="mt-2 block text-2xl text-slate-950">{requests.filter((row) => row.status === 'Pending').length}</b></div></div>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-6 border-b border-slate-200 px-4">
        {[['work-hours','Work Hours'],['overtime','Overtime']].map(([key,label])=><button key={key} type="button" onClick={()=>setActiveTab(key)} className={`border-b-2 px-1 py-3 text-sm font-semibold ${activeTab===key?'border-[#e87500] text-[#e87500]':'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>)}
      </div>
      {activeTab==='work-hours' ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{['Date','Check-in','Check-out','Work Hours','Overtime','Status'].map((heading)=><th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row,index)=><tr key={row.attendance_id||row.attendance_date||index}><td className="px-4 py-3">{String(row.attendance_date||row.date||'').slice(0,10)}</td><td className="px-4 py-3">{String(row.check_in||'—').slice(0,5)}</td><td className="px-4 py-3">{String(row.check_out||'—').slice(0,5)}</td><td className="px-4 py-3 font-semibold">{row.work_hours??'—'}</td><td className="px-4 py-3">{row.overtime_hours??'—'}</td><td className="px-4 py-3 capitalize">{row.status||'—'}</td></tr>):<tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">{loading?'Loading work hours…':'No work hour records this month.'}</td></tr>}</tbody></table></div> : <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200"><h2 className="border-b border-slate-100 px-4 py-3.5 font-semibold text-slate-900">Overtime request history</h2><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr>{['Date','Hours','Reason','Status'].map((heading)=><th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{requests.length?requests.map((row)=><tr key={row.overtime_request_id}><td className="px-4 py-3">{String(row.work_date).slice(0,10)}</td><td className="px-4 py-3">{duration(Number(row.overtime_minutes||0))}</td><td className="px-4 py-3">{row.reason}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{row.status}</span></td></tr>):<tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No overtime requests yet.</td></tr>}</tbody></table></div></section>
        <section className="rounded-xl border border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Request overtime</h2><p className="mt-1 text-xs text-slate-500">Your manager will review the date, duration, and reason.</p><form onSubmit={submit} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-slate-600">Work date<input required type="date" max={dateForInput()} value={form.work_date} onChange={(event)=>setForm({...form,work_date:event.target.value})} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></label><label className="block text-xs font-semibold text-slate-600">Overtime minutes<input required type="number" min="1" max="1440" value={form.overtime_minutes} onChange={(event)=>setForm({...form,overtime_minutes:event.target.value})} placeholder="For example, 90" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></label><label className="block text-xs font-semibold text-slate-600">Reason<textarea required minLength="3" maxLength="255" rows="3" value={form.reason} onChange={(event)=>setForm({...form,reason:event.target.value})} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></label><button disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf6900] disabled:opacity-50"><Send size={15}/>{submitting?'Submitting…':'Submit overtime'}</button></form></section>
      </div>}
    </section>
  </div>;
}
