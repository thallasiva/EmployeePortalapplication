import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { createPayrollPayGroup, deactivatePayrollPayGroup, listPayrollPayGroups, updatePayrollPayGroup, assignPayrollGroup, listPayrollGroupAssignments } from "../../../../api/payroll.api";
import { listEmployees } from "../../../../api/employee.api";
import { apiErrorToast, successToast } from "../../../../utils/ToastControllers";

const blank = () => ({ group_name: "", payroll_frequency: "MONTHLY", currency_code: "INR", cutoff_day: 25, salary_payment_day: 1 });
const today = () => new Date().toISOString().slice(0, 10);
const input = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#344054", background: "#fff" };

export default function PayGroups() {
  const [rows, setRows] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(blank);
  const [assignment, setAssignment] = useState({ employee_id: "", pay_group_id: "", effective_from: today() });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [groups, mapped, directory] = await Promise.all([
        listPayrollPayGroups(), listPayrollGroupAssignments(), listEmployees({ status: "Active", limit: 100 }),
      ]);
      setRows(groups.data || []); setAssignments(mapped.data || []); setEmployees(directory.data || []);
    } catch (error) { apiErrorToast(error, "load pay groups and employee mappings"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const startEdit = (row) => { setEditing(row.pay_group_id); setForm({ group_name: row.group_name, payroll_frequency: row.payroll_frequency, currency_code: row.currency_code, cutoff_day: row.cutoff_day, salary_payment_day: row.salary_payment_day }); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); setForm(blank()); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    const payload = { ...form, currency_code: String(form.currency_code).trim().toUpperCase(), cutoff_day: Number(form.cutoff_day), salary_payment_day: Number(form.salary_payment_day) };
    try {
      if (editing) await updatePayrollPayGroup(editing, payload); else await createPayrollPayGroup(payload);
      successToast(editing ? "Pay group updated." : "Pay group created."); close(); await load();
    } catch (error) { apiErrorToast(error, "save payroll pay group"); }
    finally { setSaving(false); }
  };
  const deactivate = async (row) => {
    if (!window.confirm(`Deactivate pay group “${row.group_name}”?`)) return;
    try { await deactivatePayrollPayGroup(row.pay_group_id); successToast("Pay group deactivated."); await load(); }
    catch (error) { apiErrorToast(error, "deactivate payroll pay group"); }
  };
  const saveAssignment = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      await assignPayrollGroup({ ...assignment, employee_id: Number(assignment.employee_id), pay_group_id: Number(assignment.pay_group_id) });
      successToast("Employee pay group assignment saved."); setAssignment((current) => ({ ...current, employee_id: "", pay_group_id: "" })); await load();
    } catch (error) { apiErrorToast(error, "assign employee pay group"); }
    finally { setSaving(false); }
  };
  return <div>
    <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" })}><div><div className={cssClass({ fontSize: 14, fontWeight: 800, color: "#182230" })}>Pay groups</div><div className={cssClass({ color: "#667085", fontSize: 11, marginTop: 3 })}>Set the payroll calendar for groups within this company.</div></div><button type="button" onClick={() => { setForm(blank()); setEditing(null); setOpen(true); }} className={cssClass({ display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 8, padding: "8px 12px", background: "#e87500", color: "white", fontSize: 12, fontWeight: 750, cursor: "pointer" })}><Plus size={14} /> Add pay group</button></div>
    <div className={cssClass({ border: "1px solid #edf0f3", borderRadius: 10, overflow: "auto" })}><table className={cssClass({ width: "100%", minWidth: 650, borderCollapse: "collapse" })}><thead><tr>{["Group", "Frequency", "Currency", "Cutoff day", "Pay day", "Employees", "Status", ""].map((title) => <th key={title} className={cssClass({ textAlign: "left", padding: "10px 12px", background: "#f9fafb", color: "#667085", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid #edf0f3" })}>{title}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={8} className={cssClass({ padding: 28, textAlign: "center", color: "#667085", fontSize: 12 })}><Loader2 size={15} className="animate-spin" /> Loading…</td></tr> : rows.map((row) => <tr key={row.pay_group_id}><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 12, color: "#344054", fontWeight: 700 })}>{row.group_name}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 11.5, color: "#475467" })}>{row.payroll_frequency}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 11.5, color: "#475467" })}>{row.currency_code}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 11.5, color: "#475467" })}>{row.cutoff_day}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 11.5, color: "#475467" })}>{row.salary_payment_day}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 11.5, color: "#475467" })}>{row.employee_count || 0}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", fontSize: 10, fontWeight: 700, color: Number(row.is_active) ? "#15803d" : "#667085" })}>{Number(row.is_active) ? "Active" : "Inactive"}</td><td className={cssClass({ padding: "10px 12px", borderBottom: "1px solid #f2f4f7", textAlign: "right", whiteSpace: "nowrap" })}><button type="button" aria-label={`Edit ${row.group_name}`} onClick={() => startEdit(row)} className={cssClass({ border: 0, background: "none", color: "#b45309", cursor: "pointer", padding: 5 })}><Pencil size={14} /></button>{Number(row.is_active) === 1 && <button type="button" onClick={() => deactivate(row)} className={cssClass({ border: 0, background: "none", color: "#be123c", cursor: "pointer", padding: 5, fontSize: 10 })}>Deactivate</button>}</td></tr>)}{!loading && rows.length === 0 && <tr><td colSpan={8} className={cssClass({ padding: 28, textAlign: "center", color: "#98a2b3", fontSize: 12 })}>No pay groups configured yet.</td></tr>}</tbody></table></div>
    <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3"><div className="text-sm font-bold text-gray-900">Employee mapping</div><div className="mt-1 text-xs text-gray-500">Assignments are effective-dated; earlier mappings stay in history.</div></div>
      <form onSubmit={saveAssignment} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
        <label className="grid gap-1 text-xs font-semibold text-gray-700">Employee<select required value={assignment.employee_id} onChange={(e) => setAssignment({ ...assignment, employee_id: e.target.value })} style={input}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.employee_id} value={employee.employee_id}>{employee.emp_code} — {employee.first_name} {employee.last_name || ""}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-gray-700">Pay group<select required value={assignment.pay_group_id} onChange={(e) => setAssignment({ ...assignment, pay_group_id: e.target.value })} style={input}><option value="">Select group</option>{rows.filter((row) => Number(row.is_active)).map((row) => <option key={row.pay_group_id} value={row.pay_group_id}>{row.group_name}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-gray-700">Effective from<input required type="date" value={assignment.effective_from} onChange={(e) => setAssignment({ ...assignment, effective_from: e.target.value })} style={input} /></label>
        <button disabled={saving || !employees.length || !rows.some((row) => Number(row.is_active))} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Assign employee</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-gray-50 text-[10px] uppercase text-gray-500"><tr><th className="px-3 py-2">Employee</th><th className="px-3 py-2">Pay group</th><th className="px-3 py-2">Effective from</th><th className="px-3 py-2">Effective to</th></tr></thead><tbody className="divide-y divide-gray-100">{assignments.map((row) => <tr key={row.employee_pay_group_assignment_id}><td className="px-3 py-2 font-semibold text-gray-700">{row.emp_code} — {row.employee_name}</td><td className="px-3 py-2 text-gray-600">{row.group_name}</td><td className="px-3 py-2 text-gray-600">{String(row.effective_from).slice(0, 10)}</td><td className="px-3 py-2 text-gray-600">{row.effective_to ? String(row.effective_to).slice(0, 10) : "Current"}</td></tr>)}{!assignments.length && <tr><td colSpan={4} className="px-3 py-5 text-center text-gray-400">No employee mappings yet.</td></tr>}</tbody></table></div>
    </section>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h3 className="m-0 text-base font-bold text-gray-900">{editing ? "Edit pay group" : "Create pay group"}</h3><button type="button" onClick={close} aria-label="Close" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"><X size={17} /></button></div><label className="grid gap-1 text-xs font-semibold text-gray-700">Group name<input required maxLength={100} value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} style={input} /></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs font-semibold text-gray-700">Frequency<select value={form.payroll_frequency} onChange={(e) => setForm({ ...form, payroll_frequency: e.target.value })} style={input}><option value="MONTHLY">Monthly</option><option value="SEMIMONTHLY">Twice a month</option><option value="BIWEEKLY">Every two weeks</option><option value="WEEKLY">Every week</option></select></label><label className="grid gap-1 text-xs font-semibold text-gray-700">Currency<input required minLength={3} maxLength={3} value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })} style={input} /></label><label className="grid gap-1 text-xs font-semibold text-gray-700">Cutoff day<input required type="number" min={1} max={31} value={form.cutoff_day} onChange={(e) => setForm({ ...form, cutoff_day: e.target.value })} style={input} /></label><label className="grid gap-1 text-xs font-semibold text-gray-700">Salary payment day<input required type="number" min={1} max={31} value={form.salary_payment_day} onChange={(e) => setForm({ ...form, salary_payment_day: e.target.value })} style={input} /></label></div><div className="flex justify-end gap-2"><button type="button" onClick={close} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#e87500] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "Saving…" : "Save group"}</button></div></form></div>}
  </div>;
}
