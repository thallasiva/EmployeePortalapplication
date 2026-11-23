import React from "react";
import { inputCls } from "../../constants";
const Select = React.memo(function Select({
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  name
}) {
  return <select name={name} value={value ?? ""} onChange={onChange} disabled={disabled} className={`${inputCls} ${disabled ? "bg-gray-50 cursor-default" : "bg-white cursor-pointer"}`} style={{
    fontFamily: "inherit"
  }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>;
});
export { Select };
