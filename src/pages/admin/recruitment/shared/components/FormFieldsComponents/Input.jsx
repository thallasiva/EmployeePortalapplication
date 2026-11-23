import React from "react";
import { inputCls } from "../../constants";
const Input = React.memo(function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  name,
  ...rest
}) {
  return <input name={name} type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} disabled={disabled} className={`${inputCls} ${disabled ? "bg-gray-50" : "bg-white"}`} style={{
    fontFamily: "inherit"
  }} {...rest} />;
});
export { Input };
