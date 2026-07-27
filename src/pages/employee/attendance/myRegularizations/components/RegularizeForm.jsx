import React from "react";
import ApplyEmptyIllustration from "./ApplyEmptyIllustration";

const RegularizeForm = React.memo(function RegularizeForm({
  selectedIso,
  isException,
  reason,
  firstIn,
  lastOut,
  onReasonChange,
  onFirstInChange,
  onLastOutChange,
  onSubmit,
}) {
  const isExceptionDay =
    selectedIso && isException(new Date(selectedIso + "T12:00:00"));

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-lg min-h-[320px]">
      {isExceptionDay ? (
        <div className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Regularize —{" "}
            {new Date(selectedIso + "T12:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <div>
            <label className="text-xs text-slate-500">Reason</label>
            <select
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="mt-1 w-full max-w-md border border-slate-200 rounded-md py-2 px-3 text-sm"
            >
              <option>Early Logout</option>
              <option>Late Login</option>
              <option>Missed punch</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">First In Time</label>
            <input
              type="text"
              value={firstIn}
              onChange={(e) => onFirstInChange(e.target.value)}
              className="mt-1 w-full max-w-xs border border-slate-200 rounded-md py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Last Out Time</label>
            <input
              type="text"
              value={lastOut}
              onChange={(e) => onLastOutChange(e.target.value)}
              className="mt-1 w-full max-w-xs border border-slate-200 rounded-md py-2 px-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={onSubmit}
            className="px-6 py-2 text-sm font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600"
          >
            Submit Regularization
          </button>
        </div>
      ) : (
        <ApplyEmptyIllustration />
      )}
    </div>
  );
});

export default RegularizeForm;
