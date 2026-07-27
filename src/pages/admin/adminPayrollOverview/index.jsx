import React, { useState, useCallback, useMemo } from "react";
import { Play, Loader2, DollarSign, CheckCircle2, Landmark, Users } from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import { BRAND, MONTHS, VISIBLE } from "./constants";
import { buildMonthList, fmtINR } from "./utils";
import { usePayrollData } from "./hooks/usePayrollData";
import MonthSelector from "./components/MonthSelector";
import KpiChip from "./components/KpiChip";
import PayoutDetailsPanel from "./components/PayoutDetailsPanel";
import EmployeeDetailsPanel from "./components/EmployeeDetailsPanel";
import PayrollControlsPanel from "./components/PayrollControlsPanel";

const months = buildMonthList();

export default function AdminPayrollOverview() {
  const now = new Date();
  const [selIdx, setSelIdx] = useState(3);
  const [scroll, setScroll] = useState(0);
  const [controls, setControls] = useState({
    payrollInputs: false,
    employeeView: false,
    itStatementView: false,
    payroll: false,
  });

  const selected = months[selIdx];
  const { payslips, employees, runs, loading, processing, handleProcess } = usePayrollData(selected);

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

  const handleControlChange = useCallback((key, val) => setControls((c) => ({ ...c, [key]: val })), []);
  const handleScrollLeft = useCallback(() => setScroll((s) => Math.max(0, s - 1)), []);
  const handleScrollRight = useCallback(() => setScroll((s) => Math.min(months.length - VISIBLE, s + 1)), []);

  const selLabel = `${MONTHS[selected.month - 1]} ${selected.year}`;

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "Inter, system-ui, sans-serif", background: "#f8f9fb", minHeight: "100vh" })}>

      {/* Page Header */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 })}>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" })}>Payroll Overview</h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" })}>
            Process and manage monthly payroll — {selLabel}
          </p>
        </div>
        <button
          onClick={handleProcess}
          disabled={processing || isFuture(selected.month, selected.year)}
          className={cssClass({
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 24px", background: BRAND, color: "#fff",
            border: "none", borderRadius: 9, cursor: "pointer",
            fontWeight: 700, fontSize: 14, boxShadow: `0 2px 10px ${BRAND}55`,
            opacity: processing || isFuture(selected.month, selected.year) ? .6 : 1,
          })}
        >
          {processing
            ? <><Loader2 size={15} className={cssClass({ animation: "spin 1s linear infinite" })} /> Processing…</>
            : <><Play size={14} fill="#fff" /> Process Payroll</>}
        </button>
      </div>

      <MonthSelector
        months={months}
        selIdx={selIdx}
        scroll={scroll}
        onSelectIdx={setSelIdx}
        onScrollLeft={handleScrollLeft}
        onScrollRight={handleScrollRight}
        isProcessed={isProcessed}
        isFuture={isFuture}
      />

      {/* KPI Row */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 })}>
        <KpiChip icon={<DollarSign size={18} color={BRAND} />}     label="Gross Pay"   value={fmtINR(gross, true)}      accent={BRAND} />
        <KpiChip icon={<CheckCircle2 size={18} color="#16a34a" />}  label="Net Pay"     value={fmtINR(net, true)}        accent="#16a34a" />
        <KpiChip icon={<Landmark size={18} color="#6366f1" />}      label="Deductions"  value={fmtINR(deductions, true)} accent="#6366f1" />
        <KpiChip icon={<Users size={18} color="#0ea5e9" />}         label="Employees"   value={employees.length}         accent="#0ea5e9" />
      </div>

      {loading ? (
        <div className={cssClass({ textAlign: "center", padding: 80, color: "#9ca3af", fontSize: 14 })}>
          <Loader2 size={30} className={cssClass({ animation: "spin 1s linear infinite", marginBottom: 10 })} />
          <div>Loading payroll data…</div>
        </div>
      ) : (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 })}>
          <PayoutDetailsPanel payslips={payslips} />
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
            <EmployeeDetailsPanel
              employees={employees}
              payslips={payslips}
              selected={selected}
              isProcessed={isProcessed}
            />
            <PayrollControlsPanel controls={controls} onControlChange={handleControlChange} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
