import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Play, Loader2, ListChecks, Calculator, Eye, CheckCheck, ShieldCheck, FileText, Unlock, Archive,
} from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import { successToast, apiErrorToast } from "../../../utils/ToastControllers";
import { MSG } from "../../../utils/toastMessages";
import { BRAND, MONTHS, VISIBLE } from "./constants";
import { buildMonthList } from "./utils";
import { deriveSteps, computeExceptions, computeHealth, fmtDateTime } from "./utils/derive";
import { usePayrollData } from "./hooks/usePayrollData";
import { listLeaveRequests } from "../../../api/leaveRequest.api";
import {
  generateAllPayslips, submitPayrollReview, reviewPayrollRun, lockPayrollRun, unlockPayrollRun,
  exportBankFile,
  getPayrollPeriod,
  closePayrollPeriod,
} from "../../../api/payroll.api";
import MonthSelector from "./components/MonthSelector";
import Card from "./components/Card";
import LockControlCard from "./components/LockControlCard";
import PayrollHealthCard from "./components/PayrollHealthCard";
import QuickActionsCard from "./components/QuickActionsCard";
import ExceptionsPanel from "./components/ExceptionsPanel";
import SummaryPanel from "./components/SummaryPanel";
import ActivityTable from "./components/ActivityTable";
import ProcessOverviewCard from "./components/ProcessOverviewCard";
import LeaveRequestsPanel from "./components/LeaveRequestsPanel";
import PayrollWorkflowGuide from "./components/PayrollWorkflowGuide";
import PayrollDashboardInsights from "./components/PayrollDashboardInsights";
const months = buildMonthList();
// Admin route targets (mounted under /dashboard)
const R = {
  attendance: "/dashboard/attendance",
  leave: "/dashboard/leave",
  inputs: "/dashboard/payroll/inputs",
};
export default function AdminPayrollOverview() {
  const now = new Date();
  const navigate = useNavigate();
  const location = useLocation();
  const approvalView = location.pathname.endsWith("/approval");
  const [selIdx, setSelIdx] = useState(3);
  const [scroll, setScroll] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [busy, setBusy] = useState("");
  const [payrollPeriodStatus, setPayrollPeriodStatus] = useState("OPEN");
  const selected = months[selIdx];
  const { payslips, employees, attendanceRows, runs, dashboard, loading, processing, handleProcess, load } = usePayrollData(selected);
  useEffect(() => {
    let alive = true;
    listLeaveRequests({ status: "Pending", limit: 6 })
      .then((r) => { if (alive) setPendingLeaves(r.data || []); })
      .catch(() => { if (alive) setPendingLeaves([]); });
    return () => { alive = false; };
  }, [selected.month, selected.year]);
  const processedSet = useMemo(() => new Set(runs.map((r) => `${r.month}-${r.year}`)), [runs]);
  const isProcessed = useCallback((m, y) => processedSet.has(`${m}-${y}`), [processedSet]);
  const isFuture = useCallback(
    (m, y) => new Date(y, m - 1, 1) > new Date(now.getFullYear(), now.getMonth(), 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const selRun = useMemo(
    () => runs.find((r) => Number(r.month) === selected.month && Number(r.year) === selected.year),
    [runs, selected]
  );
  const runId = selRun?.payroll_run_id;
  const rs = selRun?.review_status;
  useEffect(() => {
    let alive = true;
    getPayrollPeriod(selected.year, selected.month)
      .then((period) => { if (alive) setPayrollPeriodStatus(period.status || "OPEN"); })
      .catch(() => { if (alive) setPayrollPeriodStatus("OPEN"); });
    return () => { alive = false; };
  }, [selected.month, selected.year]);
  const steps = useMemo(
    () => deriveSteps({ selRun, hasPayslips: payslips.length > 0, attendanceReady: attendanceRows.length > 0 }),
    [selRun, payslips.length, attendanceRows.length]
  );
  const { items: exceptions, attentionCount } = useMemo(
    () => computeExceptions({ employees, attendanceRows, payslips }),
    [employees, attendanceRows, payslips]
  );
  const health = useMemo(() => computeHealth({ steps, exceptionsTotal: attentionCount }), [steps, attentionCount]);
  const excluded = attentionCount;
  const eligible = Math.max(0, employees.length - excluded);
  const attLastUpdated = useMemo(() => {
    const t = attendanceRows.map((r) => r.updated_at || r.attendance_date).filter(Boolean).sort();
    return t.length ? fmtDateTime(t[t.length - 1]) : "—";
  }, [attendanceRows]);
  const activityRows = useMemo(() =>
    dashboard?.activities?.length
      ? dashboard.activities.map((row) => ({ when: fmtDateTime(row.created_at), action: row.action, user: row.performed_by_name || `User #${row.user_id}`, status: row.result }))
      : [...runs]
        .sort((a, b) => new Date(b.processed_on || b.created_at || 0) - new Date(a.processed_on || a.created_at || 0))
        .slice(0, 6)
        .map((r) => ({
          when: fmtDateTime(r.processed_on || r.created_at),
          action: `Payroll ${MONTHS[(Number(r.month) || 1) - 1]} ${r.year}`,
          user: r.processed_by_name || (r.processed_by ? `User #${r.processed_by}` : "System"),
          status: r.review_status || r.status,
        })),
    [dashboard?.activities, runs]
  );
  const handleScrollLeft = useCallback(() => setScroll((s) => Math.max(0, s - 1)), []);
  const handleScrollRight = useCallback(() => setScroll((s) => Math.min(months.length - VISIBLE, s + 1)), []);
  // Run an endpoint safely with feedback + refresh.
  const act = useCallback(async (key, fn, okMsg) => {
    setBusy(key);
    try { await fn(); successToast(okMsg); load(); }
    catch (e) { apiErrorToast(e, key); }
    finally { setBusy(""); }
  }, [load]);
  const handleGenerate = useCallback(
    () => act("generate payslips", () => generateAllPayslips({ month: selected.month, year: selected.year }), "Payslips generated successfully."),
    [act, selected]
  );
  const handleReview = useCallback(
    () => runId && act("submit for review", () => submitPayrollReview(runId), MSG.PAYROLL_SUBMITTED),
    [act, runId]
  );
  const handleApprove = useCallback(
    () => runId && act("approve payroll", () => reviewPayrollRun(runId, { approved: true, remarks: "Approved from dashboard" }), MSG.PAYROLL_APPROVED),
    [act, runId]
  );
  const handleFinalize = useCallback(
    () => runId && act("finalize payroll", () => lockPayrollRun(runId, "Finalized from dashboard"), MSG.PAYROLL_LOCKED),
    [act, runId]
  );
  const handleUnlock = useCallback(
    () => runId && act("unlock payroll", () => unlockPayrollRun(runId), MSG.PAYROLL_UNLOCKED),
    [act, runId]
  );
  const handleClosePeriod = useCallback(
    () => runId && act("close payroll period", async () => {
      const result = await closePayrollPeriod(selected.year, selected.month, "Payroll approvals completed and period closed by authorized payroll administrator.");
      setPayrollPeriodStatus(result.status || "CLOSED");
      return result;
    }, "Payroll period closed."),
    [act, runId, selected]
  );
  const handleBankExport = useCallback(async () => {
    if (!runId || rs !== "APPROVED") return;
    setBusy("bank export");
    try {
      const response = await exportBankFile(runId);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll-${selected.year}-${String(selected.month).padStart(2, "0")}-bank.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      successToast("Approved payroll bank file downloaded.");
      load();
    } catch (e) { apiErrorToast(e, "export bank file"); }
    finally { setBusy(""); }
  }, [runId, rs, selected, load]);
  const futureSel = isFuture(selected.month, selected.year);
  const locked = !!selRun?.is_locked;
  const selLabel = `${MONTHS[selected.month - 1]} ${selected.year}`;
  const quickActions = [
    { label: "Calculate Payroll", icon: <Calculator size={15} />, primary: true, onClick: handleProcess, disabled: processing || futureSel || locked || payrollPeriodStatus !== "INPUTS_LOCKED" },
    { label: busy === "submit for review" ? "Submitting…" : "Review Payroll", icon: <Eye size={15} />, onClick: handleReview, disabled: !runId || locked || busy === "submit for review" || (rs && rs !== "DRAFT" && rs !== "REJECTED") },
    { label: busy === "approve payroll" ? "Approving…" : "Approve Payroll", icon: <CheckCheck size={15} />, onClick: handleApprove, disabled: locked || rs !== "PENDING_REVIEW" || busy === "approve payroll" },
    locked
      ? { label: busy === "unlock payroll" ? "Unlocking…" : "Unlock Payroll", icon: <Unlock size={15} />, onClick: handleUnlock, disabled: busy === "unlock payroll" }
      : { label: busy === "finalize payroll" ? "Finalizing…" : "Finalize Payroll", icon: <ShieldCheck size={15} />, onClick: handleFinalize, disabled: !runId || busy === "finalize payroll" },
    { label: busy === "close payroll period" ? "Closing…" : "Close Payroll Period", icon: <Archive size={15} />, onClick: handleClosePeriod, disabled: !runId || rs !== "APPROVED" || payrollPeriodStatus !== "INPUTS_LOCKED" || busy === "close payroll period" },
    { label: busy === "generate payslips" ? "Generating…" : "Generate Payslips", icon: <FileText size={15} />, onClick: handleGenerate, disabled: futureSel || locked || busy === "generate payslips" },
  ];;
  return (
    <div className={cssClass({ padding: "26px 30px", fontFamily: "var(--font-ui)", background: "#f8f9fb", minHeight: "100vh" })}>
      {/* Header */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 })}>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" })}>{approvalView ? "Payroll Approval & Lock" : "Payroll Overview"}</h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#98a2b3" })}>{approvalView ? "Review approvals and control the selected payroll period" : "Manage and monitor your monthly payroll process"} — {selLabel}</p>
        </div>
        <button onClick={handleProcess} disabled={processing || futureSel || payrollPeriodStatus !== "INPUTS_LOCKED"}
          className={cssClass({ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 9, cursor: processing || futureSel || payrollPeriodStatus !== "INPUTS_LOCKED" ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, boxShadow: `0 2px 10px ${BRAND}55`, opacity: processing || futureSel || payrollPeriodStatus !== "INPUTS_LOCKED" ? 0.6 : 1 })}>
          {processing ? <><Loader2 size={15} className={cssClass({ animation: "spin 1s linear infinite" })} /> Processing…</> : <><Play size={14} fill="#fff" /> Process Payroll</>}
        </button>
      </div>
      <MonthSelector months={months} selIdx={selIdx} scroll={scroll} onSelectIdx={setSelIdx} onScrollLeft={handleScrollLeft} onScrollRight={handleScrollRight} isProcessed={isProcessed} isFuture={isFuture} />
      <div className={cssClass({ marginBottom: 16 })}>
        <PayrollWorkflowGuide
          workflow={{
            navigate,
            hasRun: !!selRun,
            reviewStatus: rs,
            locked,
            hasPayslips: payslips.length > 0,
            exported: !!selRun?.payment_exported_at,
            runId,
            inputsLocked: payrollPeriodStatus === "INPUTS_LOCKED",
          }}
          onBankExport={handleBankExport}
          busy={busy === "bank export"}
        />
      </div>
      <PayrollDashboardInsights data={dashboard} loading={loading} periodLabel={selLabel} />
      {/* Controls / Health / Quick actions */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 1fr", gap: 14, marginBottom: 16 })}>
        <Card title="Attendance & Leave Control" subtitle={selLabel} icon={<ListChecks size={16} color="#16a34a" />}>
          <div className={cssClass({ display: "flex", gap: 12 })}>
            <LockControlCard title="Attendance" locked={attendanceRows.length > 0} lastUpdated={attLastUpdated} count={`${attendanceRows.length}`} countLabel="Records" onView={() => navigate(R.attendance)} onReopen={() => navigate(R.attendance)} />
            <LockControlCard title="Leave" locked={true} lastUpdated={selLabel} count={pendingLeaves.length} countLabel="Requests" onView={() => navigate(R.leave)} onReopen={() => navigate(R.leave)} />
          </div>
        </Card>
        <PayrollHealthCard percent={health.percent} checks={health.checks} exceptionsTotal={attentionCount} />
        <QuickActionsCard actions={quickActions} />
      </div>
      {/* Exceptions / Summary */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 16 })}>
        <ExceptionsPanel items={exceptions} total={attentionCount} onViewAll={() => navigate(R.inputs)} />
        <SummaryPanel employees={employees.length} eligible={eligible} excluded={excluded} />
      </div>
      {/* Activity / Overview / Leaves */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.3fr", gap: 14 })}>
        <ActivityTable rows={activityRows} />
        <ProcessOverviewCard steps={steps} />
        <LeaveRequestsPanel rows={pendingLeaves} onViewAll={() => navigate(R.leave)} />
      </div>
      {loading && (
        <div className={cssClass({ textAlign: "center", padding: 24, color: "#98a2b3", fontSize: 13 })}>
          <Loader2 size={20} className={cssClass({ animation: "spin 1s linear infinite" })} /> Loading payroll data…
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
