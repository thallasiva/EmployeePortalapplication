import React from "react";
import { XCircle } from "lucide-react";
import PersonalStatutorySection from "./PersonalStatutorySection";
import NomineeSections from "./NomineeSections";
import DocumentsSection from "./DocumentsSection";
import DecisionPanel from "./DecisionPanel";

const DetailModal = React.memo(function DetailModal({
  detailId,
  detail,
  selectedRow,
  remarks,
  decision,
  reviewing,
  onClose,
  onSetDecision,
  onSetRemarks,
  onSubmitReview,
}) {
  if (!detailId) return null;

  const displayName =
    detail?.candidate_name || selectedRow?.candidate_name || "…";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-amber-100 flex-shrink-0"
          style={{ background: "linear-gradient(to right, #6B5133, #8B7355)" }}
        >
          <div className="flex items-center gap-3">
            {detail?.photo_url ? (
              <img
                src={detail.photo_url}
                alt="photo"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold border-2 border-white/40"
                style={{ backgroundColor: "#d97706", color: "#fff" }}
              >
                {initials}
              </div>
            )}
            <div>
              <p className="font-bold text-white text-[15px]">{displayName}</p>
              {(detail?.job_title || selectedRow?.job_title) && (
                <p className="text-[11px] text-amber-200">
                  {detail?.job_title || selectedRow?.job_title}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {!detail ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#d97706", borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            <>
              <PersonalStatutorySection detail={detail} />
              <NomineeSections detail={detail} />
              <DocumentsSection detail={detail} />
              <DecisionPanel
                detail={detail}
                decision={decision}
                remarks={remarks}
                onSetDecision={onSetDecision}
                onSetRemarks={onSetRemarks}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium border rounded-lg"
            style={{ color: "#d97706", borderColor: "#d97706", backgroundColor: "#fff" }}
          >
            Close
          </button>
          {decision && (
            <button
              onClick={onSubmitReview}
              disabled={reviewing}
              className="px-4 py-2 text-[13px] font-medium text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#d97706" }}
            >
              {reviewing ? "Submitting..." : "Confirm Decision"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default DetailModal;
