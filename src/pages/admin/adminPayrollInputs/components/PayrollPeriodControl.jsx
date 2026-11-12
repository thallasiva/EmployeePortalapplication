import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { getPayrollPeriod, lockPayrollInputs } from "../../../../api/payroll.api";
import { cssClass } from "../../../../utils/classStyles";
import { apiErrorToast, successToast } from "../../../../utils/ToastControllers";

const STATUS = {
  OPEN: { label: "Inputs open", className: "border-amber-200 bg-amber-50 text-amber-800" },
  INPUTS_LOCKED: { label: "Inputs locked", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "Period closed", className: "border-slate-200 bg-slate-100 text-slate-600" },
};

export default function PayrollPeriodControl({ month, year }) {
  const [period, setPeriod] = useState({ status: "OPEN" });
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setPeriod(await getPayrollPeriod(year, month)); }
    catch (error) { apiErrorToast(error, "load payroll period"); }
  }, [month, year]);
  useEffect(() => { load(); }, [load]);
  const lock = async () => {
    setBusy(true);
    try {
      setPeriod(await lockPayrollInputs(year, month, "Inputs reviewed and frozen before payroll calculation."));
      successToast("Payroll inputs are locked for this period.");
    } catch (error) { apiErrorToast(error, "lock payroll inputs"); }
    finally { setBusy(false); }
  };
  const status = STATUS[period.status] || STATUS.OPEN;
  return <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16, border: "1px solid #f0e4d8", borderRadius: 10, padding: "11px 14px", background: "#fffaf5" })}>
    <div><div className={cssClass({ color: "#182230", fontSize: 12, fontWeight: 800 })}>Payroll input control</div><div className={cssClass({ marginTop: 2, color: "#667085", fontSize: 11 })}>Save a calculation snapshot of attendance, leave, approved inputs and adjustments.</div></div>
    <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
      <span className={`${cssClass({ display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid", borderRadius: 999, padding: "5px 9px", fontSize: 10.5, fontWeight: 750 })} ${status.className}`}>{period.status === "INPUTS_LOCKED" ? <CheckCircle2 size={13} /> : <LockKeyhole size={13} />}{status.label}</span>
      {period.status === "OPEN" && <button type="button" onClick={lock} disabled={busy} className={cssClass({ display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 7, padding: "7px 10px", background: "#e87500", color: "#fff", fontSize: 11, fontWeight: 750, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 })}>{busy ? <Loader2 size={13} className="animate-spin" /> : <LockKeyhole size={13} />}{busy ? "Locking…" : "Lock inputs"}</button>}
    </div>
  </div>;
}
