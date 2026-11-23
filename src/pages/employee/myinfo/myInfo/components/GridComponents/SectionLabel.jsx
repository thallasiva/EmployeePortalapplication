import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
const SectionLabel = React.memo(function SectionLabel({
  label,
  color = "#64748b"
}) {
  return <div className={cssClass({
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color,
    marginBottom: 10,
    marginTop: 14
  })}>
      {label}
    </div>;
});
export { SectionLabel };
