import React from "react";
import { inputCls } from "../../constants";
const Textarea = React.memo(function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  name
}) {
  return <textarea name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={rows} className={`${inputCls} resize-y leading-relaxed ${disabled ? "bg-gray-50" : "bg-white"}`} style={{
    fontFamily: "inherit"
  }} />;
});
export { Textarea };
