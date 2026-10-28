import React from "react";
import { AlertTriangle } from "lucide-react";
const ChangesRequestedBanner = React.memo(function ChangesRequestedBanner({ inv }) {
  if (inv?.formality_status !== "changes_requested") return null;
  return (
    <div className="max-w-5xl mx-auto mt-4 px-4">
      <div className="flex items-start gap-3 rounded-xl border-2 border-amber-600 bg-amber-50 px-4 py-3.5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-[13px] font-bold text-amber-900">
            HR has requested changes to your submission
          </p>
          {inv?.hr_remarks ? (
            <p className="text-[12px] text-amber-800 mt-1 leading-relaxed">{inv.hr_remarks}</p>
          ) : (
            <p className="text-[12px] text-amber-700 mt-1">
              Please review your information, make the required corrections, and re-submit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
export default ChangesRequestedBanner;
