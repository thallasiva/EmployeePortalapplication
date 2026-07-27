import React from "react";

const FilterBar = React.memo(function FilterBar({ filterType, onFilterTypeChange, canViewAll }) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] text-[#64748b] mb-1.5">Filter Type</label>
      <select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value)}
        className="h-10 w-44 border border-[#dbe2ea] rounded px-3 bg-white text-sm outline-none"
      >
        <option value="Me">Me</option>
        {canViewAll && <option value="Team">Team</option>}
        {canViewAll && <option value="Department">Department</option>}
      </select>
    </div>
  );
});

export default FilterBar;
