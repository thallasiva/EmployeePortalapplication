import PasswordInput from "../../component/PasswordInput";
import { inputClassName, labelClassName } from "./shared";
function Field({
  label,
  name,
  formik,
  type = "text",
  autoComplete
}) {
  const error = formik.touched[name] && formik.errors[name];
  const props = {
    id: name,
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${name}-error` : undefined,
    className: `${inputClassName} ${error ? "border-red-400 bg-red-50/50" : ""}`
  };
  return <div className="min-w-0">
      <label htmlFor={name} className={labelClassName}>{label}</label>
      {type === "password" ? <PasswordInput {...props} className="" inputClassName={props.className} /> : <input {...props} type={type} />}
      {error && <p id={`${name}-error`} role="alert" className="mt-1 text-[0.76rem] text-red-600">{formik.errors[name]}</p>}
    </div>;
}
export { Field };
