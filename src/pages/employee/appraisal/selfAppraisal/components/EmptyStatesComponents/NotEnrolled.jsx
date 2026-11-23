import React from "react";
import { Lock } from "lucide-react";
import { cssClass } from "../../../../../../utils/classStyles";
import { BRAND } from "../../constants";
import CycleTypeBadge from ".././CycleTypeBadge";
const NotEnrolled = React.memo(function NotEnrolled({
  cycle
}) {
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
      background: "#fff7ed",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    })}>
        <Lock size={32} className={cssClass({
        color: BRAND
      })} />
      </div>
      <h2 className={cssClass({
      fontSize: 18,
      fontWeight: 700,
      color: "#1e293b",
      margin: 0
    })}>
        Appraisal Not Yet Assigned
      </h2>
      {cycle.cycle_type && <CycleTypeBadge type={cycle.cycle_type} />}
      <p className={cssClass({
      fontSize: 14,
      color: "#64748b",
      margin: 0,
      maxWidth: 380
    })}>
        Your HR admin hasn't enrolled you in the <strong>{cycle.fy_label}</strong> appraisal cycle yet.<br />
        Please check back later or contact your HR team.
      </p>
    </div>;
});
export { NotEnrolled };
