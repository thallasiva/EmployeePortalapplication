import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
const NoData = React.memo(function NoData() {
  return <div className={cssClass({
    padding: "20px 14px",
    textAlign: "center",
    color: "#e87500",
    fontSize: 12,
    fontWeight: 600,
    background: "#fff",
    borderBottom: "1px solid #e2e8f0"
  })}>
      No data to display !!!
    </div>;
});
export { NoData };
