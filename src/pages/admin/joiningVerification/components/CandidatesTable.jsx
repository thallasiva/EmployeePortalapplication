import React from "react";
import { Eye, Send, Clock } from "lucide-react";
import Pagination, { usePagination } from "../../../../components/Pagination";
import { STATUS } from "../constants";
import { fmt } from "../utils";

const CandidatesTable = React.memo(function CandidatesTable({
  rows,
  loading,
  onOpenDetail,
  onResend,
}) {
  const {
    paged: pagedRows,
    page,
    setPage,
    totalPages,
    from,
    to,
    total,
    pageSize,
    setPageSize,
  } = usePagination(rows);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div
            className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#d97706", borderTopColor: "transparent" }}
          />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="text-center py-16">
          <Clock size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-[13px] text-gray-400">No records found for this filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr
              style={{ backgroundColor: "#d97706" }}
              className="text-white text-[11px] uppercase tracking-wider"
            >
              <th className="text-left px-4 py-3 font-semibold">Candidate</th>
              <th className="text-left px-4 py-3 font-semibold">Position</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Submitted</th>
              <th className="text-left px-4 py-3 font-semibold">Expires</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedRows.map((r) => {
              const s = r.invitation_status || r.formality_status || "pending";
              const badge = STATUS[s] || STATUS.pending;
              const initials = (r.candidate_name || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ backgroundColor: "#fde68a", color: "#92400e" }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{r.candidate_name || "—"}</p>
                        <p className="text-[11px] text-gray-400">{r.candidate_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.job_title || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(r.submitted_at)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(r.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.formality_id && (
                        <button
                          onClick={() => onOpenDetail(r.id, r)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors text-white"
                          style={{ backgroundColor: "#d97706" }}
                        >
                          <Eye size={12} /> Review
                        </button>
                      )}
                      {(s === "pending" || s === "changes_requested") && (
                        <button
                          onClick={() => onResend(r.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
                          style={{ backgroundColor: "#fbcd97", color: "#92400e" }}
                        >
                          <Send size={12} /> Resend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
      </div>
    </div>
  );
});

export default CandidatesTable;
