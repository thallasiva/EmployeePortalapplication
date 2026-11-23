import React from "react";
const AdminCombo = React.memo(function AdminCombo({
  label,
  name,
  value,
  onChange,
  options,
  listId,
  placeholder
}) {
  return <div className="mb-2">
      <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">
        {label}
      </label>
      <input name={name} value={value || ""} onChange={onChange} placeholder={placeholder} list={listId} autoComplete="off" className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white" />
      <datalist id={listId}>
        {options.map(o => <option key={o.value} value={o.value} />)}
      </datalist>
    </div>;
});
export { AdminCombo };
