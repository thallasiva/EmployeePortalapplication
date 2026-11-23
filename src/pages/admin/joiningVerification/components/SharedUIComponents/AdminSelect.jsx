import React from "react";
const AdminSelect = React.memo(function AdminSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder
}) {
  return <div className="mb-2">
      <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">
        {label}
      </label>
      <select name={name} value={value || ""} onChange={onChange} className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white font-sans">
        <option value="">{placeholder || `Select ${label}...`}</option>
        {options.map(o => <option key={o.value} value={o.value}>
            {o.label}
          </option>)}
      </select>
    </div>;
});
export { AdminSelect };
