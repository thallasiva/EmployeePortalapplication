import React from "react";
import PendingEmptyIllustration from "./PendingEmptyIllustration";

const PendingTab = React.memo(function PendingTab({ pendingItems }) {
  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-lg">
      {pendingItems.length === 0 ? (
        <PendingEmptyIllustration />
      ) : (
        <ul className="p-4 space-y-3">
          {pendingItems.map((item) => (
            <li
              key={item.id}
              className="border border-sky-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.datesApplied}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.reason} · {item.firstIn} – {item.lastOut}
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default PendingTab;
