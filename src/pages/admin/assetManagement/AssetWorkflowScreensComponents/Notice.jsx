import React from "react";
function Notice({
  children,
  error = false
}) {
  return children ? <div role={error ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-800"}`}>{children}</div> : null;
}
export { Notice };
