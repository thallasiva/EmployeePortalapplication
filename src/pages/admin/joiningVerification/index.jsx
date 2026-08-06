import React from "react";
import { FileCheck, RefreshCw } from "lucide-react";
import { useJoiningVerification } from "./hooks/useJoiningVerification";
import CandidatesTable from "./components/CandidatesTable";
import DetailModal from "./components/DetailModal";
import { FILTERS } from "./constants";

export default function JoiningVerification() {
  const {
    rows,
    loading,
    filter,
    setFilter,
    detail,
    detailId,
    selectedRow,
    remarks,
    setRemarks,
    decision,
    setDecision,
    reviewing,
    load,
    openDetail,
    submitReview,
    resend,
    closeDetail,
  } = useJoiningVerification();

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: "#d97706" }}>
            <FileCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Joining Formalities</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Review and approve joining formalities submitted by new employees
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
            style={
              filter === key
                ? { backgroundColor: "#d97706", color: "#fff", borderColor: "#d97706" }
                : { backgroundColor: "#fbcd97", color: "#92400e", borderColor: "#f59e0b" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <CandidatesTable
        rows={rows}
        loading={loading}
        onOpenDetail={openDetail}
        onResend={resend}
      />

      {/* Detail modal */}
      <DetailModal
        detailId={detailId}
        detail={detail}
        selectedRow={selectedRow}
        remarks={remarks}
        decision={decision}
        reviewing={reviewing}
        onClose={closeDetail}
        onSetDecision={setDecision}
        onSetRemarks={setRemarks}
        onSubmitReview={submitReview}
      />
    </div>
  );
}
