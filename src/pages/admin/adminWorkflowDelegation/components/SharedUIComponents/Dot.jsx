import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const Dot = React.memo(function Dot({
  color,
  label
}) {
  return <div className={cssClass({
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#6b7280"
  })}>
      <div className={cssClass({
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color
    })} />
      {label}
    </div>;
});
export { Dot };
