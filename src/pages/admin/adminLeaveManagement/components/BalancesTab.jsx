import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { getAllLeaveBalances, adjustLeaveBalance, initializeLeaveYear, accrueEarnedLeave } from "../../../../api/leaveRequest.api";
import { cssClass } from "../../../../utils/classStyles";
import { CURRENT_YEAR, YEARS, MON, B } from "../constants/leaveConstants";
import Btn from "./Btn";
import Toast from "./Toast";
import BalancesTable from "./BalancesTable";
import EditBalanceModal from "./EditBalanceModal";

const BalancesTab = memo(() => {
  const [year, setYear]       = useState(CURRENT_YEAR);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [initLoading, setInitLoad] = useState(false);
  const [accruing, setAccruing]   = useState(false);
  const [accrueMonth, setAccrueMonth] = useState(new Date().getMonth() || 12);
  const [accrueYear,  setAccrueYear]  = useState(new Date().getFullYear());

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const load = useCallback(async (y) => {
    setLoading(true);
    try { setData(await getAllLeaveBalances(y)); }
    catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(year); }, [year, load]);

  const handleInit = async () => {
    if (!window.confirm(`Initialize leave balances for ${year}? Existing rows will not be overwritten.`)) return;
    setInitLoad(true);
    try {
      const r = await initializeLeaveYear(year);
      showToast(`Year ${year} initialized: ${r.created} rows created, ${r.skipped} skipped`);
      load(year);
    } catch (e) { showToast(e.message, "error"); }
    finally { setInitLoad(false); }
  };

  const handleAccrue = async () => {
    if (!window.confirm(`Accrue Earned Leave for ${MON[accrueMonth - 1]} ${accrueYear}? This will add working_days/14 to each employee's EL balance.`)) return;
    setAccruing(true);
    try {
      const r = await accrueEarnedLeave({ month: accrueMonth, year: accrueYear });
      showToast(`Earned leave accrued: ${r.accrued} employees credited`);
      load(year);
    } catch (e) { showToast(e.message, "error"); }
    finally { setAccruing(false); }
  };

  const leaveTypes = data?.leaveTypes || [];

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return q ? data.employees.filter((e) =>
      e.employee_name.toLowerCase().includes(q) ||
      e.emp_code.toLowerCase().includes(q) ||
      (e.department_name || "").toLowerCase().includes(q)
    ) : data.employees;
  }, [data, search]);

  const totals = useMemo(() => {
    const t = {};
    leaveTypes.forEach((lt) => { t[lt.leave_type_id] = { granted: 0, availed: 0, balance: 0 }; });
    filtered.forEach((emp) => emp.balances.forEach((b) => {
      if (t[b.leave_type_id]) {
        t[b.leave_type_id].granted += b.granted;
        t[b.leave_type_id].availed += b.availed;
        t[b.leave_type_id].balance += b.balance;
      }
    }));
    return t;
  }, [filtered, leaveTypes]);

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 18 })}>
      <Toast {...(toast || { msg: null })} />

      {/* Toolbar */}
      <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" })}>
        <div>
          <label className={cssClass({ display: "block", fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 })}>Year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cssClass(
            { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 })}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <input type="text" placeholder="Search employee / dept…" value={search}
          onChange={(e) => setSearch(e.target.value)} className={cssClass(
            { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 220 })} />
        <Btn onClick={handleInit} disabled={initLoading} variant="cancel">
          {initLoading ? "Initializing…" : `Initialize ${year}`}
        </Btn>
        <Btn onClick={() => load(year)} variant="cancel" size="sm"><RefreshCw size={13} /></Btn>

        {/* Accrual panel */}
        <div className={cssClass({ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto",
          background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10, padding: "8px 14px" })}>
          <Zap size={14} color={B} />
          <span className={cssClass({ fontSize: 12, fontWeight: 700, color: B })}>Earned Leave Accrual</span>
          <select value={accrueMonth} onChange={(e) => setAccrueMonth(Number(e.target.value))} className={cssClass(
            { padding: "5px 8px", borderRadius: 6, border: "1px solid #fed7aa", fontSize: 12, background: "#fff" })}>
            {MON.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={accrueYear} onChange={(e) => setAccrueYear(Number(e.target.value))} className={cssClass(
            { padding: "5px 8px", borderRadius: 6, border: "1px solid #fed7aa", fontSize: 12, background: "#fff", width: 70 })}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
          <Btn onClick={handleAccrue} disabled={accruing} size="sm">
            <Zap size={12} />{accruing ? "Accruing…" : "Run Accrual"}
          </Btn>
        </div>
      </div>

      <p className={cssClass({ fontSize: 11, color: "#9ca3af" })}>
        Formula: <strong>paid_days ÷ 14</strong> (rounded to nearest 0.5 day) — auto-runs on 1st of every month at 6 PM.
        Click any balance cell to edit manually.
      </p>

      {loading && <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af" })}>Loading balances…</div>}

      {!loading && data && (
        <BalancesTable filtered={filtered} leaveTypes={leaveTypes} totals={totals} setEditing={setEditing} />
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
            showToast("Balance updated");
            load(year);
          }}
        />
      )}
    </div>
  );
});

BalancesTab.displayName = "BalancesTab";
export default BalancesTab;
