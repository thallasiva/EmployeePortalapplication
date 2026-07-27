import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const SkeletonCard = React.memo(function SkeletonCard() {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e5eaf0", borderRadius: 14,
      padding: 18, display: "flex", flexDirection: "column", gap: 14,
    })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between" })}>
        <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: "#f0f3f8" })} />
        <div className={cssClass({ width: 80, height: 22, borderRadius: 20, background: "#f0f3f8" })} />
      </div>
      <div>
        <div className={cssClass({ width: "55%", height: 12, borderRadius: 6, background: "#f0f3f8", marginBottom: 6 })} />
        <div className={cssClass({ width: "40%", height: 32, borderRadius: 6, background: "#e8ecf2" })} />
        <div className={cssClass({ width: "35%", height: 10, borderRadius: 6, background: "#f0f3f8", marginTop: 6 })} />
      </div>
      <div>
        <div className={cssClass({ width: "100%", height: 5, borderRadius: 5, background: "#f0f3f8" })} />
        <div className={cssClass({ width: "60%", height: 10, borderRadius: 6, background: "#f0f3f8", marginTop: 6 })} />
      </div>
    </div>
  );
});

export default SkeletonCard;
