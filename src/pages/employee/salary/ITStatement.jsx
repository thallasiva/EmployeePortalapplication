import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { FiscalYearPicker } from "../../../component/YearPicker";
import { getCurrentFiscalYearStart, getFiscalYearRangeLabel } from "../../../lib/dateUtils";

const fmt    = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const STANDARD_DEDUCTION = 50000;

function slabTax(income) {
  if (income <= 500000) return 0;
  let tax = 0;
  if (income > 1000000) { tax += (income - 1000000) * 0.3; income = 1000000; }
  if (income > 500000)  { tax += (income - 500000)  * 0.2; income = 500000;  }
  if (income > 250000)  { tax += (income - 250000)  * 0.05; }
  return Math.round(tax);
}

function StatCard({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? "#1e293b" : "#fff",
      border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px",
    }}>
      <p style={{ fontSize: 11, color: highlight ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: highlight ? "#fff" : "#1e293b", margin: "6px 0 0" }}>{value}</p>
    </div>
  );
}

function AccordionRow({ label, amount, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid #e8edf2", borderRadius: 8, marginBottom: 6, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "#f8fafc", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {open ? <ChevronDown size={15} style={{ color: "#64748b" }} /> : <ChevronRight size={15} style={{ color: "#64748b" }} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{label}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{fmt(amount)}</span>
      </button>
      {open && children && (
        <div style={{ padding: "0 16px 12px", background: "#fff" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc" }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{fmt(value)}</span>
    </div>
  );
}

export default function ITStatement() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [loading, setLoading]   = useState(true);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => {
        if (s?.basic) setBreakdown(calculatePayslip(Number(s.basic)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading…</div>;

  if (!breakdown || !breakdown.basic) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>No salary structure found. Please contact HR.</p>
      </div>
    );
  }

  const b = breakdown;
  const grossAnnual    = b.totalEarnings * 12;
  const pfAnnual       = b.pf * 12;
  const taxableIncome  = Math.max(0, grossAnnual - STANDARD_DEDUCTION - pfAnnual);
  const annualTax      = slabTax(taxableIncome);
  const cess           = Math.round(annualTax * 0.04);
  const totalAnnualTax = annualTax + cess;
  const monthlyTDS     = Math.round(totalAnnualTax / 12);

  // Simulate paid TDS (assume half year gone)
  const now = new Date();
  const fiscalMonth = now.getMonth() < 3 ? now.getMonth() + 9 : now.getMonth() - 3; // months since April
  const paidMonths = Math.min(fiscalMonth, 12);
  const taxPaidTillDate = monthlyTDS * paidMonths;
  const remainingTax = Math.max(0, totalAnnualTax - taxPaidTillDate);
  const remainingMonths = Math.max(1, 12 - paidMonths);

  const fyLabel = getFiscalYearRangeLabel(fiscalYearStart);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: 0 }}>Income Tax Statement</h1>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{fyLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-4 border border-[#d5dbe3] bg-white rounded text-[14px] outline-none" />
          <button style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
            background: "#3b82f6", color: "#fff", borderRadius: 8, border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Download size={15} />Download PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Annual Gross" value={fmt(grossAnnual)} />
        <StatCard label="Standard Deduction" value={fmt(STANDARD_DEDUCTION)} />
        <StatCard label="Taxable Income" value={fmt(taxableIncome)} />
        <StatCard label="Annual Tax + Cess" value={fmt(totalAnnualTax)} highlight />
        <StatCard label="Monthly TDS" value={fmt(monthlyTDS)} />
      </div>

      {/* Tax progress */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>TDS Recovery Progress</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>Month {paidMonths} of 12</span>
        </div>
        <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${Math.round((taxPaidTillDate / (totalAnnualTax || 1)) * 100)}%`,
            height: "100%", background: "linear-gradient(90deg,#3b82f6,#06b6d4)", borderRadius: 999,
            transition: "width 0.4s",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Paid: {fmt(taxPaidTillDate)}</span>
          <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>Remaining: {fmt(remainingTax)} ({remainingMonths} months)</span>
        </div>
      </div>

      {/* Accordion sections */}
      <div>
        <AccordionRow label="A. Gross Salary" amount={grossAnnual}>
          <DetailRow label="Basic Salary" value={b.basic * 12} />
          <DetailRow label="HRA" value={b.hra * 12} />
          <DetailRow label="Special Allowance" value={b.specialAllowance * 12} />
          <DetailRow label="LTA" value={b.lta * 12} />
          <DetailRow label="Telephone & Internet" value={b.telephoneAndInternet * 12} />
          <DetailRow label="Medical Allowance" value={b.medicalAllowance * 12} />
          <DetailRow label="Conveyance" value={b.conveyanceAllowance * 12} />
          <DetailRow label="Bonus" value={b.bonus * 12} />
          <DetailRow label="Incentives" value={b.incentives * 12} />
        </AccordionRow>

        <AccordionRow label="B. Standard Deduction" amount={STANDARD_DEDUCTION}>
          <DetailRow label="Standard Deduction (Section 16)" value={STANDARD_DEDUCTION} />
        </AccordionRow>

        <AccordionRow label="C. Deductions (Chapter VI-A)" amount={pfAnnual}>
          <DetailRow label="PF Contribution (80C)" value={pfAnnual} />
        </AccordionRow>

        <AccordionRow label="D. Taxable Income (A − B − C)" amount={taxableIncome}>
          <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0" }}>
            {fmt(grossAnnual)} − {fmt(STANDARD_DEDUCTION)} − {fmt(pfAnnual)} = {fmt(taxableIncome)}
          </p>
        </AccordionRow>

        <AccordionRow label="E. Tax on Total Income" amount={annualTax}>
          <DetailRow label="Tax (Old Regime Slabs)" value={annualTax} />
          <DetailRow label="Education Cess (4%)" value={cess} />
          <DetailRow label="Total Tax Payable" value={totalAnnualTax} />
        </AccordionRow>

        <AccordionRow label="F. TDS Recovered" amount={taxPaidTillDate}>
          <DetailRow label={`Monthly TDS × ${paidMonths} months`} value={taxPaidTillDate} />
        </AccordionRow>

        <AccordionRow label="G. Balance Tax Payable" amount={remainingTax}>
          <DetailRow label={`Spread over ${remainingMonths} months`} value={monthlyTDS} />
        </AccordionRow>
      </div>
    </div>
  );
}
