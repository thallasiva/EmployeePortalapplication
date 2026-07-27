import React, { useState } from "react";
import { Download, Info } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { FiscalYearPicker } from "../../../../component/YearPicker";
import { getCurrentFiscalYearStart } from "../../../../lib/dateUtils";
import { useITStatementData } from "./hooks/useITStatementData";
import { computeTaxSummary } from "./utils/taxCalc";
import ViewDetailsModal from "./components/ViewDetailsModal";
import KpiCards from "./components/KpiCards";
import { SectionA, SectionB, SectionC, SectionD } from "./components/IncomeSection";
import { SectionF, SectionG } from "./components/ExemptionSections";
import { SectionI, SectionK, SectionM } from "./components/ChargeableSections";
import { SectionO, SectionP, SectionQ, SectionR } from "./components/TaxSections";
import { CalcRow } from "./components/TablePrimitives";

const ALL_OPEN = { a: true, b: true, c: true, d: true, f: true, g: true, i: true, k: true, ki: true, kh: true, m: true, o: true, p: true, q: true, r: true };
const ALL_CLOSED = { a: false, b: false, c: false, d: false, f: false, g: false, i: false, k: false, ki: false, kh: false, m: false, o: false, p: false, q: false, r: false };

export default function ITStatement() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [regime, setRegime] = useState("new");
  const [showInfo, setShowInfo] = useState(false);
  const [showHRA, setShowHRA] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [open, setOpen] = useState(ALL_CLOSED);

  const tog = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const toggleAll = () => {
    const next = !allOpen;
    setAllOpen(next);
    setOpen(next ? ALL_OPEN : ALL_CLOSED);
  };

  const { empInfo, loading, detectedRegime, fiscalMonths, monthData, T } =
    useITStatementData({ fiscalYearStart });

  // Apply detected regime on first load (when detectedRegime changes from null)
  React.useEffect(() => {
    if (detectedRegime) setRegime(detectedRegime);
  }, [detectedRegime]);

  const tax = computeTaxSummary({ T, regime });
  const { isNew, grossSalary, hraExemption, prevEmployerInc, incAfterExempt, STD_DED, stdDed,
    chargeableSal, grossTotal, ch8Ded, taxableIncome, rawTax, cess, totalTax,
    monthlyTDS, taxPaid, remaining, monthlyCess, monthlyRaw } = tax;

  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 })}>Loading...</div>;

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f0f4f8", padding: 20 })}>
      {showViewDetails && <ViewDetailsModal onClose={() => setShowViewDetails(false)} totals={T} />}

      {/* Top bar */}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#e8f4fb", border: "1px solid #b8d9f0", borderRadius: 6, fontSize: 12, color: "#1e6b9e", flex: 1 })}>
          <span>&#9432;</span>
          <span>Section names updated as per Income Tax Act 2025. Your saved data remains unchanged.</span>
          <button onClick={() => setShowViewDetails(true)} className={cssClass({ color: "#f18200", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 12 })}>View Details</button>
        </div>
        <div className={cssClass({ display: "flex", gap: 10, alignItems: "center" })}>
          <button className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#f18200", color: "#fff", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
            <Download size={13} />
          </button>
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart} />
        </div>
      </div>

      {/* Regime toggle */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 0, marginBottom: 16, background: "#fff", border: "1px solid #d5dbe3", borderRadius: 8, padding: 4, width: "fit-content" })}>
        {[
          { key: "new", label: "New Tax Regime", sub: "IT Act 2025" },
          { key: "old", label: "Old Tax Regime", sub: "IT Act 1961" },
        ].map(({ key, label, sub }) => (
          <button key={key} type="button" onClick={() => setRegime(key)}
            className={cssClass({ padding: "8px 22px", border: "none", borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
              background: regime === key ? "#f18200" : "transparent",
              color: regime === key ? "#fff" : "#64748b",
              fontWeight: regime === key ? 700 : 400, fontSize: 13 })}>
            <div>{label}</div>
            <div className={cssClass({ fontSize: 10, opacity: 0.8, fontWeight: 400 })}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Regime info banner */}
      <div className={cssClass({ marginBottom: 14, padding: "10px 14px", background: isNew ? "#fffbeb" : "#f0fdf4", border: `1px solid ${isNew ? "#fde68a" : "#bbf7d0"}`, borderRadius: 6, fontSize: 12 })}>
        {isNew
          ? <span className={cssClass({ color: "#92400e" })}><strong>New Tax Regime (IT Act 2025):</strong> Standard deduction ₹75,000. No Chapter VI-A/VIII deductions. Lower slab rates (0%–30% in 6 bands).</span>
          : <span className={cssClass({ color: "#166534" })}><strong>Old Tax Regime (IT Act 1961):</strong> Standard deduction ₹50,000. Chapter VI-A deductions applicable (80C PF up to ₹1.5L, etc.). Slab rates: 0%/5%/20%/30%.</span>
        }
      </div>

      {/* Employee info toggle */}
      <div className={cssClass({ marginBottom: 14 })}>
        <button type="button" onClick={() => setShowInfo((v) => !v)}
          className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", border: "1px solid #d5dbe3", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#334155" })}>
          <Info size={14} color="#f18200" />
          {showInfo ? "Hide Employee Info" : "Show Employee Info"}
        </button>
        {showInfo && (
          <div className={cssClass({ marginTop: 8, background: "#fff", border: "1px solid #d5dbe3", borderRadius: 8, padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: "18px 40px" })}>
            {[
              { label: "Name", value: empInfo?.name },
              { label: "Bank", value: empInfo?.bank },
              { label: "Bank Account No", value: empInfo?.bankAcc },
              { label: "Joining Date", value: empInfo?.joining },
              { label: "PF No", value: empInfo?.pfNo },
            ].map(({ label, value }) => (
              <div key={label} className={cssClass({ minWidth: 160 })}>
                <div className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 })}>{label}</div>
                <div className={cssClass({ fontSize: 13, fontWeight: 700, color: value && value !== "—" ? "#1e293b" : "#94a3b8" })}>{value || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <KpiCards isNew={isNew} stdDed={stdDed} ch8Ded={ch8Ded} totalTax={totalTax} monthlyTDS={monthlyTDS} />

      {/* Expand / collapse */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 })}>
        <button type="button" onClick={toggleAll} className={cssClass({ fontSize: 12, color: "#1e6b9e", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, textDecoration: "underline" })}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
        <span className={cssClass({ fontSize: 12, color: "#64748b" })}>Value in ₹</span>
      </div>

      <div className={cssClass({ background: "#fff", border: "1px solid #d5dbe3", borderRadius: 8, overflow: "hidden" })}>
        <SectionA open={open.a} onToggle={() => tog("a")} fiscalMonths={fiscalMonths} monthData={monthData} T={T} />
        <SectionB open={open.b} onToggle={() => tog("b")} fiscalMonths={fiscalMonths} monthData={monthData} T={T} />
        <SectionC open={open.c} onToggle={() => tog("c")} />
        <SectionD open={open.d} onToggle={() => tog("d")} />
        <CalcRow label="E. Gross Salary (A + C - D)" amount={grossSalary} />
        <SectionF open={open.f} onToggle={() => tog("f")} hraExemption={hraExemption} T={T} showHRA={showHRA} setShowHRA={setShowHRA} />
        <SectionG open={open.g} onToggle={() => tog("g")} prevEmployerInc={prevEmployerInc} />
        <CalcRow label="H. Income After Exemption (E - F + G)" amount={incAfterExempt} />
        <SectionI open={open.i} onToggle={() => tog("i")} isNew={isNew} stdDed={stdDed} STD_DED={STD_DED} />
        <CalcRow label="J. Income Chargeable Under The Head Salaries (H - I)" amount={chargeableSal} />
        <SectionK open={open.k} onToggle={() => tog("k")} openKi={open.ki} onToggleKi={() => tog("ki")} openKh={open.kh} onToggleKh={() => tog("kh")} />
        <CalcRow label="L. Gross Total Income (J + K)" amount={grossTotal} />
        <SectionM open={open.m} onToggle={() => tog("m")} isNew={isNew} ch8Ded={ch8Ded} />
        <CalcRow label="N. Taxable Income (L - M)" amount={taxableIncome} />
        <SectionO open={open.o} onToggle={() => tog("o")} totalTax={totalTax} regime={regime} taxableIncome={taxableIncome} rawTax={rawTax} cess={cess} />
        <SectionP open={open.p} onToggle={() => tog("p")} taxPaid={taxPaid} />
        <SectionQ open={open.q} onToggle={() => tog("q")} remaining={remaining} rawTax={rawTax} cess={cess} />
        <SectionR open={open.r} onToggle={() => tog("r")} monthlyTDS={monthlyTDS} monthlyRaw={monthlyRaw} monthlyCess={monthlyCess} />
      </div>
    </div>
  );
}
