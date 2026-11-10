import React, { useCallback, useEffect, useState } from 'react';
import { Activity, CalendarDays, Clock3, UserCheck, UserRoundX, UsersRound } from 'lucide-react';
import { getAttendanceAnalytics, getAttendanceDashboard, listAttendance } from '../../../api/attendance.api';
import { PageHeader, MetricCard, Panel, StatusBadge, Table, EmptyRows, Alert } from './shared';

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const weekStart = (date) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()-6); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export default function AttendanceDashboard() {
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState({}); const [rows, setRows] = useState([]); const [analytics, setAnalytics] = useState({}); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [stats, records, trend] = await Promise.all([
        getAttendanceDashboard(date),
        listAttendance({ from_date: date, to_date: date, limit: 8 }),
        getAttendanceAnalytics({ from_date: weekStart(date), to_date: date }),
      ]);
      setSummary(stats || {}); setRows(records?.data || []); setAnalytics(trend || {});
    } catch (err) { setError(err?.response?.data?.message || 'Attendance dashboard could not be loaded.'); }
    finally { setLoading(false); }
  }, [date]);
  useEffect(() => { load(); }, [load]);
  const metricData = [
    ['Total Employees', summary.total_employees ?? '—', 'Employees in this company', UsersRound, 'cyan'],
    ['Present', summary.present_today ?? '—', 'Checked in today', UserCheck, 'green'],
    ['Absent', summary.absent_today ?? '—', 'Today', UserRoundX, 'red'],
    ['Late Arrivals', summary.late_today ?? '—', 'Today', Clock3, 'amber'],
    ['On Leave', summary.on_leave_today ?? '—', 'Approved leave', CalendarDays, 'violet'],
  ];
  const trend = analytics.weekly || []; const max = Math.max(1, ...trend.map((item) => Number(item.present || 0)));
  return <div><PageHeader title="Attendance Dashboard" description="Company-wide attendance overview, daily trends, and recent check-ins." loading={loading} onRefresh={load} action={<label className="text-xs font-medium text-slate-500">Report date <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" /></label>} />
    {error && <Alert>{error}</Alert>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metricData.map(([label,value,note,Icon,tone]) => <MetricCard key={label} label={label} value={value} note={note} icon={Icon} tone={tone}/>)}</div>
    <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Panel title="Attendance Trend · last 7 days"><div className="p-5">{trend.length ? <div className="flex h-48 items-end justify-around gap-3 border-b border-l border-slate-200 px-3">{trend.map((item, index) => <div key={`${item.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-slate-500">{item.present}</span><div title={`${item.present} present · ${item.absent} absent`} className="w-full max-w-10 rounded-t-md bg-cyan-500" style={{ height: `${Math.max(5, (Number(item.present || 0) / max) * 78)}%` }} /><span className="pb-2 text-[10px] text-slate-500">{item.label}</span></div>)}</div> : <div className="grid h-48 place-items-center text-sm text-slate-500">No trend data for this period.</div>}</div></Panel>
      <Panel title="Today's workforce"><div className="space-y-4 p-5">{[['Present', summary.present_today, 'bg-emerald-500'], ['Late', summary.late_today, 'bg-amber-500'], ['Absent', summary.absent_today, 'bg-rose-500'], ['On Leave', summary.on_leave_today, 'bg-violet-500']].map(([label,value,color]) => { const total = Number(summary.total_employees || 0); const pct = total ? Math.min(100, Number(value || 0) / total * 100) : 0; return <div key={label}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{label}</span><b>{value ?? '—'}{total ? ` · ${Math.round(pct)}%` : ''}</b></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }}/></div></div>; })}<div className="flex items-center gap-2 border-t pt-4 text-sm text-slate-500"><Activity size={16}/> Average hours: <b className="text-slate-800">{summary.avg_hours_per_day ?? '—'}</b></div></div></Panel>
    </div>
    <div className="mt-5"><Panel title="Recent attendance"><Table headers={['Employee','Department','Date','Check-in','Check-out','Hours','Status']}><>{rows.length ? rows.map((row) => <tr key={row.attendance_id}><td className="px-4 py-3 font-medium">{row.employee_name || row.emp_code || `Employee ${row.employee_id}`}</td><td className="px-4 py-3 text-slate-600">{row.department_name || '—'}</td><td className="px-4 py-3">{String(row.attendance_date || '').slice(0,10) || '—'}</td><td className="px-4 py-3">{String(row.check_in || '—').slice(0,5)}</td><td className="px-4 py-3">{String(row.check_out || '—').slice(0,5)}</td><td className="px-4 py-3">{row.work_hours ?? '—'}</td><td className="px-4 py-3"><StatusBadge status={row.status}/></td></tr>) : <EmptyRows colSpan={7}>{loading ? 'Loading attendance…' : 'No attendance records found for this day.'}</EmptyRows>}</></Table></Panel></div>
  </div>;
}
