import React from "react";
import { SearchBar, Select } from "../shared";
import { ASSIGNMENT_STATUSES } from "../mockData";

function JobsFilters({ search, setSearch, filterStatus, setFilterStatus, loading, visibleCount }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
      <SearchBar value={search} onChange={setSearch} placeholder="Search by title, client, ID..." />
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        options={[
          { value: "", label: "All Statuses" },
          ...ASSIGNMENT_STATUSES.map((s) => ({ value: s, label: s })),
        ]}
      />
      <div className="ml-auto text-xs text-gray-500">
        {loading ? "Loading…" : `${visibleCount} job${visibleCount !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

export default React.memo(JobsFilters);
