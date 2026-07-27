import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const SectionHead = React.memo(function SectionHead({ children }) {
  return (
    <p className={cssClass({
      margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: BRAND,
      textTransform: "uppercase", letterSpacing: "0.07em",
      display: "flex", alignItems: "center", gap: 6,
    })}>
      <span className={cssClass({ display: "inline-block", width: 3, height: 12, background: BRAND, borderRadius: 2 })} />
      {children}
    </p>
  );
});

export default SectionHead;
