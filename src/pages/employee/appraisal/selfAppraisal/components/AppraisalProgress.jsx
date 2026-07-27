import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const AppraisalProgress = React.memo(function AppraisalProgress({ rated, total, avgRating }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: "14px 18px", marginBottom: 18,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    })}>
      <div className={cssClass({ flex: 1 })}>
        <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: "0 0 6px" })}>
          Progress: {rated}/{total} parameters rated
        </p>
        <div className={cssClass({ height: 6, background: "#f1f5f9", borderRadius: 999 })}>
          <div
            className={cssClass({
              width: `${(rated / Math.max(total, 1)) * 100}%`,
              height: "100%", background: BRAND, borderRadius: 999, transition: "width 0.3s",
            })}
          />
        </div>
      </div>
      {avgRating > 0 && (
        <div className={cssClass({ textAlign: "center", minWidth: 60 })}>
          <p className={cssClass({ fontSize: 24, fontWeight: 800, color: BRAND, margin: 0 })}>
            {avgRating}
          </p>
          <p className={cssClass({ fontSize: 10, color: "#94a3b8", margin: 0 })}>Avg / 5</p>
        </div>
      )}
    </div>
  );
});

export default AppraisalProgress;
