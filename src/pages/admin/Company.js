import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { createCompany, listCompanies, listCompanyModules, updateCompany, updateCompanyModules } from '../../api/company.api';
import { getErrorMessage } from '../../api/client';

const EMPTY = {
  company_name: '',
  address: '',
  email: '',
  phone: '',
  country: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  status: 'Active',
};

const fieldClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100';

export default function Company() {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moduleRows, setModuleRows] = useState([]);
  const [savingModules, setSavingModules] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listCompanies();
      setCompanies(rows);
      setSelectedId((current) => rows.some((row) => Number(row.company_id) === Number(current))
        ? current
        : rows[0]?.company_id ?? null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load companies'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const selected = companies.find((company) => Number(company.company_id) === Number(selectedId));
    setForm(selected ? { ...EMPTY, ...selected } : EMPTY);
    setEditing(false);
  }, [companies, selectedId]);

  useEffect(() => {
    if (!selectedId) { setModuleRows([]); return; }
    listCompanyModules(selectedId)
      .then(setModuleRows)
      .catch((error) => toast.error(getErrorMessage(error, 'Unable to load company modules')));
  }, [selectedId]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const startNew = () => {
    setSelectedId(null);
    setForm(EMPTY);
    setEditing(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_name: form.company_name.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        country: form.country.trim() || null,
        timezone: form.timezone.trim() || null,
        currency: form.currency.trim().toUpperCase(),
      };
      const saved = selectedId
        ? await updateCompany(selectedId, payload)
        : await createCompany(payload);
      toast.success(selectedId ? 'Company updated' : 'Company created');
      await load();
      if (saved?.company_id) setSelectedId(saved.company_id);
      setEditing(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save company'));
    } finally {
      setSaving(false);
    }
  };

  const selected = companies.find((company) => Number(company.company_id) === Number(selectedId));

  const saveModules = async () => {
    setSavingModules(true);
    try {
      const rows = await updateCompanyModules(selectedId, moduleRows.map((item) => ({
        module_key: item.module_key,
        enabled: Boolean(item.enabled),
      })));
      setModuleRows(rows);
      toast.success('Company modules updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save company modules'));
    } finally {
      setSavingModules(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Admin / Company</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Company Profiles</h1>
            <p className="mt-1 text-sm text-slate-600">Manage company records and their regional defaults.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700">
              <RefreshCw size={15} /> Refresh
            </button>
            <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <Plus size={16} /> Add company
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border bg-white p-3">
            <h2 className="px-2 py-2 text-sm font-semibold text-slate-800">Companies ({companies.length})</h2>
            {loading ? <p className="p-3 text-sm text-slate-500">Loading companies…</p> : companies.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">No companies yet. Add the first company to begin setup.</p>
            ) : (
              <div className="space-y-1">
                {companies.map((company) => (
                  <button key={company.company_id} type="button" onClick={() => setSelectedId(company.company_id)}
                    className={`w-full rounded-lg px-3 py-2 text-left ${Number(company.company_id) === Number(selectedId) ? 'bg-orange-50 text-orange-800' : 'hover:bg-slate-50 text-slate-700'}`}>
                    <span className="block truncate text-sm font-medium">{company.company_name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{company.country || 'Country not set'} · {company.status || 'Active'}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="rounded-xl border bg-white p-5">
            {!editing && selected ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-orange-50 p-3 text-orange-700"><Building2 size={22} /></span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selected.company_name}</h2>
                      <p className="text-sm text-slate-500">Company ID: {selected.company_id}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditing(true)} className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit profile</button>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Email', selected.email],
                    ['Phone', selected.phone],
                    ['Address', selected.address],
                    ['Country', selected.country],
                    ['Timezone', selected.timezone],
                    ['Currency', selected.currency],
                    ['Status', selected.status || 'Active'],
                  ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800">{value || '—'}</dd></div>)}
                </dl>
                <section className="mt-6 border-t pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div><h3 className="font-semibold text-slate-900">Enabled modules</h3><p className="text-xs text-slate-500">Disabled modules are blocked by the Express API for company users.</p></div>
                    <button type="button" onClick={saveModules} disabled={savingModules || !moduleRows.length} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{savingModules ? 'Saving…' : 'Save modules'}</button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {moduleRows.map((item) => <label key={item.module_key} className="flex items-center gap-2 rounded-lg border p-3 text-sm capitalize text-slate-700"><input type="checkbox" checked={Boolean(Number(item.enabled))} onChange={(event) => setModuleRows((rows) => rows.map((row) => row.module_key === item.module_key ? { ...row, enabled: event.target.checked ? 1 : 0 } : row))} />{item.module_key.replace(/_/g, ' ')}</label>)}
                  </div>
                </section>
              </>
            ) : (
              <form onSubmit={save} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedId ? 'Edit company' : 'Create company'}</h2>
                  <p className="text-sm text-slate-500">Timezone and currency are defaults for dates and payroll configuration.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">Company name *
                    <input required name="company_name" value={form.company_name || ''} onChange={change} className={fieldClass} maxLength={150} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Email
                    <input name="email" type="email" value={form.email || ''} onChange={change} className={fieldClass} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Phone
                    <input name="phone" value={form.phone || ''} onChange={change} className={fieldClass} maxLength={30} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Country
                    <input name="country" value={form.country || ''} onChange={change} className={fieldClass} maxLength={100} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Timezone (IANA)
                    <input name="timezone" value={form.timezone || ''} onChange={change} className={fieldClass} placeholder="Asia/Kolkata" maxLength={64} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Currency
                    <input name="currency" value={form.currency || ''} onChange={change} className={fieldClass} placeholder="INR" maxLength={3} minLength={3} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Address
                    <textarea name="address" value={form.address || ''} onChange={change} className={fieldClass} maxLength={255} rows={3} />
                  </label>
                  <label className="text-sm font-medium text-slate-700">Status
                    <select name="status" value={form.status || 'Active'} onChange={change} className={fieldClass}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <button type="button" onClick={() => { setEditing(false); if (!selectedId) setForm(EMPTY); }} className="rounded-lg border px-4 py-2 text-sm text-slate-700">Cancel</button>
                  <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                    <Save size={15} /> {saving ? 'Saving…' : 'Save company'}
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
