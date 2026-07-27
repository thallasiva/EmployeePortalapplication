import React from "react";
import Pagination from "../../../components/Pagination";
import AddSalaryModal from "../AddSalaryModal";
import { usePayRoll } from "./hooks/usePayRoll";
import PayRollHeader from "./components/PayRollHeader";
import TableFilters from "./components/TableFilters";
import EmployeeTable from "./components/EmployeeTable";
import GenerateSlipModal from "./components/GenerateSlipModal";

const PayRollForm = React.memo(function PayRollForm() {
  const {
    loading,
    search,
    setSearch,
    sortBy,
    setSortBy,
    exportOpen,
    setExportOpen,
    slipEmployee,
    setSlipEmployee,
    slipMonth,
    setSlipMonth,
    slipYear,
    setSlipYear,
    generating,
    salaryModal,
    setSalaryModal,
    saving,
    enriched,
    paginationData,
    handleSaveSalary,
    handleGenerateSlip,
    handleExport
  } = usePayRoll();

  const {
    paged: visible,
    page,
    setPage,
    totalPages,
    from,
    to,
    total,
    pageSize,
    setPageSize
  } = paginationData;

  return (
    <div className="admin-dash">
      <PayRollHeader
        exportOpen={exportOpen}
        onToggleExport={() => setExportOpen((o) => !o)}
        onExport={handleExport}
        onAddSalary={() => setSalaryModal({})}
      />

      <div className="admin-dash-card">
        <TableFilters
          search={search}
          onSearch={setSearch}
          sortBy={sortBy}
          onSort={setSortBy}
        />
        <EmployeeTable
          visible={visible}
          loading={loading}
          onGenerateSlip={setSlipEmployee}
          onEditSalary={setSalaryModal}
        />
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        from={from}
        to={to}
        total={total}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {slipEmployee && (
        <GenerateSlipModal
          slipEmployee={slipEmployee}
          slipMonth={slipMonth}
          slipYear={slipYear}
          generating={generating}
          onChangeMonth={setSlipMonth}
          onChangeYear={setSlipYear}
          onCancel={() => setSlipEmployee(null)}
          onGenerate={handleGenerateSlip}
        />
      )}

      {salaryModal && (
        <AddSalaryModal
          employees={enriched}
          initial={salaryModal}
          onClose={() => setSalaryModal(null)}
          onSave={handleSaveSalary}
          saving={saving}
        />
      )}
    </div>
  );
});

export default PayRollForm;
