import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { baseInp } from "../constants";
import Field from "./Field";

const FormSelect = React.memo(function FormSelect({
  label, value, onChange, onBlur, options = [], placeholder, required, error, touched,
}) {
  const hasErr = touched && error;
  return (
    <Field label={label} required={required} error={error} touched={touched}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cssClass({ ...baseInp(hasErr), background: hasErr ? "#fff5f5" : "#fff" })}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
});

export default FormSelect;
