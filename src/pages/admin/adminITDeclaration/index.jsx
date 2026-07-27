import React from "react";
import { cssClass } from "../../../utils/classStyles";
import { useITDeclaration } from "./hooks/useITDeclaration";
import ITHeader from "./components/ITHeader";
import SettingsTab from "./components/SettingsTab";
import StatsBar from "./components/StatsBar";
import SubmissionsPanel from "./components/SubmissionsPanel";

export default function AdminITDeclaration() {
  const {
    cycle, loading, toggling, tab, setTab,
    search, setSearch, filter, setFilter,
    isActive, visible, stats, pagination,
    load, handleToggle,
  } = useITDeclaration();

  const {
    paged, page, setPage, totalPages,
    from, to, total, pageSize, setPageSize,
  } = pagination;

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      <ITHeader
        cycle={cycle}
        isActive={isActive}
        tab={tab}
        setTab={setTab}
        submittedCount={stats.submitted + stats.approved}
      />

      {tab === "settings" && (
        <SettingsTab
          cycle={cycle}
          isActive={isActive}
          toggling={toggling}
          onToggle={handleToggle}
        />
      )}

      {tab === "submissions" && (
        <>
          <StatsBar stats={stats} />
          <SubmissionsPanel
            loading={loading}
            visible={visible}
            search={search}
            filter={filter}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onRefresh={load}
            paged={paged}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            from={from}
            to={to}
            total={total}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </>
      )}
    </div>
  );
}
