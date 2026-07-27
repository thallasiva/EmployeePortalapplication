import React from "react";

const PendingEmptyIllustration = React.memo(function PendingEmptyIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <svg width="160" height="100" viewBox="0 0 160 100" className="text-sky-200" aria-hidden>
        <rect x="50" y="35" width="60" height="40" rx="3" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <circle cx="80" cy="52" r="8" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <rect x="25" y="45" width="22" height="28" rx="2" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <ellipse cx="80" cy="22" rx="14" ry="9" stroke="currentColor" fill="none" strokeWidth="1.5" />
      </svg>
      <p className="mt-6 text-sm text-slate-400 text-center max-w-xs">
        Hey, you have no regularization records to view
      </p>
    </div>
  );
});

export default PendingEmptyIllustration;
