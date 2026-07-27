import React from "react";
import { LogOut } from "lucide-react";
import { cssClass } from "../../../utils/classStyles";
import Pagination from "../../../components/Pagination";
import { useResignations } from "./hooks/useResignations";
import StatsBar from "./components/StatsBar";
import FilterBar from "./components/FilterBar";
import ResignList from "./components/ResignList";
import ReviewModal from "./components/ReviewModal";
import { BRAND } from "./constants";

export default function AdminResignations() {
  const {
    loading, error,
    search, setSearch, filter, setFilter,
    reviewing, setReviewing,
    load, visible, counts, pagination,
  } = useResignations();

  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = pagination;

  return (
    <div className={cssClass({ padding: "24px", fontFamily: "inherit", minHeight: "100vh", background: "#f5f7fb" })}>
      {/* Page heading */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 })}>
        <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
          display: "flex", alignItems: "center", justifyContent: "center" })}>
          <LogOut size={18} color={BRAND} />
        </div>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" })}>
            Resignation Management
          </h1>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>
            All employee resignation requests
          </p>
        </div>
      </div>

      <StatsBar counts={counts} />
      <FilterBar search={search} filter={filter} onSearchChange={setSearch} onFilterChange={setFilter} />
      <ResignList loading={loading} error={error} visible={visible} paged={paged} onReview={setReviewing} />

      {total > 0 && (
        <div className="mt-4">
          <Pagination page={page} setPage={setPage} totalPages={totalPages}
            from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
        </div>
      )}

      {reviewing && (
        <ReviewModal
          row={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => { setReviewing(null); load(); }}
        />
      )}
    </div>
  );
}
