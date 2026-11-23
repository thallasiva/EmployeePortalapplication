import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const SectionHead = React.memo(function SectionHead({
  children
}) {
  return <div className={cssClass({
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16
  })}>
      {children}
    </div>;
});
export { SectionHead };
