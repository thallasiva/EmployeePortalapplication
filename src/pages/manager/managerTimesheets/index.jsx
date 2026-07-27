import React, { useState, useCallback } from "react";
import { usePagination } from "../../../components/Pagination";
import ManagerTabs from "../ManagerTabs";
import { useManagerTimesheets } from "./hooks/useManagerTimesheets";
import SummaryCards from "./components/SummaryCards";
import PanelTabs from "./components/PanelTabs";
import FilterBar from "./components/FilterBar";
import TimesheetTable from "./components/TimesheetTable";
import ExtraWorkPanel from "./components/ExtraWorkPanel";
import TimesheetDetailModal from "./components/TimesheetDetailModal";
import "../../admin/adminDashboard.css";

export default function ManagerTimesheets() {
  const { timesheets, loading, filter, setFilter, counts, load } =
    useManagerTimesheets();
  const [viewId, setViewId] = useState(null);
  const [activePanel, setActivePanel] = useState("timesheets");
  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } =
    usePagination(timesheets);

  const handleCloseModal = useCallback(() => setViewId(null), []);

  return (
    <div className="admin-dash space-y-4">
      <ManagerTabs />
      <SummaryCards counts={counts} />
      <PanelTabs activePanel={activePanel} setActivePanel={setActivePanel} />

      {activePanel === "timesheets" && (
        <>
          <FilterBar filter={filter} setFilter={setFilter} />
          <TimesheetTable
            loading={loading}
            timesheets={timesheets}
            setViewId={setViewId}
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

      {activePanel === "extrawork" && <ExtraWorkPanel />}

      {viewId && (
        <TimesheetDetailModal
          timesheetId={viewId}
          onClose={handleCloseModal}
          onReviewed={load}
        />
      )}
    </div>
  );
}
