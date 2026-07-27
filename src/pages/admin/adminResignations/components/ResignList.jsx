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
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>
        <LogOut size={40} color="#e2e8f0" className={cssClass({ marginBottom: 12 })} />
        <p className={cssClass({ margin: 0 })}>No resignations found.</p>
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
