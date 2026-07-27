import React from "react";
import { Search } from "lucide-react";
import { SORT_OPTIONS } from "../constants";

const TableFilters = React.memo(function TableFilters({ search, onSearch, sortBy, onSort }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full sm:w-64">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, email or code…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
});

export default TableFilters;
