import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listLeaveRequests, reviewLeaveRequest,
  getAllLeaveBalances, adjustLeaveBalance, initializeLeaveYear,
} from "../../api/leaveRequest.api";
import {
  listLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
} from "../../api/leaveType.api";

/* ─────────────────────── helpers ─────────────────────── */
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const badge = (status) => {
  const map = {
    Pending:  "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Cancelled:"bg-gray-100 text-gray-600",
  };
  return `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`;
};

const fmt = (v) => Number(v || 0).toFixed(1).replace(/\.0$/, "");

/* ═══════════════════════════════════════════════════════════
   TAB 1 — Leave Requests (existing requests + approve/reject)
═══════════════════════════════════════════════════════════ */
function RequestsTab() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState("");
  const [error, setError]       = useState(null);
  const [toast, setToast]       = useState(null);
  const [reviewing, setReviewing] = useState(null); // { id, decision }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listLeaveRequests({ status: status || undefined, limit: 200 });
      setRows(r.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (id, decision, remarks = "") => {
    try {
      await reviewLeaveRequest(id, { decision, remarks });
      setToast(`Request ${decision}`);
      setTimeout(() => setToast(null), 3000);
      load();
    } catch (e) { alert(e.message); }
    setReviewing(null);
  };

  const pending = rows.filter((r) => r.status === "Pending");
  const others  = rows.filter((r) => r.status !== "Pending");

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {["Pending","Approved","Rejected","Cancelled"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button onClick={load} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error   && <p className="text-sm text-red-500">{error}</p>}

      {!loading && pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-yellow-700 mb-2">Pending Approval ({pending.length})</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-yellow-50 text-left text-gray-600">
                <tr>
                  {["Employee","Leave Type","From","To","Days","Reason","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((r) => (
                  <tr key={r.leave_request_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.employee_name}</p>
                      <p className="text-xs text-gray-400">{r.emp_code} · {r.department_name}</p>
                    </td>
                    <td className="px-4 py-3">{r.leave_type_name}</td>
                    <td className="px-4 py-3">{r.from_date?.slice(0,10)}</td>
                    <td className="px-4 py-3">{r.to_date?.slice(0,10)}</td>
                    <td className="px-4 py-3 text-center font-bold">{r.days}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{r.reason || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(r.leave_request_id, "Approved")}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                        >Approve</button>
                        <button
                          onClick={() => setReviewing({ id: r.leave_request_id, decision: "Rejected" })}
                          className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                        >Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && others.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">History</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  {["Employee","Leave Type","From","To","Days","Status","Reviewed By"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {others.map((r) => (
                  <tr key={r.leave_request_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.employee_name}</p>
                      <p className="text-xs text-gray-400">{r.emp_code}</p>
                    </td>
                    <td className="px-4 py-3">{r.leave_type_name}</td>
                    <td className="px-4 py-3">{r.from_date?.slice(0,10)}</td>
                    <td className="px-4 py-3">{r.to_date?.slice(0,10)}</td>
                    <td className="px-4 py-3 text-center">{r.days}</td>
                    <td className="px-4 py-3"><span className={badge(r.status)}>{r.status}</span></td>
                    <td className="px-4 py-3 text-gray-500">{r.reviewer_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-12">No leave requests found.</p>
      )}

      {/* Reject remarks modal */}
      {reviewing && (
        <RejectModal
          onConfirm={(remarks) => handleReview(reviewing.id, reviewing.decision, remarks)}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}

function RejectModal({ onConfirm, onClose }) {
  const [remarks, setRemarks] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Reject — Add Remarks</h3>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Reason for rejection (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(remarks)}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — Leave Balances Matrix
   Matches "Leave Balance As On A Day" / "Leave Summary" format
═══════════════════════════════════════════════════════════ */
function BalancesTab() {
  const [year, setYear]         = useState(CURRENT_YEAR);
  const [data, setData]         = useState(null);   // { employees, leaveTypes, year }
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState(null);
  const [editing, setEditing]   = useState(null);   // { emp, bal }
  const [initLoading, setInitLoading] = useState(false);

  const load = useCallback(async (y) => {
    setLoading(true); setError(null);
    try { setData(await getAllLeaveBalances(y)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  const handleInitYear = async () => {
    if (!window.confirm(`Initialize leave balances for ${year}? Existing rows will not be overwritten.`)) return;
    setInitLoading(true);
    try {
      const r = await initializeLeaveYear(year);
      setToast(`Year ${year} initialized: ${r.created} rows created, ${r.skipped} skipped`);
      setTimeout(() => setToast(null), 5000);
      load(year);
    } catch (e) { alert(e.message); }
    finally { setInitLoading(false); }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return q
      ? data.employees.filter((e) =>
          e.employee_name.toLowerCase().includes(q) ||
          e.emp_code.toLowerCase().includes(q) ||
          (e.department_name || "").toLowerCase().includes(q))
      : data.employees;
  }, [data, search]);

  const leaveTypes = data?.leaveTypes || [];

  // Summary totals
  const totals = useMemo(() => {
    const t = {};
    leaveTypes.forEach((lt) => { t[lt.leave_type_id] = { granted: 0, availed: 0, balance: 0 }; });
    filtered.forEach((emp) => {
      emp.balances.forEach((b) => {
        if (t[b.leave_type_id]) {
          t[b.leave_type_id].granted  += b.granted;
          t[b.leave_type_id].availed  += b.availed;
          t[b.leave_type_id].balance  += b.balance;
        }
      });
    });
    return t;
  }, [filtered, leaveTypes]);

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs text-gray-500 mr-1">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <input
          type="text"
          placeholder="Search employee / department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-60"
        />
        <button
          onClick={handleInitYear}
          disabled={initLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {initLoading ? "Initializing…" : `Initialize ${year}`}
        </button>
        <button onClick={() => load(year)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Click any balance cell to edit. "Initialize {year}" creates missing rows using carry-forward from {year - 1}.
      </p>

      {loading && <p className="text-sm text-gray-500 py-8 text-center">Loading balances…</p>}
      {error   && <p className="text-sm text-red-500">{error}</p>}

      {!loading && data && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="text-xs min-w-full">
            <thead className="bg-gradient-to-r from-brand to-brand-600 text-white sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium sticky left-0 bg-gradient-to-r from-brand to-brand-600 z-10 w-48">Employee</th>
                <th className="px-3 py-2.5 text-left font-medium w-28">Dept</th>
                {leaveTypes.map((lt) => (
                  <th key={lt.leave_type_id} className="px-2 py-2.5 text-center font-medium min-w-[90px]">
                    <div>{lt.short_code || lt.leave_type_name}</div>
                    <div className="text-slate-300 font-normal">{lt.annual_quota}d/yr</div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center font-medium min-w-[70px]">Total<br/>Availed</th>
                <th className="px-3 py-2.5 text-center font-medium min-w-[70px]">Total<br/>Balance</th>
              </tr>
              {/* Sub-header */}
              <tr className="bg-gradient-to-r from-brand text-slate-200 ">
                <th className="px-3 py-1 sticky left-0 bg-gradient-to-r from-brand to-brand-600 z-10" ></th>
                <th className="px-3 py-1"></th>
                {leaveTypes.map((lt) => (
                  <th key={lt.leave_type_id} className="px-2 py-1 text-center">
                    <div className="flex justify-center gap-1 text-[10px]">
                      <span>Gr</span><span>/</span><span>Av</span><span>/</span><span>Bal</span>
                    </div>
                  </th>
                ))}
                <th></th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp, idx) => {
                const totalAvailed  = emp.balances.reduce((s, b) => s + b.availed, 0);
                const totalBalance  = emp.balances.reduce((s, b) => s + b.balance, 0);
                return (
                  <tr key={emp.employee_id} className={idx % 2 === 0 ? "bg-white hover:bg-orange-50/30" : "bg-gray-50 hover:bg-orange-50/30"}>
                    <td className="px-3 py-2 sticky  left-0 bg-inherit z-10">
                      <p className="font-medium text-gray-800">{emp.employee_name.trim()} </p>
                      <p className="text-gray-400">{emp.emp_code}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{emp.department_name || "—"}</td>
                    {emp.balances.map((b) => (
                      <td
                        key={b.leave_type_id}
                        className={`px-2 py-2 text-center cursor-pointer group ${!b.initialized ? "text-gray-300" : ""}`}
                        onClick={() => setEditing({ emp, bal: b })}
                        title="Click to edit"
                      >
                        <span className="text-gray-700 group-hover:text-orange-600">
                          {fmt(b.granted)} / <span className="text-red-600">{fmt(b.availed)}</span> / <span className="font-bold text-green-700">{fmt(b.balance)}</span>
                        </span>
                        {!b.initialized && <span className="ml-1 text-gray-300">⊕</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-medium text-red-600">{fmt(totalAvailed)}</td>
                    <td className="px-3 py-2 text-center font-bold text-green-700">{fmt(totalBalance)}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-slate-100 font-semibold text-slate-700">
                <td className="px-3 py-2 sticky left-0 bg-slate-100 z-10">TOTAL ({filtered.length})</td>
                <td></td>
                {leaveTypes.map((lt) => (
                  <td key={lt.leave_type_id} className="px-2 py-2 text-center text-xs">
                    {fmt(totals[lt.leave_type_id]?.granted)} / <span className="text-red-600">{fmt(totals[lt.leave_type_id]?.availed)}</span> / <span className="text-green-700">{fmt(totals[lt.leave_type_id]?.balance)}</span>
                  </td>
                ))}
                <td className="px-3 py-2 text-center text-red-600">
                  {fmt(Object.values(totals).reduce((s, t) => s + t.availed, 0))}
                </td>
                <td className="px-3 py-2 text-center text-green-700">
                  {fmt(Object.values(totals).reduce((s, t) => s + t.balance, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditBalanceModal
          emp={editing.emp}
          bal={editing.bal}
          year={year}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            await adjustLeaveBalance(payload);
            setEditing(null);
            setToast("Balance updated");
            setTimeout(() => setToast(null), 3000);
            load(year);
          }}
        />
      )}
    </div>
  );
}

function EditBalanceModal({ emp, bal, year, onClose, onSave }) {
  const [form, setForm] = useState({
    opening_balance: bal.opening_balance,
    granted:         bal.granted,
    availed:         bal.availed,
  });
  const [saving, setSaving] = useState(false);
  const balance = Math.max(0, Number(form.opening_balance || 0) + Number(form.granted || 0) - Number(form.availed || 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        employeeId:   emp.employee_id,
        leaveTypeId:  bal.leave_type_id,
        year,
        opening_balance: Number(form.opening_balance) || 0,
        granted:         Number(form.granted)         || 0,
        availed:         Number(form.availed)         || 0,
      });
    } catch (e) { alert(e.message); setSaving(false); }
  };

  const field = (key, label) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        step={0.5}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">Edit Balance</h3>
        <div>
          <p className="text-sm font-medium text-gray-700">{emp.employee_name.trim()} ({emp.emp_code})</p>
          <p className="text-xs text-gray-400">{bal.leave_type_name} — {year}</p>
        </div>
        {field("opening_balance", "Opening Balance (days)")}
        {field("granted",         "Granted (days)")}
        {field("availed",         "Availed (days)")}
        <div className="rounded-lg bg-green-50 px-4 py-2.5 flex justify-between items-center">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-lg font-bold text-green-700">{balance.toFixed(1)}</span>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — Leave Types CRUD
═══════════════════════════════════════════════════════════ */
function LeaveTypesTab() {
  const [types, setTypes]      = useState([]);
  const [loading, setLoading]  = useState(true);
  const [editing, setEditing]  = useState(null); // null | {} (new) | {leave_type_id,...}
  const [toast, setToast]      = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await listLeaveTypes(); setTypes(Array.isArray(r) ? r : (r.data || [])); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSave = async (form) => {
    if (form.leave_type_id) {
      await updateLeaveType(form.leave_type_id, form);
      notify("Leave type updated");
    } else {
      await createLeaveType(form);
      notify("Leave type created");
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteLeaveType(id);
      notify("Leave type deleted");
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Configure leave types, quotas and carry-forward rules.</p>
        <button
          onClick={() => setEditing({ leave_type_name: "", short_code: "", annual_quota: 0, carry_forward_limit: 0, requires_proof: false, description: "" })}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + New Leave Type
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                {["Code","Name","Annual Quota","Carry Forward Limit","Proof Required","Description",""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((t) => (
                <tr key={t.leave_type_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-orange-700 font-semibold">{t.short_code || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.leave_type_name}</td>
                  <td className="px-4 py-3 text-center">{t.annual_quota} days</td>
                  <td className="px-4 py-3 text-center">{t.carry_forward_limit} days</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.requires_proof ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.requires_proof ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">{t.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing({ ...t })}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(t.leave_type_id, t.leave_type_name)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No leave types configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <LeaveTypeModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function LeaveTypeModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leave_type_name.trim()) { alert("Leave type name is required"); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { alert(e.message); setSaving(false); }
  };

  const input = (key, label, type = "text", extra = {}) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => set(key, type === "number" ? e.target.value : e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        {...extra}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          {form.leave_type_id ? "Edit Leave Type" : "New Leave Type"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {input("leave_type_name", "Name *")}
          {input("short_code", "Short Code (e.g. EL, SL, CL)")}
          <div className="grid grid-cols-2 gap-4">
            {input("annual_quota", "Annual Quota (days)", "number", { min: 0 })}
            {input("carry_forward_limit", "Carry Forward Limit (days)", "number", { min: 0 })}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.requires_proof}
              onChange={(e) => set("requires_proof", e.target.checked)}
              className="rounded"
            />
            Proof Required
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE — 3-tab Admin Leave Management
═══════════════════════════════════════════════════════════ */
const TABS = [
  { key: "requests",   label: "Leave Requests" },
  { key: "balances",   label: "Leave Balances" },
  { key: "types",      label: "Leave Types" },
];

export default function AdminLeaveManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "requests";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Approve requests · manage balances · configure leave types
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {tab === "requests" && <RequestsTab />}
          {tab === "balances" && <BalancesTab />}
          {tab === "types"    && <LeaveTypesTab />}
        </div>
      </div>
    </div>
  );
}
