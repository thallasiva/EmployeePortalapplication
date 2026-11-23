import React from "react";
function ReportTableToolbar({
  title,
  filters = true
}) {
  return <>
      {title && <h2 className="report-table-section__title">{title}</h2>}
      <div className="report-table-toolbar">
        <div className="report-table-toolbar__left">
          <span className="report-table-toolbar__rows">
            Row Per Page <select defaultValue="10"><option>10</option><option>25</option></select> Entries
          </span>
        </div>
        {filters && <div className="report-table-toolbar__filters">
            <button type="button" className="report-filter-btn">29/05/2026 - 29/05/2026</button>
            <select className="report-filter-select" defaultValue="">
              <option value="">Select Status</option>
              <option>Active</option>
              <option>Pending</option>
            </select>
            <select className="report-filter-select" defaultValue="7">
              <option value="7">Sort By : Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
            <input type="search" className="report-search" placeholder="Search" />
          </div>}
      </div>
    </>;
}
export { ReportTableToolbar };
