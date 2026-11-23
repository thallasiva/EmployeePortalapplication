import React from "react";
function ErrorDemo({
  shouldThrow
}) {
  if (shouldThrow) {
    throw new Error("This demo intentionally triggered an error");
  }
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      The error boundary is ready. Click the button to see a controlled fallback.
    </div>;
}
export { ErrorDemo };
