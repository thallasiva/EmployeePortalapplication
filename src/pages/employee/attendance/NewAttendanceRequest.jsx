import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Send } from 'lucide-react';
import { createRegularization } from '../../../api/attendance.api';
import { getLoggedInUser } from '../../../lib/dateUtils';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function NewAttendanceRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getLoggedInUser();
  const [form, setForm] = useState({ attendance_date: location.state?.prefillDate || '', request_type: 'both', requested_check_in: '', requested_check_out: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createRegularization({
        employee_id: Number(user.employeeId),
        attendance_date: form.attendance_date,
        requested_check_in: form.request_type !== 'checkout' ? form.requested_check_in || null : null,
        requested_check_out: form.request_type !== 'checkin' ? form.requested_check_out || null : null,
        reason: form.reason.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit your attendance request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
    <h1 className="mt-4 text-xl font-bold text-slate-900">Request submitted</h1>
    <p className="mt-2 text-sm text-slate-600">Your attendance correction request is now waiting for review.</p>
    <button type="button" onClick={() => navigate('/employee/attendance/regularizations')} className="mt-5 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf6900]">View my requests</button>
  </section>;

  return <div className="mx-auto max-w-4xl space-y-5">
    <button type="button" onClick={() => navigate('/employee/attendance/regularizations')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> My Regularizations</button>
    <header><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Attendance</p><h1 className="mt-1 text-2xl font-bold text-slate-950">New Attendance Request</h1><p className="mt-1 text-sm text-slate-500">Request a correction for a missed or incorrect check-in or check-out.</p></header>
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {error && <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Attendance date<span className="ml-1 text-rose-500">*</span>
          <span className="relative mt-1 block"><CalendarDays size={16} className="absolute left-3 top-3 text-slate-400"/><input required type="date" max={today()} value={form.attendance_date} onChange={(event) => update('attendance_date', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></span>
        </label>
        <label className="text-sm font-semibold text-slate-700">Request type<span className="ml-1 text-rose-500">*</span>
          <select value={form.request_type} onChange={(event) => update('request_type', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"><option value="checkin">Missing check-in</option><option value="checkout">Missing check-out</option><option value="both">Check-in and check-out</option></select>
        </label>
        {form.request_type !== 'checkout' && <label className="text-sm font-semibold text-slate-700">Requested check-in<span className="ml-1 text-rose-500">*</span><input required type="time" value={form.requested_check_in} onChange={(event) => update('requested_check_in', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>}
        {form.request_type !== 'checkin' && <label className="text-sm font-semibold text-slate-700">Requested check-out<span className="ml-1 text-rose-500">*</span><input required type="time" value={form.requested_check_out} onChange={(event) => update('requested_check_out', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>}
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Reason<span className="ml-1 text-rose-500">*</span><textarea required minLength={3} maxLength={255} rows={4} value={form.reason} onChange={(event) => update('reason', event.target.value)} placeholder="Describe why this attendance correction is needed" className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"/><span className="mt-1 block text-right text-xs font-normal text-slate-400">{form.reason.length}/255</span></label>
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5"><button type="button" onClick={() => navigate('/employee/attendance/regularizations')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf6900] disabled:opacity-60"><Send size={15}/>{submitting ? 'Submitting…' : 'Submit request'}</button></div>
    </form>
  </div>;
}
