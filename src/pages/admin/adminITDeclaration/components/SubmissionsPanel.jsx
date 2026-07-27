import React from "react";
import { RefreshCw, Users } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import Pagination from "../../../../components/Pagination";
import EmpRow from "./EmpRow";

const TABLE_HEADERS = ["Employee", "Job Title", "Status", "Total Declared", "Submitted", "Actions", ""];

const SubmissionsPanel = React.memo(function SubmissionsPanel({
  loading, visible, search, filter,
  onSearchChange, onFilterChange, onRefresh,
  paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize,
}) {
  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" })}>
      {/* Toolbar */}
      <div className={cssClass({ padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" })}>
        <input value={search} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search employee, dept…"
          className={cssClass({ flex: 1, minWidth: 200, height: 36, padding: "0 12px",
            border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" })} />
        <select value={filter} onChange={(e) => onFilterChange(e.target.value)}
          className={cssClass({ height: 36, padding: "0 10px", border: "1px solid #e2e8f0",
            borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" })}>
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
          <option value="not_started">Not Started</option>
        </select>
        <button onClick={onRefresh}
          className={cssClass({ height: 36, padding: "0 14px", background: "#fff",
            border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, color: "#64748b" })}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className={cssClass({ padding: 48, textAlign: "center", color: "#94a3b8" })}>Loading…</div>
      ) : visible.length === 0 ? (
        <div className={cssClass({ padding: 48, textAlign: "center", color: "#94a3b8" })}>
          <Users size={40} className={cssClass({ marginBottom: 12, color: "#cbd5e1" })} />
          <p className={cssClass({ margin: 0 })}>No submissions found.</p>
        </div>
      ) : (
        <div className={cssClass({ overflowX: "auto" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
            <thead>
              <tr className={cssClass({ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" })}>
                {TABLE_HEADERS.map((h) => (
                  <th key={h} className={cssClass({ padding: "10px 16px", textAlign: "left", fontSize: 11,
                    fontWeight: 700, color: "#94a3b8", textTransform: "uppercase",
                    letterSpacing: "0.06em", whiteSpace: "nowrap" })}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => <EmpRow key={row.employee_id} row={row} onRefresh={onRefresh} />)}
            </tbody>
          </table>
          <Pagination page={page} setPage={setPage} totalPages={totalPages}
            from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
        </div>
      )}
    </div>
  );
});

export default SubmissionsPanel;
