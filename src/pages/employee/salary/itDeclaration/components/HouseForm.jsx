import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDec } from "../utils/formatters";

function HouseForm({ house, onChange }) {
  const setField = (k, v) => onChange({ ...house, [k]: v });
  const net =
    Number(house.annualValue || 0) -
    Number(house.municipalTax || 0) -
    Number(house.unrealizedRent || 0);
  const stdDed = Math.round(Math.max(net, 0) * 0.3);
  const incLoss = net - stdDed - Number(house.homeLoanInterest || 0);

  const fieldStyle = {
    width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
    borderRadius: 6, fontSize: 12, outline: "none", background: "#fff",
    boxSizing: "border-box"
  };
  const amtStyle = {
    width: 130, padding: "7px 10px", border: "1px solid #e2e8f0",
    borderRadius: 6, fontSize: 12, outline: "none", textAlign: "right",
    background: "#fff", flexShrink: 0
  };
  const rowStyle = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#475569", gap: 8
  };

  return (
    <div className={cssClass({ padding: "2px 0" })}>
      <div className={cssClass(rowStyle)}>
        <span className={cssClass({ flex: 1 })}>1. Annual Letable Value / Rent Received or Receivable</span>
        <input type="number" value={house.annualValue || ""} onChange={(e) => setField("annualValue", Number(e.target.value) || 0)}
          placeholder="₹ 0" className={cssClass(amtStyle)} />
      </div>
      <div className={cssClass(rowStyle)}>
        <span className={cssClass({ flex: 1 })}>2. Less: Municipal Taxes Paid During the Year</span>
        <input type="number" value={house.municipalTax || ""} onChange={(e) => setField("municipalTax", Number(e.target.value) || 0)}
          placeholder="₹ 0" className={cssClass(amtStyle)} />
      </div>
      <div className={cssClass(rowStyle)}>
        <span className={cssClass({ flex: 1 })}>3. Less: Unrealized Rent</span>
        <input type="number" value={house.unrealizedRent || ""} onChange={(e) => setField("unrealizedRent", Number(e.target.value) || 0)}
          placeholder="₹ 0" className={cssClass(amtStyle)} />
      </div>
      {}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 10px", borderRadius: 6, margin: "4px 0",
        background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12 })}>
        <span className={cssClass({ color: "#64748b" })}>4. Net Annual Value (1 − 2 − 3)</span>
        <strong className={cssClass({ color: "#1e293b" })}>{fmtDec(net)}</strong>
      </div>
      {}
      <div className={cssClass({ fontSize: 12, fontWeight: 600, color: "#64748b", padding: "6px 0 2px" })}>
        5. Less: Deductions from Net Annual Value
      </div>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 0 6px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#64748b" })}>
        <span>5.1. Standard Deduction @ 30% of Net Annual Value</span>
        <strong className={cssClass({ color: "#1e293b" })}>{fmtDec(stdDed)}</strong>
      </div>
      {}
      <div className={cssClass({ padding: "8px 0 8px 14px", borderBottom: "1px solid #f1f5f9" })}>
        <div className={cssClass({ fontSize: 12, color: "#475569", marginBottom: 8 })}>5.2. Interest on Housing Loan (Let-out)</div>
        <div className={cssClass({ display: "flex", gap: 8, marginBottom: 8 })}>
          <div className={cssClass({ flex: 1 })}>
            <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 3 })}>Lender's Name</div>
            <input type="text" value={house.lenderName || ""} onChange={(e) => setField("lenderName", e.target.value)}
              placeholder="Enter lender name" className={cssClass(fieldStyle)} />
          </div>
          <div className={cssClass({ flex: 1 })}>
            <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 3 })}>Lender's PAN</div>
            <input type="text" value={house.lenderPAN || ""} onChange={(e) => setField("lenderPAN", e.target.value)}
              placeholder="Enter PAN" className={cssClass(fieldStyle)} />
          </div>
        </div>
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 })}>
          <span className={cssClass({ fontSize: 12, color: "#64748b" })}>Interest Amount (₹)</span>
          <input type="number" value={house.homeLoanInterest || ""} onChange={(e) => setField("homeLoanInterest", Number(e.target.value) || 0)}
            placeholder="₹ 0" className={cssClass(amtStyle)} />
        </div>
      </div>
      {}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 12px", borderRadius: 8, marginTop: 8,
        background: incLoss < 0 ? "#fff1f2" : "#f0fdf4",
        border: `1px solid ${incLoss < 0 ? "#fecdd3" : "#bbf7d0"}` })}>
        <span className={cssClass({ fontSize: 12, fontWeight: 600, color: incLoss < 0 ? "#be123c" : "#15803d" })}>
          6. Income / Loss from Let Out Property
        </span>
        <strong className={cssClass({ fontSize: 13, color: incLoss < 0 ? "#be123c" : "#15803d" })}>{fmtDec(incLoss)}</strong>
      </div>
    </div>
  );
}

export default React.memo(HouseForm);
