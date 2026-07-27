import React from "react";
import { Search } from "lucide-react";
import { usePagination } from "../../../components/Pagination";
import Pagination from "../../../components/Pagination";
import EmployeeGridCard, { EmployeeListTable } from "../../../component/employee/EmployeeViews";
import { cssClass } from "../../../utils/classStyles";
import "../../../component/employee/employee.css";
import { useEmployeeData } from "./hooks/useEmployeeData";
import EmployeeToolbar from "./components/EmployeeToolbar";
import EmployeeSearchBar from "./components/EmployeeSearchBar";
import TeamsSearchBar from "./components/TeamsSearchBar";
import TeamGroupedView from "./components/TeamGroupedView";
import FilterPill from "./components/FilterPill";

export default function Employee() {
  const {
    csvInputRef,
    loading,
    viewMode,
    setViewMode,
    selectedTab,
    setSelectedTab,
    search,
    setSearch,
    filterPanelOpen,
    setFilterPanelOpen,
    filteredEmployees,
    activeFilterCount,
    activePills,
    clearAllFilters,
    filterSections,
    handleCsvImport,
    handleCsvExport,
    employees,
  } = useEmployeeData();

  const {
    paged: pagedEmployees,
    page: empPage,
    setPage: setEmpPage,
    totalPages: empTotalPages,
    from: empFrom,
    to: empTo,
    total: empTotal,
    pageSize: empPageSize,
    setPageSize: setEmpPageSize,
  } = usePagination(filteredEmployees);

  return (
    <div className="space-y-6">
      <EmployeeToolbar
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        csvInputRef={csvInputRef}
        onCsvImport={handleCsvImport}
        onCsvExport={handleCsvExport}
      />

      {selectedTab === "All" && (
        <div className="space-y-3">
          <EmployeeSearchBar
            search={search}
            onSearchChange={setSearch}
            filterPanelOpen={filterPanelOpen}
            onOpenFilter={() => setFilterPanelOpen(true)}
            onCloseFilter={() => setFilterPanelOpen(false)}
            activeFilterCount={activeFilterCount}
            filteredCount={filteredEmployees.length}
            activePills={activePills}
            onClearAll={clearAllFilters}
            filterSections={filterSections}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Active filter pills + count */}
          <div
            className={cssClass({
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              minHeight: activePills.length > 0 ? 28 : 0,
            })}
          >
            {activePills.length > 0 && (
              <span className={cssClass({ fontSize: 12, color: "#94a3b8", fontWeight: 500 })}>
                {filteredEmployees.length} of {employees.length} employees
              </span>
            )}
            {activePills.length === 0 && !loading && (
              <span className={cssClass({ fontSize: 13, color: "#64748b", fontWeight: 500 })}>
                {loading ? "Loading…" : `${filteredEmployees.length} Employees`}
              </span>
            )}
            {activePills.map((p) => (
              <FilterPill key={p.id} label={p.label} onRemove={p.remove} />
            ))}
          </div>

          {/* Employee list / grid */}
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading employees…</p>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center">
              <Search size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-1">
                No employees match the current filters
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 text-sm text-brand hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <>
              <div className="emp-grid">
                {pagedEmployees.map((emp) => (
                  <EmployeeGridCard key={emp.employee_id} employee={emp} />
                ))}
              </div>
              <Pagination
                page={empPage}
                setPage={setEmpPage}
                totalPages={empTotalPages}
                from={empFrom}
                to={empTo}
                total={empTotal}
                pageSize={empPageSize}
                setPageSize={setEmpPageSize}
              />
            </>
          ) : (
            <>
              <EmployeeListTable employees={pagedEmployees} />
              <Pagination
                page={empPage}
                setPage={setEmpPage}
                totalPages={empTotalPages}
                from={empFrom}
                to={empTo}
                total={empTotal}
                pageSize={empPageSize}
                setPageSize={setEmpPageSize}
              />
            </>
          )}
        </div>
      )}

      {selectedTab === "Teams" && (
        <div className="space-y-3">
          <TeamsSearchBar
            search={search}
            onSearchChange={setSearch}
            filterPanelOpen={filterPanelOpen}
            onOpenFilter={() => setFilterPanelOpen(true)}
            onCloseFilter={() => setFilterPanelOpen(false)}
            activeFilterCount={activeFilterCount}
            filteredCount={filteredEmployees.length}
            activePills={activePills}
            onClearAll={clearAllFilters}
            filterSections={filterSections}
          />
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading employees…</p>
          ) : (
            <TeamGroupedView employees={filteredEmployees} />
          )}
        </div>
      )}
    </div>
  );
}
