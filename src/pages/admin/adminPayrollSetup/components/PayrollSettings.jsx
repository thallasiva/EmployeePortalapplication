import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Save, Settings2 } from "lucide-react";
import { getPayrollSettings, updatePayrollSettings } from "../../../../api/payroll.api";
import { apiErrorToast, successToast } from "../../../../utils/ToastControllers";

const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const emptyPolicy = () => ({
  effective_from: localToday(), currency_code: "INR", payroll_frequency: "MONTHLY",
  cutoff_day: 25, salary_payment_day: 1, working_days_method: "WORKING_DAYS",
  fixed_working_days: "", lop_calculation_method: "WORKING_DAYS", rounding_method: "HALF_UP",
  financial_year_start_month: 4,
  approval_employee_ids: [],
});
const FIELD = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#e87500] focus:ring-2 focus:ring-orange-100";

function Field({ label, children, hint }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-gray-700"><span>{label}</span>{children}{hint && <span className="text-[11px] font-normal text-gray-500">{hint}</span>}</label>;
}

export default function PayrollSettings() {
  const [form, setForm] = useState(emptyPolicy);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await getPayrollSettings();
      setForm({ ...emptyPolicy(), ...result.policy, effective_from: result.policy?.effective_from ? String(result.policy.effective_from).slice(0, 10) : localToday() });
      setHistory(result.history || []);
    } catch (e) { setError(e?.response?.data?.message || e.message || "Could not load payroll settings."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const payload = {
      ...form,
      currency_code: String(form.currency_code || "").trim().toUpperCase(),
      cutoff_day: Number(form.cutoff_day),
      salary_payment_day: Number(form.salary_payment_day),
      fixed_working_days: form.working_days_method === "FIXED_DIVISOR" ? Number(form.fixed_working_days) : null,
      financial_year_start_month: Number(form.financial_year_start_month),
      statutory_rules: {},
    };
    try {
      const result = await updatePayrollSettings(payload);
      setForm({ ...payload, ...result.policy });
      setHistory(result.history || []);
      successToast("Company payroll settings saved.");
    } catch (e) { apiErrorToast(e, "save payroll settings"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-500"><Loader2 size={17} className="mr-2 inline animate-spin" />Loading company payroll settings…</div>;
  return <div className="max-w-5xl">
    <div className="mb-4 flex items-start gap-3"><span className="rounded-xl bg-orange-50 p-2.5 text-[#e87500]"><Settings2 size={19} /></span><div><h2 className="m-0 text-base font-bold text-gray-900">Company payroll policy</h2><p className="mt-1 text-xs text-gray-500">Configure calendar and salary calculation settings for your signed-in company.</p></div></div>
    {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div>}
    <form onSubmit={save} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Policy effective from"><input required type="date" value={form.effective_from || localToday()} onChange={change("effective_from")} className={FIELD} /></Field>
        <Field label="Payroll currency" hint="Three-letter currency code"><input required maxLength={3} value={form.currency_code || ""} onChange={change("currency_code")} className={FIELD} placeholder="INR" /></Field>
        <Field label="Processing frequency"><select value={form.payroll_frequency} onChange={change("payroll_frequency")} className={FIELD}><option value="MONTHLY">Monthly</option><option value="SEMIMONTHLY">Twice a month</option><option value="BIWEEKLY">Every two weeks</option><option value="WEEKLY">Weekly</option></select></Field>
        <Field label="Payroll cutoff day" hint="Day of month when payroll inputs close"><input required type="number" min="1" max="31" value={form.cutoff_day} onChange={change("cutoff_day")} className={FIELD} /></Field>
        <Field label="Salary payment day" hint="Day of month scheduled for salary payment"><input required type="number" min="1" max="31" value={form.salary_payment_day} onChange={change("salary_payment_day")} className={FIELD} /></Field>
        <Field label="Working-day divisor" hint="How the monthly salary is divided"><select value={form.working_days_method} onChange={change("working_days_method")} className={FIELD}><option value="WORKING_DAYS">Scheduled working days</option><option value="CALENDAR_DAYS">Calendar days</option><option value="FIXED_DIVISOR">Fixed day divisor</option></select></Field>
        {form.working_days_method === "FIXED_DIVISOR" && <Field label="Fixed divisor"><input required type="number" min="1" max="31" step="0.5" value={form.fixed_working_days || ""} onChange={change("fixed_working_days")} className={FIELD} placeholder="For example, 30" /></Field>}
        <Field label="Loss-of-pay divisor"><select value={form.lop_calculation_method} onChange={change("lop_calculation_method")} className={FIELD}><option value="WORKING_DAYS">Scheduled working days</option><option value="CALENDAR_DAYS">Calendar days</option><option value="FIXED_DIVISOR">Fixed day divisor</option></select></Field>
        <Field label="Rounding policy"><select value={form.rounding_method} onChange={change("rounding_method")} className={FIELD}><option value="HALF_UP">Nearest amount (half up)</option><option value="UP">Round up</option><option value="DOWN">Round down</option><option value="FLOOR">Floor</option><option value="CEIL">Ceiling</option></select></Field>
        <Field label="Financial year starts in"><select value={form.financial_year_start_month} onChange={change("financial_year_start_month")} className={FIELD}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2020, index, 1).toLocaleString("en-IN", { month: "long" })}</option>)}</select></Field>
        <Field label="Approval sequence (employee IDs)" hint="Enter approver employee IDs in order, separated by commas. Leave blank for one authorized reviewer."><input value={(form.approval_employee_ids || []).join(", ")} onChange={(event) => setForm((current) => ({ ...current, approval_employee_ids: event.target.value.split(",").map((value) => value.trim()).filter(Boolean).map(Number) }))} className={FIELD} placeholder="e.g. 12, 28" /></Field>
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-2 rounded-lg border border-orange-100 bg-orange-50 p-3 text-xs text-orange-900"><CalendarDays size={15} className="mt-0.5 shrink-0" /><span>Changes are stored with an effective date so older payroll policy versions remain available for review. Statutory calculations still use configured salary components and approved statutory rules.</span></div>
      <div className="mt-4 flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving…" : "Save settings"}</button></div>
    </form>
    {history.length > 0 && <section className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white"><div className="border-b border-gray-100 px-4 py-3"><h3 className="m-0 text-sm font-bold text-gray-800">Policy history</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-xs"><thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-4 py-2.5">Effective from</th><th className="px-4 py-2.5">Effective to</th><th className="px-4 py-2.5">Frequency</th><th className="px-4 py-2.5">Currency</th><th className="px-4 py-2.5">Cutoff / Pay day</th></tr></thead><tbody className="divide-y divide-gray-100">{history.map((row) => <tr key={row.payroll_policy_version_id}><td className="px-4 py-2.5">{String(row.effective_from).slice(0, 10)}</td><td className="px-4 py-2.5">{row.effective_to ? String(row.effective_to).slice(0, 10) : "Current"}</td><td className="px-4 py-2.5">{row.payroll_frequency}</td><td className="px-4 py-2.5">{row.currency_code}</td><td className="px-4 py-2.5">{row.cutoff_day} / {row.salary_payment_day}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
