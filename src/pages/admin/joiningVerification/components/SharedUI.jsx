import React from "react";

export const Row = React.memo(function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-amber-50 last:border-0 text-[13px]">
      <span className="text-gray-400 w-44 flex-shrink-0 text-[12px]">{label}</span>
      <span className="font-medium text-gray-800 text-right break-all">{value || "—"}</span>
    </div>
  );
});

export const Sec = React.memo(function Sec({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6B5133] to-[#8B7355]">
        <Icon size={13} className="text-white/80" />
        <span className="text-[12px] font-bold text-white uppercase tracking-wide">{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
});

export const AdminCombo = React.memo(function AdminCombo({
  label, name, value, onChange, options, listId, placeholder,
}) {
  return (
    <div className="mb-2">
      <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">
        {label}
      </label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
        className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white"
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o.value} value={o.value} />)}
      </datalist>
    </div>
  );
});

export const AdminSelect = React.memo(function AdminSelect({
  label, name, value, onChange, options, placeholder,
}) {
  return (
    <div className="mb-2">
      <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-0.5">
        {label}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white font-sans"
      >
        <option value="">{placeholder || `Select ${label}...`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
});

export const TblHead = React.memo(function TblHead({ cols }) {
  return (
    <thead>
      <tr className="bg-amber-50">
        {cols.map((c) => (
          <th
            key={c}
            className="px-3 py-2 text-left text-[10px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-100"
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
});
