import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { baseInp } from "../constants";
import Field from "./Field";

const FormInput = React.memo(function FormInput({
  label, value, onChange, onBlur, type = "text", required, error, touched, ...rest
}) {
  const hasErr = touched && error;
  return (
    <Field label={label} required={required} error={error} touched={touched}>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        {...rest}
        className={cssClass(baseInp(hasErr))}
      />
    </Field>
  );
});

export default FormInput;
