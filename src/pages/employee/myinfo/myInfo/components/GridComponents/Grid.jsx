import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
const Grid = React.memo(function Grid({
  children,
  cols = 3
}) {
  return <div className={cssClass({
    display: "grid",
    gridTemplateColumns: `repeat(${cols},1fr)`,
    gap: "4px 16px"
  })}>
      {children}
    </div>;
});
export { Grid };
