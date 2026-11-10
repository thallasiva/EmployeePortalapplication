import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Button from "../../components/ui/Button";
import { listEmployees } from "../../api/employee.api";
import { listWorkSchedules, saveEmployeeSchedule, resetEmployeeSchedule } from "../../api/workSchedule.api";
import { getErrorMessage } from "../../api/client";

const DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
const blank = { schedule_type: "fixed", work_days: ["mon", "tue", "wed", "thu", "fri"], start_time: "09:00", end_time: "18:00", rotation_pattern: "" };
export default function ShiftManagement() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const [schedules, employeeResult] = await Promise.all([listWorkSchedules(), listEmployees({ limit: 1000, status: "Active" })]);
      setRows(schedules || []);
      setEmployees(employeeResult?.data || []);
    } catch (error) { setNotice(getErrorMessage(error, "Unable to load shift schedules.")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const save = async (event) => {
    event.preventDefault();
    if (!employeeId) { setNotice("Select an employee."); return; }
    setSaving(true);
    setNotice("");
    try {
      await saveEmployeeSchedule(employeeId, form);
      setNotice("Employee schedule saved.");
      setEmployeeId("");
      setForm(blank);
      await load();
    } catch (error) { setNotice(getErrorMessage(error, "Unable to save schedule.")); }
    finally { setSaving(false); }
  };
  const selectEmployee = (id) => {
    setEmployeeId(id);
    const existing = rows.find((row) => String(row.employee_id) === String(id));
    setForm(existing?.schedule_id ? {
      schedule_type: existing.schedule_type,
      work_days: existing.work_days || [],
      start_time: existing.start_time?.slice(0, 5) || "",
      end_time: existing.end_time?.slice(0, 5) || "",
      rotation_pattern: existing.rotation_pattern || "",
    } : blank);
  };
  const reset = async (id) => {
    setSaving(true);
    setNotice("");
    try { await resetEmployeeSchedule(id); setNotice("Schedule reset to company default."); await load(); }
    catch (error) { setNotice(getErrorMessage(error, "Unable to reset schedule.")); }
    finally { setSaving(false); }
  };
  return (
    <main className="space-y-6 ">
      <header><p className="text-sm font-semibold text-amber-700">TIME &amp; ATTENDANCE</p><h1 className="mt-1 text-2xl font-bold  text-[#e87500]">Shift Management</h1><p className="mt-1 text-sm text-slate-500">Set employee-specific work days and hours. Employees can view their roster in Attendance.</p></header>
      {notice && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">{notice}</div>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Clock size={18} /> Assign a schedule</h2>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <select required value={employeeId} onChange={(e) => selectEmployee(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Choose employee</option>{employees.map((employee) => <option key={employee.employee_id} value={employee.employee_id}>{employee.first_name} {employee.last_name || ""} · {employee.emp_code}</option>)}</select>
          <select value={form.schedule_type} onChange={(e) => setForm({ ...form, schedule_type: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="fixed">Fixed schedule</option><option value="rotational">Rotational schedule</option></select>
          <label className="text-sm text-slate-600">Start time<input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm text-slate-600">End time<input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-medium text-slate-700">Work days</legend><div className="flex flex-wrap gap-3">{DAYS.map(([day, label]) => <label key={day} className="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" checked={form.work_days.includes(day)} onChange={(e) => setForm({ ...form, work_days: e.target.checked ? [...form.work_days, day] : form.work_days.filter((item) => item !== day) })} />{label}</label>)}</div></fieldset>
          {form.schedule_type === "rotational" && <input value={form.rotation_pattern} onChange={(e) => setForm({ ...form, rotation_pattern: e.target.value })} placeholder="Rotation pattern details" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />}
          <div className="md:col-span-2"><Button type="submit" loading={saving}>Save schedule</Button></div>
        </form>
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="font-semibold text-slate-800">Employee schedules</h2></div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading schedules…</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Work days</th><th className="px-5 py-3">Hours</th><th className="px-5 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.employee_id}><td className="px-5 py-4 font-medium text-slate-800">{row.employee_name}<div className="text-xs text-slate-500">{row.emp_code}</div></td><td className="px-5 py-4 capitalize text-slate-600">{row.schedule_type || "Company default"}</td><td className="px-5 py-4 text-slate-600">{row.work_days?.join(", ") || "Company default"}</td><td className="px-5 py-4 text-slate-600">{row.start_time ? `${row.start_time.slice(0, 5)}–${row.end_time?.slice(0, 5) || ""}` : "—"}</td><td className="px-5 py-4"><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={saving} onClick={() => selectEmployee(row.employee_id)}>Edit</Button>{row.schedule_id && <Button size="sm" variant="secondary" disabled={saving} onClick={() => reset(row.employee_id)}>Reset</Button>}</div></td></tr>)}
          {!rows.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No active employees found.</td></tr>}</tbody>
        </table></div>}
      </section>
    </main>
  );
}
