import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, FileClock, FileText, Network, UserRound, Users } from 'lucide-react';
import { listAttendance, listRegularizations } from '../../../api/attendance.api';
import { listDepartments } from '../../../api/department.api';
import { PageHeader, Panel, Table, EmptyRows, FilterInput, Alert, StatusBadge } from './shared';

const TYPES = [
  ['Attendance Summary', 'Present, absent, late and leave', CalendarDays],
  ['Employee Attendance', 'Detailed attendance by employee', UserRound],
  ['Department Report', 'Attendance grouped by department', Network],
  ['Shift Report', 'Shift-wise attendance records', FileClock],
  ['Overtime Report', 'Employees with extended hours', FileText],
  ['Correction Requests', 'Attendance correction history', Users],
];
const iso = (date) => date.toLocaleDateString('en-CA');
const esc = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
function download(rows, filename, columns) {
  const csv = [columns.join(','), ...rows.map((row) => columns.map((key) => esc(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AttendanceReports() {
  const end = iso(new Date());
  const start = iso(new Date(Date.now() - 6 * 86400000));
  const [filters, setFilters] = useState({ from_date: start, to_date: end, department_id: '', report_type: 'Attendance Summary' });
  const [rows, setRows] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { listDepartments().then((result) => setDepartments(Array.isArray(result) ? result : result?.data || [])).catch(() => setDepartments([])); }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (filters.report_type === 'Correction Requests') {
        const result = await listRegularizations({ from_date: filters.from_date, to_date: filters.to_date, department_id: filters.department_id || undefined, limit: 1000 });
        setCorrections((result?.data || []).map((row) => ({
          ...row,
          request_type: row.requested_check_in && row.requested_check_out ? 'Check-in & out' : row.requested_check_in ? 'Check-in' : 'Check-out',
          requested_time: [row.requested_check_in, row.requested_check_out].filter(Boolean).join(' – ') || '—',
        })));
      } else {
        const result = await listAttendance({ from_date: filters.from_date, to_date: filters.to_date, department_id: filters.department_id || undefined, limit: 1000 });
        setRows(result?.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not generate report.');
    } finally { setLoading(false); }
  }, [filters.from_date, filters.to_date, filters.department_id, filters.report_type]);
  useEffect(() => { generate(); }, [generate]);

  const departmentRows = useMemo(() => {
    const grouped = new Map();
    for (const row of rows) {
      const name = row.department_name || 'Unassigned';
      const item = grouped.get(name) || { name, total: 0, present: 0, late: 0, absent: 0, leave: 0 };
      item.total += 1;
      if (row.status === 'present') item.present += 1;
      if (row.status === 'late') item.late += 1;
      if (row.status === 'absent') item.absent += 1;
      if (row.status === 'leave') item.leave += 1;
      grouped.set(name, item);
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);
  const overtimeRows = useMemo(() => rows.filter((row) => Number(row.work_hours || 0) > 8), [rows]);
  const isDepartments = filters.report_type === 'Department Report';
  const isCorrections = filters.report_type === 'Correction Requests';
  const shownRows = isCorrections ? corrections.filter((row) => {
    const date = String(row.attendance_date || '').slice(0, 10);
    return date >= filters.from_date && date <= filters.to_date
      && (!filters.department_id || String(row.department_id) === String(filters.department_id));
  }) : isDepartments ? departmentRows : filters.report_type === 'Overtime Report' ? overtimeRows : rows;
  const headers = isCorrections
    ? ['Request ID', 'Employee', 'Date', 'Type', 'Requested time', 'Status']
    : isDepartments ? ['Department', 'Records', 'Present', 'Late', 'Absent', 'Leave']
      : ['Employee ID', 'Employee', 'Department', 'Date', 'Shift', 'Check-in', 'Check-out', 'Work hours', 'Status'];
  const exportColumns = isCorrections ? ['regularization_id', 'employee_name', 'attendance_date', 'request_type', 'requested_time', 'status']
    : isDepartments ? ['name', 'total', 'present', 'late', 'absent', 'leave']
      : ['emp_code', 'employee_name', 'department_name', 'attendance_date', 'shift', 'check_in', 'check_out', 'work_hours', 'status'];

  return <div>
    <PageHeader title="Attendance Reports" description="Generate company-scoped attendance summaries and download the selected report." onRefresh={generate} loading={loading} action={<button type="button" onClick={() => download(shownRows, 'attendance-report.csv', exportColumns)} disabled={!shownRows.length} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Download size={15} /> Export CSV</button>} />
    {error && <Alert>{error}</Alert>}
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{TYPES.map(([name, detail, Icon]) => <button type="button" key={name} onClick={() => setFilters((current) => ({ ...current, report_type: name }))} className={filters.report_type === name ? 'rounded-xl border border-blue-300 bg-blue-50 p-4 text-left shadow-sm' : 'rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300'}><div className="flex items-center gap-3"><span className="rounded-lg bg-blue-100 p-2 text-blue-700"><Icon size={19} /></span><span><b className="block text-sm">{name}</b><small className="text-xs text-slate-500">{detail}</small></span></div></button>)}</div>
    <Panel title={filters.report_type}>
      <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4"><FilterInput aria-label="Start date" type="date" value={filters.from_date} onChange={(event) => setFilters({ ...filters, from_date: event.target.value })} /><FilterInput aria-label="End date" type="date" value={filters.to_date} onChange={(event) => setFilters({ ...filters, to_date: event.target.value })} /><select aria-label="Department" value={filters.department_id} onChange={(event) => setFilters({ ...filters, department_id: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All departments</option>{departments.map((department) => <option key={department.department_id} value={department.department_id}>{department.department_name}</option>)}</select><span className="ml-auto self-center text-xs text-slate-500">{shownRows.length} rows</span></div>
      <Table headers={headers} minWidth="820px"><>{shownRows.length ? isDepartments
        ? departmentRows.map((row) => <tr key={row.name}><td className="px-4 py-3 font-medium">{row.name}</td><td className="px-4 py-3">{row.total}</td><td className="px-4 py-3">{row.present}</td><td className="px-4 py-3">{row.late}</td><td className="px-4 py-3">{row.absent}</td><td className="px-4 py-3">{row.leave}</td></tr>)
        : isCorrections ? corrections.map((row) => <tr key={row.regularization_id}><td className="px-4 py-3 font-medium">COR-{row.regularization_id}</td><td className="px-4 py-3">{row.employee_name || '—'}</td><td className="px-4 py-3">{String(row.attendance_date || '').slice(0, 10)}</td><td className="px-4 py-3">{row.request_type || '—'}</td><td className="px-4 py-3">{row.requested_time || '—'}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td></tr>)
          : shownRows.map((row) => <tr key={row.attendance_id}><td className="px-4 py-3 font-medium">{row.emp_code || row.employee_id}</td><td className="px-4 py-3">{row.employee_name || '—'}</td><td className="px-4 py-3">{row.department_name || '—'}</td><td className="px-4 py-3">{String(row.attendance_date || '').slice(0, 10)}</td><td className="px-4 py-3">{row.shift || '—'}</td><td className="px-4 py-3">{String(row.check_in || '—').slice(0, 5)}</td><td className="px-4 py-3">{String(row.check_out || '—').slice(0, 5)}</td><td className="px-4 py-3">{row.work_hours ?? '—'}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td></tr>)
        : <EmptyRows colSpan={headers.length}>{loading ? 'Generating report…' : 'No rows for this report and date range.'}</EmptyRows>}</></Table>
    </Panel>
  </div>;
}
