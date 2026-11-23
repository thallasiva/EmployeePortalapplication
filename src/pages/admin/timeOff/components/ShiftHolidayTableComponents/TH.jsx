import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const TH = ({
  children
}) => <th className={cssClass({
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: 11,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: ".06em",
  textAlign: "left",
  borderBottom: "1px solid #e9eaec",
  background: "#fafafa",
  whiteSpace: "nowrap"
})}>
    {children}
  </th>;
export { TH };
