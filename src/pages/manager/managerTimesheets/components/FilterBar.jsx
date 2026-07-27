import React from "react";
import { FILTER_OPTIONS } from "../constants";

const FilterBar = React.memo(function FilterBar({ filter, setFilter }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {FILTER_OPTIONS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => setFilter(f)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors capitalize ${
            filter === f
              ? "bg-brand text-white border-brand"
              : "bg-white text-gray-600 border-gray-200 hover:border-brand"
          }`}
        >
          {f === "all" ? "All" : f}
        </button>
      ))}
    </div>
  );
});

export default FilterBar;
