import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Loader2, Users, IndianRupee, TrendingDown, Wallet, AlertTriangle,
  Calculator, Eye, CheckCheck, ShieldCheck, FileText, ListChecks, Unlock,
} from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import { successToast, apiErrorToast } from "../../../utils/ToastControllers";
import { MSG } from "../../../utils/toastMessages";
import { BRAND, MONTHS, VISIBLE } from "./constants";
import { buildMonthList, fmtINR } from "./utils";
import { deriveSteps, computeExceptions, computeHealth, fmtDateTime } from "./utils/derive";
import { usePayrollData } from "./hooks/usePayrollData";
import { listLeaveRequests } from "../../../api/leaveRequest.api";
import {
  generateAllPayslips, submitPayrollReview, reviewPayrollRun, lockPayrollRun, unlockPayrollRun,
} from "../../../api/payroll.api";

import MonthSelector from "./components/MonthSelector";
import Card from "./components/Card";
import ProcessStepper from "./components/ProcessStepper";
import StatCard from "./components/StatCard";
import LockControlCard from "./components/LockControlCard";
import PayrollHealthCard from "./components/PayrollHealthCard";
import QuickActionsCard from "./components/QuickActionsCard";
import ExceptionsPanel from "./components/ExceptionsPanel";
import SummaryPanel from "./components/SummaryPanel";
import ActivityTable from "./components/ActivityTable";
import ProcessOverviewCard from "./components/ProcessOverviewCard";
import LeaveRequestsPanel from "./components/LeaveRequestsPanel";

const months = buildMonthList();

// Admin route targets (mounted under /dashboard)
const R = {
  attendance: "/dashboard/attendance",
  leave: "/dashboard/leave",
  payslips: "/dashboard/payroll/payslips",
  inputs: "/dashboard/payroll/inputs",
};

export default function AdminPayrollOverview() {
  const now = new Date();
  const navigate = useNavigate();
  const [selIdx, setSelIdx] = useState(3);
  const [scroll, setScroll] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [busy, setBusy] = useState("");

  const selected = months[selIdx];
  const { payslips, employees, attendanceRows, runs, loading, processing, handleProcess, load } = usePayrollData(selected);

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

  const gross = useMemo(() => payslips.reduce((s, p) => s + Number(p.gross_earnings || p.gross || 0), 0), [payslips]);
  const deductions = useMemo(() => payslips.reduce((s, p) => s + Number(p.deductions || 0), 0), [payslips]);
  const net = useMemo(() => payslips.reduce((s, p) => s + Number(p.net_pay || p.net || 0), 0), [payslips]);

  const selRun = useMemo(
    () => runs.find((r) => Number(r.month) === selected.month && Number(r.year) === selected.year),
    [runs, selected]
  );
  const runId = selRun?.payroll_run_id;
  const rs = selRun?.review_status;

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
    [...runs]
      .sort((a, b) => new Date(b.processed_on || b.created_at || 0) - new Date(a.processed_on || a.created_at || 0))
      .slice(0, 6)
      .map((r) => ({
        when: fmtDateTime(r.processed_on || r.created_at),
        action: `Payroll ${MONTHS[(Number(r.month) || 1) - 1]} ${r.year}`,
        user: r.processed_by_name || (r.processed_by ? `User #${r.processed_by}` : "System"),
        status: r.review_status || r.status,
      })),
    [runs]
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

  const futureSel = isFuture(selected.month, selected.year);
  const locked = !!selRun?.is_locked;
  const hasPayslips = payslips.length > 0;
  const selLabel = `${MONTHS[selected.month - 1]} ${selected.year}`;

  const quickActions = [
    { label: "Calculate Payroll", icon: <Calculator size={15} />, primary: true, onClick: handleProcess, disabled: processing || futureSel || locked },
    { label: busy === "submit for review" ? "Submitting…" : "Review Payroll", icon: <Eye size={15} />, onClick: handleReview, disabled: !runId || locked || busy === "submit for review" || (rs && rs !== "DRAFT" && rs !== "REJECTED") },
    { label: busy === "approve payroll" ? "Approving…" : "Approve Payroll", icon: <CheckCheck size={15} />, onClick: handleApprove, disabled: locked || rs !== "PENDING_REVIEW" || busy === "approve payroll" },
    locked
      ? { label: busy === "unlock payroll" ? "Unlocking…" : "Unlock Payroll", icon: <Unlock size={15} />, onClick: handleUnlock, disabled: busy === "unlock payroll" }
      : { label: busy === "finalize payroll" ? "Finalizing…" : "Finalize Payroll", icon: <ShieldCheck size={15} />, onClick: handleFinalize, disabled: !runId || busy === "finalize payroll" },
    { label: busy === "generate payslips" ? "Generating…" : "Generate Payslips", icon: <FileText size={15} />, onClick: handleGenerate, disabled: futureSel || locked || busy === "generate payslips" },
  ];;

  return (
    <div className={cssClass({ padding: "26px 30px", fontFamily: "Inter, system-ui, sans-serif", background: "#f8f9fb", minHeight: "100vh" })}>
      {/* Header */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 })}>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" })}>Payroll Overview</h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#98a2b3" })}>Manage and monitor your monthly payroll process — {selLabel}</p>
        </div>
        <button onClick={handleProcess} disabled={processing || futureSel}
          className={cssClass({ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 9, cursor: processing || futureSel ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, boxShadow: `0 2px 10px ${BRAND}55`, opacity: processing || futureSel ? 0.6 : 1 })}>
          {processing ? <><Loader2 size={15} className={cssClass({ animation: "spin 1s linear infinite" })} /> Processing…</> : <><Play size={14} fill="#fff" /> Process Payroll</>}
        </button>
      </div>

      <MonthSelector months={months} selIdx={selIdx} scroll={scroll} onSelectIdx={setSelIdx} onScrollLeft={handleScrollLeft} onScrollRight={handleScrollRight} isProcessed={isProcessed} isFuture={isFuture} />

      {/* Process status */}
      <div className={cssClass({ marginBottom: 16 })}>
        <Card title="Payroll Process Status" subtitle="Track each stage of the monthly run" icon={<ListChecks size={16} color={BRAND} />}>
          <ProcessStepper steps={steps} />
        </Card>
      </div>

      {/* KPI row */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 16 })}>
        <StatCard icon={<Users size={17} />} label="Total Employees" value={loading ? "—" : employees.length} sub="Active Employees" accent="#2563eb" tint="#eff6ff" />
        <StatCard icon={<IndianRupee size={17} />} label="Gross Payroll" value={loading ? "—" : fmtINR(gross, true)} sub="Total Gross Salary" accent="#f18200" tint="#fff7ed" />
        <StatCard icon={<TrendingDown size={17} />} label="Deductions" value={loading ? "—" : fmtINR(deductions, true)} sub="PF, TDS, PT, etc." accent="#e11d48" tint="#fff1f2" />
        <StatCard icon={<Wallet size={17} />} label="Net Payroll" value={loading ? "—" : fmtINR(net, true)} sub="Total Take Home" accent="#16a34a" tint="#f0fdf4" />
        <StatCard icon={<AlertTriangle size={17} />} label="Exceptions" value={loading ? "—" : attentionCount} sub="Employees to review" alert accent="#dc2626" tint="#fef2f2" />
      </div>

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
