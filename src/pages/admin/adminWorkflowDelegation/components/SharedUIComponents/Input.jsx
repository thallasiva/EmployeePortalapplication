import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const Input = React.memo(function Input({
  style,
  ...props
}) {
  return <input {...props} className={cssClass({
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    ...style
  })} />;
});
export { Input };
