import React, { useState, useCallback } from "react";
import { LogOut, Search, AlertTriangle } from "lucide-react";
import Pagination, { usePagination } from "../../../components/Pagination";
import ManagerTabs from "../ManagerTabs";
import { useTeamResignations } from "./hooks/useTeamResignations";
import { BRAND, FILTERS } from "./constants";
import { cssClass } from "../../../utils/classStyles";
import ResignRow from "./components/ResignRow";
import ReviewModal from "./components/ReviewModal";

const TeamResignations = React.memo(function TeamResignations() {
  const { loading, error, search, setSearch, filter, setFilter, visible, pending, load } =
    useTeamResignations();
  const [reviewing, setReviewing] = useState(null);

  const handleDone = useCallback(() => { setReviewing(null); load(); }, [load]);
  const handleClose = useCallback(() => setReviewing(null), []);

  const { paged: pagedRes, page: resPage, setPage: setResPage, totalPages: resTotalPages,
    from: resFrom, to: resTo, total: resTotal, pageSize: resPageSize, setPageSize: setResPageSize,
  } = usePagination(visible);

  return (
    <div className={cssClass({ padding: "24px", fontFamily: "inherit", minHeight: "100vh", background: "#f5f7fb" })}>
      <ManagerTabs />

      <div className={cssClass({ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 })}>
        <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
          display: "flex", alignItems: "center", justifyContent: "center" })}>
          <LogOut size={18} color={BRAND} />
        </div>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" })}>Team Resignations</h1>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>Review and approve your team's exit requests</p>
        </div>
        {pending > 0 && (
          <span className={cssClass({ marginLeft: "auto", padding: "6px 16px", borderRadius: 999,
            background: "#fff7ed", border: "1.5px solid #fed7aa",
            fontSize: 13, fontWeight: 700, color: BRAND })}>
            {pending} pending review{pending !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" })}>
        <div className={cssClass({ position: "relative", flex: 1, minWidth: 200 })}>
          <Search size={14} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or department…"
            className={cssClass({ width: "100%", boxSizing: "border-box", height: 38, paddingLeft: 34, paddingRight: 12,
              border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none",
              background: "#fff", fontFamily: "inherit" })} />
        </div>
        <div className={cssClass({ display: "flex", gap: 4, padding: 3, background: "#f1f5f9", borderRadius: 10 })}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cssClass(
              { padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: filter === f.key ? "#fff" : "transparent",
                color: filter === f.key ? "#1e293b" : "#64748b",
                boxShadow: filter === f.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" })}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>Loading…</div>
      ) : error ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#dc2626" })}>
          <AlertTriangle size={40} color="#fca5a5" className={cssClass({ marginBottom: 12 })} />
          <p className={cssClass({ margin: 0 })}>{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8" })}>
          <LogOut size={40} color="#e2e8f0" className={cssClass({ marginBottom: 12 })} />
          <p className={cssClass({ margin: 0 })}>No resignation requests found.</p>
        </div>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          {pagedRes.map((r) => (
            <ResignRow key={r.resignation_id} row={r} onReview={setReviewing} />
          ))}
          <Pagination page={resPage} setPage={setResPage} totalPages={resTotalPages}
            from={resFrom} to={resTo} total={resTotal}
            pageSize={resPageSize} setPageSize={setResPageSize} />
        </div>
      )}

      {reviewing && (
        <ReviewModal row={reviewing} onClose={handleClose} onDone={handleDone} />
      )}
    </div>
  );
});

export default TeamResignations;
