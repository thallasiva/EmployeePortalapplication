import React from "react";
import {
  Banknote, BriefcaseBusiness, Calculator, CheckCircle2, ClipboardList,
  FileCheck2, Landmark, Settings2, ShieldCheck, ChartNoAxesCombined,
} from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import Card from "./Card";

const STAGES = [
  { key: "setup", number: "01", title: "Payroll setup", detail: "Pay calendar and salary rules", icon: Settings2, path: "/dashboard/payroll/setup" },
  { key: "salary", number: "02", title: "Employee salaries", detail: "Structures and effective dates", icon: BriefcaseBusiness, path: "/dashboard/salary-assignment" },
  { key: "inputs", number: "03", title: "Monthly inputs", detail: "Attendance, LOP and adjustments", icon: ClipboardList, path: "/dashboard/payroll/inputs" },
  { key: "calculate", number: "04", title: "Calculate payroll", detail: "Review the employee preview", icon: Calculator, path: "/dashboard/payroll/process" },
  { key: "approve", number: "05", title: "Review & approve", detail: "Submit and record approval", icon: ShieldCheck, path: "/dashboard/payroll" },
  { key: "payment", number: "06", title: "Bank payment file", detail: "Export after approval", icon: Landmark, action: "bankExport" },
  { key: "payslips", number: "07", title: "Payslips", detail: "Generate and publish employee slips", icon: FileCheck2, path: "/dashboard/payroll/payslips" },
  { key: "compliance", number: "08", title: "Tax & compliance", detail: "Declarations and statutory records", icon: Banknote, path: "/dashboard/payroll/compliance" },
  { key: "reports", number: "09", title: "Payroll reports", detail: "Statements and year-to-date totals", icon: ChartNoAxesCombined, path: "/dashboard/payroll/statement" },
];

function stageState(stage, { hasRun, reviewStatus, locked, hasPayslips, exported, inputsLocked }) {
  if (stage === "inputs") return inputsLocked ? "Inputs locked" : "Review and lock inputs";
  if (stage === "calculate") return hasRun ? "Calculated" : "Ready to start";
  if (stage === "approve") {
    if (reviewStatus === "APPROVED") return "Approved";
    if (reviewStatus === "PENDING_REVIEW") return "Awaiting approval";
    return hasRun ? "Submit for review" : "After calculation";
  }
  if (stage === "payment") return exported ? "File exported" : reviewStatus === "APPROVED" ? "Ready to export" : "After approval";
  if (stage === "payslips") return hasPayslips || locked ? "Available" : "After payroll run";
  return "Open module";
}

export default function PayrollWorkflowGuide({ workflow = {}, onBankExport, busy = false }) {
  return (
    <Card title="Payroll workflow" subtitle="Follow these steps each month. Select a step to open its screen." icon={<CheckCircle2 size={16} color="#e87500" />}>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 })}>
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const label = stageState(stage.key, workflow);
          const disabled = (stage.action === "bankExport" && (!workflow.runId || workflow.reviewStatus !== "APPROVED" || busy)) || (stage.key === "calculate" && !workflow.inputsLocked);
          const onClick = stage.action === "bankExport" ? onBankExport : () => workflow.navigate(stage.path);
          return (
            <button key={stage.key} type="button" onClick={onClick} disabled={disabled}
              className={cssClass({
                display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", minHeight: 90,
                padding: 12, borderRadius: 11, border: "1px solid #f0e4d8", background: disabled ? "#fafafa" : "#fffaf5",
                cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.7 : 1,
              })}>
              <span className={cssClass({ width: 30, height: 30, flex: "0 0 30px", display: "grid", placeItems: "center", borderRadius: 9, color: "#e87500", background: "#ffedd5" })}><Icon size={16} /></span>
              <span>
                <span className={cssClass({ display: "block", color: "#98a2b3", fontSize: 10, fontWeight: 800, letterSpacing: ".06em" })}>STEP {stage.number}</span>
                <span className={cssClass({ display: "block", marginTop: 2, color: "#182230", fontSize: 12.5, fontWeight: 800 })}>{stage.title}</span>
                <span className={cssClass({ display: "block", marginTop: 2, color: "#667085", fontSize: 10.5, lineHeight: 1.35 })}>{stage.detail}</span>
                <span className={cssClass({ display: "inline-block", marginTop: 7, color: "#b45309", fontSize: 10.5, fontWeight: 700 })}>{stage.action === "bankExport" && busy ? "Preparing file…" : label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
