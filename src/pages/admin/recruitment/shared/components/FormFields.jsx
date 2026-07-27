import React from "react";
import { inputCls } from "../constants";

export const Field = React.memo(function Field({ label, required, children, error }) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
});

export const Input = React.memo(function Input({ value, onChange, placeholder, type = "text", disabled, name, ...rest }) {
  return (
    <input
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${inputCls} ${disabled ? "bg-gray-50" : "bg-white"}`}
      style={{ fontFamily: "inherit" }}
      {...rest}
    />
  );
});

export const Select = React.memo(function Select({ value, onChange, options = [], placeholder, disabled, name }) {
  return (
    <select
      name={name}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className={`${inputCls} ${disabled ? "bg-gray-50 cursor-default" : "bg-white cursor-pointer"}`}
      style={{ fontFamily: "inherit" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
});

export const Textarea = React.memo(function Textarea({ value, onChange, placeholder, rows = 3, disabled, name }) {
  return (
    <textarea
      name={name}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`${inputCls} resize-y leading-relaxed ${disabled ? "bg-gray-50" : "bg-white"}`}
      style={{ fontFamily: "inherit" }}
    />
  );
});
