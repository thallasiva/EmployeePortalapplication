import React from "react";
import { Lock } from "lucide-react";
import { cssClass } from "../../../../../../utils/classStyles";
const NoActiveAppraisal = React.memo(function NoActiveAppraisal() {
  return <div className={cssClass({
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 40,
    textAlign: "center"
  })}>
      <div className={cssClass({
      width: 72,
      height: 72,
      borderRadius: "50%",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    })}>
        <Lock size={32} className={cssClass({
        color: "#cbd5e1"
      })} />
      </div>
      <h2 className={cssClass({
      fontSize: 18,
      fontWeight: 700,
      color: "#1e293b",
      margin: 0
    })}>
        No Active Appraisal
      </h2>
      <p className={cssClass({
      fontSize: 14,
      color: "#64748b",
      margin: 0
    })}>
        Your HR team hasn't rolled out a performance appraisal yet.<br />
        You'll see your form here once it's live.
      </p>
    </div>;
});
export { NoActiveAppraisal };
