import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

function DeclarationHeader({ cycle, totalDeclared, annualGross }) {
  return (
    <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 })}>
      <div>
        <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" })}>IT Declaration</h1>
        <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" })}>
          {cycle
            ? `${cycle.fy_label} · Deadline: ${cycle.end_date
                ? new Date(cycle.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "—"}`
            : "No active cycle"}
          &nbsp;|&nbsp; Total Declared:{" "}
          <strong className={cssClass({ color: "#f18200" })}>
            ₹{Math.round(totalDeclared).toLocaleString("en-IN")}
          </strong>
          &nbsp;|&nbsp; Annual Gross: ₹{Math.round(annualGross).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

export default React.memo(DeclarationHeader);
