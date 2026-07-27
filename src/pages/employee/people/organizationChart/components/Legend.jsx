import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const Legend = React.memo(function Legend({ depts }) {
  if (!depts.length) return null;
  return (
    <div className={cssClass({ display: "flex", flexWrap: "wrap", gap: "8px 18px", margin: "8px 0" })}>
      {depts.map((d) => (
        <span
          key={d.id}
          className={cssClass({ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" })}
        >
          <span className={cssClass({
            width: 9, height: 9, borderRadius: "50%",
            background: d.color, display: "inline-block", flexShrink: 0,
          })} />
          {d.label}
        </span>
      ))}
    </div>
  );
});

export default Legend;
