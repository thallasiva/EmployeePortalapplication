import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, RefreshCw, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { listCompanies } from '../../api/company.api';
import { createOffice, listOffices, updateOffice } from '../../api/office.api';
import { getErrorMessage } from '../../api/client';

const EMPTY = { company_id: '', office_name: '', location: '', address: '', timezone: '', holiday_calendar: '', status: 'Active' };
const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500';

export default function Offices() {
  const [companies, setCompanies] = useState([]);
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRows, officeRows] = await Promise.all([listCompanies(), listOffices()]);
      setCompanies(companyRows);
      setOffices(officeRows);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load branch locations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const beginCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY, company_id: companies[0]?.company_id || '' });
    setShowForm(true);
  };

  const beginEdit = (office) => {
    setEditingId(office.office_id);
    setForm({ ...EMPTY, ...office, company_id: office.company_id || '' });
    setShowForm(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      company_id: Number(form.company_id),
      office_name: form.office_name.trim(),
      location: form.location.trim() || null,
      address: form.address.trim() || null,
      timezone: form.timezone.trim() || null,
      holiday_calendar: form.holiday_calendar.trim() || null,
    };
    try {
      if (editingId) await updateOffice(editingId, payload);
      else await createOffice(payload);
      toast.success(editingId ? 'Branch updated' : 'Branch created');
      setShowForm(false);
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save branch'));
    } finally {
      setSaving(false);
    }
  };

  const set = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const companyName = (id) => companies.find((company) => Number(company.company_id) === Number(id))?.company_name || 'Unassigned';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs text-slate-500">Admin / Branches</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Branch & Location Management</h1><p className="mt-1 text-sm text-slate-600">Set company-specific office locations, timezones, and holiday calendars.</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><RefreshCw size={15} /> Refresh</button>
            <button type="button" onClick={beginCreate} disabled={!companies.length} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Plus size={16} /> Add branch</button>
          </div>
        </header>
        {showForm && <form onSubmit={save} className="mb-5 rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">{editingId ? 'Edit branch' : 'Create branch'}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Company *
              <select required name="company_id" value={form.company_id} onChange={set} className={inputClass}><option value="">Choose company</option>{companies.map((company) => <option key={company.company_id} value={company.company_id}>{company.company_name}</option>)}</select>
            </label>
            <label className="text-sm font-medium text-slate-700">Branch name *
              <input required name="office_name" maxLength={100} value={form.office_name} onChange={set} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">City / location
              <input name="location" maxLength={100} value={form.location || ''} onChange={set} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">Timezone (IANA)
              <input name="timezone" maxLength={64} placeholder="Asia/Kolkata" value={form.timezone || ''} onChange={set} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">Holiday calendar
              <input name="holiday_calendar" maxLength={100} placeholder="India - Default" value={form.holiday_calendar || ''} onChange={set} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-slate-700">Status
              <select name="status" value={form.status} onChange={set} className={inputClass}><option>Active</option><option>Inactive</option></select>
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Address
              <input name="address" maxLength={255} value={form.address || ''} onChange={set} className={inputClass} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"><Save size={15} />{saving ? 'Saving…' : 'Save branch'}</button>
          </div>
        </form>}
        <div className="overflow-hidden rounded-xl border bg-white">
          {loading ? <p className="p-6 text-sm text-slate-500">Loading branch locations…</p> : offices.length === 0 ? <div className="p-10 text-center"><MapPin className="mx-auto mb-2 text-slate-400" /><p className="font-medium text-slate-800">No branches configured</p><p className="mt-1 text-sm text-slate-500">Create a branch and assign its timezone and holiday calendar.</p></div> : (
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Timezone</th><th className="px-4 py-3">Holiday calendar</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y">{offices.map((office) => <tr key={office.office_id}><td className="px-4 py-3"><span className="font-medium text-slate-900">{office.office_name}</span><span className="block text-xs text-slate-500">{office.location || office.address || '—'}</span></td><td className="px-4 py-3">{companyName(office.company_id)}</td><td className="px-4 py-3">{office.timezone || 'Company default'}</td><td className="px-4 py-3">{office.holiday_calendar || '—'}</td><td className="px-4 py-3">{office.status || 'Active'}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => beginEdit(office)} className="rounded-md border px-3 py-1.5 text-xs font-medium">Edit</button></td></tr>)}</tbody></table></div>
          )}
        </div>
      </div>
    </div>
  );
}
