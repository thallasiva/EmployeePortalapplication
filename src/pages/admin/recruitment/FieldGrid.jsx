import { gridClass, inputClass, labelTextClass } from "./data";

function FieldGrid({ fields, columns = 3, readOnly = false })
{
  return (
    <div className={gridClass[columns] || gridClass[3]}>
      {fields.map((field) => (
        <label key={field} className="min-w-0">
          <div className={labelTextClass}>{field}</div>
          <input readOnly={readOnly} placeholder={field} className={inputClass} />
        </label>
      ))}
    </div>
  );
}

export default FieldGrid;
