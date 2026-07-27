import React from "react";

const PageHeader = React.memo(function PageHeader({ inv }) {
  const statusLabel =
    inv?.formality_status === "submitted"
      ? "Submitted"
      : inv?.formality_status === "pending_verification"
      ? "Under Review"
      : inv?.formality_status === "changes_requested"
      ? "⚠ Changes Requested"
      : "In Progress";

  return (
    <div className="bg-[#1e3a5f] px-6 py-5">
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Joining Formalities</h1>
          <p className="text-[13px] text-amber-200 mt-0.5">
            Welcome, <strong className="text-white">{inv?.candidate_name}</strong>
            {inv?.job_title ? <> &mdash; {inv.job_title}</> : ""}
          </p>
        </div>
        <div className="rounded-full border border-white/30 bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white">
          {statusLabel}
        </div>
      </div>
    </div>
  );
});

export default PageHeader;
