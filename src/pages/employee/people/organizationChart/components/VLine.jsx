import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const VLine = React.memo(function VLine({ height = 36 }) {
  return (
    <div className={cssClass({ width: 2, height, background: "#cbd5e1", margin: "0 auto" })} />
  );
});

export default VLine;
