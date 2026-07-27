import React, { useState } from "react";
import { usePagination } from "../../../components/Pagination";
import { usePayslips } from "./hooks/usePayslips";
import PayslipsHeader from "./components/PayslipsHeader";
import PayslipTable from "./components/PayslipTable";
import ImportSalaryStructureModal from "./components/ImportSalaryStructureModal";
import GenerateAllResultModal from "./components/GenerateAllResultModal";

const AdminPayslips = React.memo(function AdminPayslips() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showImportModal, setShowImportModal] = useState(false);

  const {
    payslips,
    loading,
    generating,
    generateResult,
    setGenerateResult,
    downloadingId,
    loadPayslips,
    handleGenerateAll,
    handleMarkPaid,
    handleDownloadPdf,
  } = usePayslips(month, year);

  const pagination = usePagination(payslips);

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <PayslipsHeader
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        generating={generating}
        onImport={() => setShowImportModal(true)}
        onGenerateAll={handleGenerateAll}
      />

      <PayslipTable
        month={month}
        year={year}
        loading={loading}
        pagination={pagination}
        downloadingId={downloadingId}
        onMarkPaid={handleMarkPaid}
        onDownloadPdf={handleDownloadPdf}
      />

      {showImportModal && (
        <ImportSalaryStructureModal
          onClose={() => setShowImportModal(false)}
          onImported={loadPayslips}
        />
      )}

      {generateResult && (
        <GenerateAllResultModal
          result={generateResult}
          onClose={() => setGenerateResult(null)}
        />
      )}
    </div>
  );
});

export default AdminPayslips;
