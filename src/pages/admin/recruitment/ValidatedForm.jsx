import { useState } from "react";
import Btn from "./Btn";
import { footerActionsClass, gridClass, inputClass, inputErrorClass, labelTextClass } from "./data";
import emptyValues from "./emptyValues";

function ValidatedForm({ fields, schema, columns = 4, submitLabel, secondaryLabel = "Cancel" })
{
  const [values, setValues] = useState(() => emptyValues(fields));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (name, value) =>
  {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const submit = async (event) =>
  {
    event.preventDefault();
    try
    {
      await schema.validate(values, { abortEarly: false });
      setErrors({});
      setSubmitted(true);
    }
    catch (err)
    {
      const nextErrors = {};
      err.inner?.forEach((item) =>
      {
        if (item.path && !nextErrors[item.path]) nextErrors[item.path] = item.message;
      });
      setErrors(nextErrors);
      setSubmitted(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className={gridClass[columns] || gridClass[4]}>
        {fields.map((field) =>
        {
          const controlClass = `${inputClass} ${errors[field.name] ? inputErrorClass : ""}`;
          return (
            <label key={field.name} className={field.full ? "col-span-full min-w-0" : "min-w-0"}>
              <div className={labelTextClass}>{field.name}</div>
              {field.type === "select" ? (
                <select value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} className={controlClass}>
                  <option value="">Select {field.name}</option>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === "textarea" ? (
                <textarea rows={field.rows || 4} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.name} className={controlClass} />
              ) : (
                <input type={field.type || "text"} value={values[field.name]} onChange={(event) => update(field.name, event.target.value)} placeholder={field.name} className={controlClass} />
              )}
              {errors[field.name] && <div className="mt-1 text-[10px] text-red-600">{errors[field.name]}</div>}
            </label>
          );
        })}
      </div>
      {submitted && <div className="px-[15px] pb-2.5 text-xs font-bold text-green-800">Validation passed.</div>}
      <div className={footerActionsClass}>
        <Btn>{secondaryLabel}</Btn>
        <Btn primary type="submit">{submitLabel}</Btn>
      </div>
    </form>
  );
}
export default ValidatedForm;