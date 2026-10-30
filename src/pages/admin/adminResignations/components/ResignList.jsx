import React from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import ResignRow from "./ResignRow";
const ResignList = React.memo(function ResignList({ loading, error, visible, paged, onReview }) {
  if (loading) {
    return (
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>Loading…</div>
    );
  }
  if (error) {
    return (
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#dc2626" })}>
        <AlertTriangle size={40} color="#fca5a5" className={cssClass({ marginBottom: 12 })} />
        <p className={cssClass({ margin: 0 })}>{error}</p>
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className={cssClass({
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", minHeight: 220,
        padding: 32, color: "#dc2626", background: "#fff",
        border: "1px solid #e2e8f0", borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      })}>
        <div className={cssClass({
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 52, height: 52, marginBottom: 12, borderRadius: "50%",
          background: "#fef2f2",
        })}>
          <LogOut size={24} color="#dc2626" />
        </div>
        <p className={cssClass({ margin: 0, color: "#dc2626", fontSize: 14, fontWeight: 600 })}>
          No resignations found.
        </p>
      </div>
    );
  }
  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
      {paged.map((r) => <ResignRow key={r.resignation_id} row={r} onReview={onReview} />)}
    </div>
  );
});
export default ResignList;
