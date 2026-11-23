import { inputClassName, labelClassName } from "./shared";
function SelectField({
  label,
  name,
  options,
  formik,
  onChange
}) {
  const error = formik.touched[name] && formik.errors[name];
  return <div className="min-w-0">
      <label htmlFor={name} className={labelClassName}>{label}</label>
      <select id={name} name={name} value={formik.values[name]} onChange={event => {
      formik.handleChange(event);
      const selected = options.find(option => String(option.value) === String(event.target.value));
      onChange?.(selected);
    }} onBlur={formik.handleBlur} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={`${inputClassName} ${error ? "border-red-400 bg-red-50/50" : ""}`}>
        <option value="">Choose an option</option>
        {options.map(option => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
      </select>
      {error && <p id={`${name}-error`} role="alert" className="mt-1 text-[0.76rem] text-red-600">{formik.errors[name]}</p>}
    </div>;
}
export { SelectField };
