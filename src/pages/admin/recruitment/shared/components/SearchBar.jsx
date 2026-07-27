import React from "react";

export const SearchBar = React.memo(function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative inline-flex items-center">
      <svg className="absolute left-2.5 text-gray-400" width="15" height="15"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-60 box-border pl-[33px] pr-[11px] py-2 rounded-[7px] border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
});
