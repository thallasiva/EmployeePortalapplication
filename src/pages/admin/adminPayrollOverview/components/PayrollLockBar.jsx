import React, { useState } from "react";
import { Lock, LockOpen, AlertTriangle } from "lucide-react";
import { lockPayrollRun, unlockPayrollRun } from "../../../../api/payroll.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";

const BRAND = "#f18200";

/**
 * Shows a coloured banner when a payroll run is locked/approved.
 * Props:
 *   run       — the payroll run object (must have payroll_run_id, is_locked, review_status, lock_note)
 *   onRefresh — callback to reload data after lock/unlock
 *   canUnlock — boolean (admin/hr only)
 */
export default function PayrollLockBar({ run, onRefresh, canUnlock }) {
  const [busy, setBusy] = useState(false);

  if (!run) return null;

  const isLocked = run.is_locked || run.review_status === "APPROVED";
  const color    = isLocked ? "#dc2626" : "#16a34a";
  const bg       = isLocked ? "#fff1f2" : "#f0fdf4";
  const border   = isLocked ? "#fecaca" : "#bbf7d0";

  const handleLock = async () => {
    setBusy(true);
    try {
      await lockPayrollRun(run.payroll_run_id, "Manually locked by admin");
      successToast("Payroll run locked");
      onRefresh?.();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Failed to lock");
    } finally { setBusy(false); }
  };

  const handleUnlock = async () => {
    if (!window.confirm("Unlock this payroll run? Salary records will become editable.")) return;
    setBusy(true);
    try {
      await unlockPayrollRun(run.payroll_run_id);
      successToast("Payroll run unlocked");
      onRefresh?.();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Failed to unlock");
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: "10px 16px", marginBottom: 16, gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isLocked
          ? <Lock size={15} color={color} />
          : <AlertTriangle size={15} color={color} />}
        <span style={{ fontSize: 13, fontWeight: 600, color }}>
          {isLocked
            ? `Payroll run is locked — no salary changes allowed${run.lock_note ? ` (${run.lock_note})` : ""}`
            : "Payroll run is open — salary can still be modified"}
        </span>
      </div>

      {canUnlock && (
        isLocked ? (
          <button
            onClick={handleUnlock}
            disabled={busy}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", background: "#fff", border: "1px solid #fecaca",
              borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: "#dc2626", opacity: busy ? 0.6 : 1,
            }}
          >
            <LockOpen size={12} /> {busy ? "Unlocking…" : "Unlock Run"}
          </button>
        ) : (
          <button
            onClick={handleLock}
            disabled={busy}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", background: BRAND, border: "none",
              borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: "#fff", opacity: busy ? 0.6 : 1,
            }}
          >
            <Lock size={12} /> {busy ? "Locking…" : "Lock Run"}
          </button>
        )
      )}
    </div>
  );
}
